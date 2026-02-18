import type { FrequencyConfig } from '@/components/FrequencyControl';
import type { GainConfig } from '@/components/GainControl';
import type { ClockConfiguration } from '@/components/ClockConfig';
import type { SampleRateConfig } from '@/components/SampleRateConfig';
import type { BufferSizeConfiguration } from '@/components/BufferSizeConfig';
import type { ChannelConfiguration } from '@/components/ChannelConfig';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  category: string;
  message: string;
  suggestion?: string;
  affectedFields: string[];
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

// RF Path frequency ranges (in MHz)
// IDs match RFPathSelector.tsx component values
const RF_PATH_RANGES: Record<string, { min: number; max: number; name: string }> = {
  // Duplexer-backed cellular bands (tight frequency constraints)
  'band2': { min: 1850, max: 1990, name: 'Band 2 / PCS / GSM1900' },
  'band3': { min: 1710, max: 1880, name: 'Band 3 / DCS / GSM1800' },
  'band5': { min: 824, max: 894, name: 'Band 5 / GSM850' },
  'band7': { min: 2500, max: 2690, name: 'Band 7 / IMT-E' },
  'band8': { min: 880, max: 960, name: 'Band 8 / GSM900' },
  // RX-only paths
  'rxl': { min: 0, max: 1200, name: 'RX Low Band' },
  'rxw': { min: 0, max: 4200, name: 'RX Wide Band' },
  'rxh': { min: 2100, max: 4200, name: 'RX High Band' },
  'adc': { min: 0, max: 6000, name: 'Direct ADC' },
  'rxl_lb': { min: 0, max: 1200, name: 'RX Low Loopback' },
  'rxw_lb': { min: 0, max: 4200, name: 'RX Wide Loopback' },
  'rxh_lb': { min: 2100, max: 4200, name: 'RX High Loopback' },
  // TX-only paths
  'txb1': { min: 0, max: 1200, name: 'TX Band 1' },
  'txb2': { min: 1200, max: 2600, name: 'TX Band 2' },
  'txw': { min: 0, max: 4200, name: 'TX Wide Band' },
  'txh': { min: 2600, max: 4200, name: 'TX High Band' },
  // Auto paths
  'rx_auto': { min: 0, max: 4200, name: 'RX Auto' },
  'tx_auto': { min: 0, max: 4200, name: 'TX Auto' },
};

// Maximum sample rates for different connection types (in MHz)
const MAX_SAMPLE_RATES: Record<string, number> = {
  'pcie': 70,
  'usb': 30,
  'usb3': 40,
  'usb2': 10,
  'ethernet': 30,
};

export function validateConfiguration(
  mode: 'rx' | 'tx' | 'trx',
  rfPath: string,
  frequency: FrequencyConfig,
  gain: GainConfig,
  clock: ClockConfiguration,
  sampleRate: SampleRateConfig,
  bufferSize: BufferSizeConfiguration,
  channels: ChannelConfiguration,
  apiType?: 'libusdr' | 'soapysdr'
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. RF Path Frequency Range Validation
  if (rfPath && RF_PATH_RANGES[rfPath]) {
    const pathRange = RF_PATH_RANGES[rfPath];
    
    // Check RX frequency
    if (mode !== 'tx') {
      const rxFreqMHz = frequency.rxCenter / 1_000_000;
      if (rxFreqMHz < pathRange.min || rxFreqMHz > pathRange.max) {
        issues.push({
          id: 'rx-freq-out-of-range',
          severity: 'error',
          category: 'Frequency',
          message: `RX frequency ${rxFreqMHz.toFixed(3)} MHz is outside the valid range for ${pathRange.name} (${pathRange.min}-${pathRange.max} MHz)`,
          suggestion: `Valid range: ${pathRange.min} MHz to ${pathRange.max} MHz. Current value is ${rxFreqMHz < pathRange.min ? (pathRange.min - rxFreqMHz).toFixed(1) + ' MHz below' : (rxFreqMHz - pathRange.max).toFixed(1) + ' MHz above'} the limit.`,
          affectedFields: ['frequency', 'rfPath'],
        });
      }
    }

    // Check TX frequency
    if (mode !== 'rx') {
      const txFreqMHz = frequency.txCenter / 1_000_000;
      if (txFreqMHz < pathRange.min || txFreqMHz > pathRange.max) {
        issues.push({
          id: 'tx-freq-out-of-range',
          severity: 'error',
          category: 'Frequency',
          message: `TX frequency ${txFreqMHz.toFixed(3)} MHz is outside the valid range for ${pathRange.name} (${pathRange.min}-${pathRange.max} MHz)`,
          suggestion: `Valid range: ${pathRange.min} MHz to ${pathRange.max} MHz. Current value is ${txFreqMHz < pathRange.min ? (pathRange.min - txFreqMHz).toFixed(1) + ' MHz below' : (txFreqMHz - pathRange.max).toFixed(1) + ' MHz above'} the limit.`,
          affectedFields: ['frequency', 'rfPath'],
        });
      }
    }
  }

  // 2. Sample Rate vs Bandwidth Validation
  if (mode !== 'tx') {
    const rxBandwidthMHz = frequency.rxBandwidth / 1_000_000;
    const sampleRateMHz = sampleRate.sampleRate / 1_000_000;
    
    if (rxBandwidthMHz > sampleRateMHz) {
      issues.push({
        id: 'rx-bandwidth-exceeds-sample-rate',
        severity: 'error',
        category: 'Sample Rate',
        message: `RX bandwidth (${rxBandwidthMHz.toFixed(3)} MHz) exceeds sample rate (${sampleRateMHz.toFixed(3)} MHz) - signals will be aliased`,
        suggestion: `Increase sample rate to at least ${(rxBandwidthMHz * 1.1).toFixed(3)} MHz or reduce RX bandwidth to ${(sampleRateMHz * 0.8).toFixed(3)} MHz`,
        affectedFields: ['frequency', 'sampleRate'],
      });
    } else if (rxBandwidthMHz > sampleRateMHz * 0.8) {
      issues.push({
        id: 'rx-bandwidth-near-sample-rate',
        severity: 'warning',
        category: 'Sample Rate',
        message: `RX bandwidth is ${((rxBandwidthMHz / sampleRateMHz) * 100).toFixed(0)}% of sample rate`,
        suggestion: `Consider increasing sample rate to ${(rxBandwidthMHz * 1.25).toFixed(1)} MHz for better filtering`,
        affectedFields: ['frequency', 'sampleRate'],
      });
    }
  }

  if (mode !== 'rx') {
    const txBandwidthMHz = frequency.txBandwidth / 1_000_000;
    const sampleRateMHz = sampleRate.sampleRate / 1_000_000;
    
    if (txBandwidthMHz > sampleRateMHz) {
      issues.push({
        id: 'tx-bandwidth-exceeds-sample-rate',
        severity: 'error',
        category: 'Sample Rate',
        message: `TX bandwidth (${txBandwidthMHz.toFixed(3)} MHz) exceeds sample rate (${sampleRateMHz.toFixed(3)} MHz) - output will be distorted`,
        suggestion: `Increase sample rate to at least ${(txBandwidthMHz * 1.1).toFixed(3)} MHz or reduce TX bandwidth to ${(sampleRateMHz * 0.8).toFixed(3)} MHz`,
        affectedFields: ['frequency', 'sampleRate'],
      });
    }
  }

  // 3. Sample Rate vs Connection Type Validation
  const maxSampleRate = MAX_SAMPLE_RATES[sampleRate.connectionType] || 70;
  const sampleRateMHz = sampleRate.sampleRate / 1_000_000;
  
  if (sampleRateMHz > maxSampleRate) {
    issues.push({
      id: 'sample-rate-exceeds-connection',
      severity: 'error',
      category: 'Sample Rate',
      message: `Sample rate ${sampleRateMHz.toFixed(3)} MHz exceeds ${sampleRate.connectionType.toUpperCase()} maximum (${maxSampleRate} MHz) by ${(sampleRateMHz - maxSampleRate).toFixed(1)} MHz`,
      suggestion: `Reduce sample rate to ${maxSampleRate} MHz or switch to ${sampleRate.connectionType === 'usb' ? 'PCIe (70 MHz max)' : 'a faster connection'}`,
      affectedFields: ['sampleRate'],
    });
  } else if (sampleRateMHz > maxSampleRate * 0.9) {
    issues.push({
      id: 'sample-rate-near-limit',
      severity: 'warning',
      category: 'Sample Rate',
      message: `Sample rate is ${((sampleRateMHz / maxSampleRate) * 100).toFixed(0)}% of ${sampleRate.connectionType.toUpperCase()} maximum`,
      suggestion: `Consider reducing sample rate for more stable operation or upgrade to faster connection`,
      affectedFields: ['sampleRate'],
    });
  }

  // 4. Gain Saturation Warnings
  if (mode !== 'tx') {
    const totalRxGain = gain.rxLna + gain.rxPga + gain.rxVga;
    
    if (totalRxGain > 70) {
      issues.push({
        id: 'rx-gain-saturation-risk',
        severity: 'warning',
        category: 'Gain',
        message: `Total RX gain (${totalRxGain} dB) exceeds recommended maximum (70 dB) - high risk of ADC saturation`,
        suggestion: `Reduce total gain by ${totalRxGain - 70} dB. Recommended: LNA=${Math.min(40, gain.rxLna)} dB, PGA=${Math.min(19, Math.max(0, 70 - gain.rxLna - gain.rxVga))} dB, VGA=${gain.rxVga} dB`,
        affectedFields: ['gain'],
      });
    }

    if (gain.rxLna > 30 && gain.rxPga > 15) {
      issues.push({
        id: 'rx-lna-pga-high',
        severity: 'info',
        category: 'Gain',
        message: `Both LNA (${gain.rxLna} dB) and PGA (${gain.rxPga} dB) are set high`,
        suggestion: `For weak signals, prefer LNA gain over PGA to minimize noise figure`,
        affectedFields: ['gain'],
      });
    }
  }

  if (mode !== 'rx') {
    if (gain.txGain > 60) {
      issues.push({
        id: 'tx-gain-high',
        severity: 'warning',
        category: 'Gain',
        message: `TX gain (${gain.txGain} dB) exceeds recommended maximum (60 dB) - may cause PA distortion and spurious emissions`,
        suggestion: `Reduce TX gain to 60 dB or lower. Use external attenuator if more output power is needed. Current excess: ${gain.txGain - 60} dB`,
        affectedFields: ['gain'],
      });
    }
  }

  // 5. Buffer Size vs Throughput Validation
  const BYTES_PER_SAMPLE: Record<string, number> = {
    'ci16': 4, 'ci12': 3, 'cf32': 8, 'cs8': 2,
    'cs16': 4, 'cf32@ci12': 8, 'cfftlpwri16': 4,
  };
  const bytesPerSample = BYTES_PER_SAMPLE[sampleRate.dataFormat] ?? 4;
  const samplesPerSecond = sampleRate.sampleRate;
  const throughputMBps = (samplesPerSecond * bytesPerSample) / (1024 * 1024);
  
  if (mode !== 'tx') {
    const rxBufferTimeMicros = (bufferSize.rxBufferSize / samplesPerSecond) * 1_000_000;
    
    if (rxBufferTimeMicros < 100) {
      issues.push({
        id: 'rx-buffer-too-small',
        severity: 'error',
        category: 'Buffer',
        message: `RX buffer (${bufferSize.rxBufferSize} samples) provides only ${rxBufferTimeMicros.toFixed(1)} µs buffering - insufficient for stable streaming`,
        suggestion: `Minimum recommended: ${Math.ceil((samplesPerSecond * 0.001) / 1024) * 1024} samples (1 ms). Recommended: ${Math.ceil((samplesPerSecond * 0.010) / 1024) * 1024} samples (10 ms) for reliable operation`,
        affectedFields: ['buffer', 'sampleRate'],
      });
    } else if (rxBufferTimeMicros < 500) {
      issues.push({
        id: 'rx-buffer-small',
        severity: 'warning',
        category: 'Buffer',
        message: `RX buffer provides ${rxBufferTimeMicros.toFixed(0)} µs buffering at current sample rate`,
        suggestion: `Consider increasing buffer size for more stable streaming`,
        affectedFields: ['buffer'],
      });
    }
  }

  if (mode !== 'rx') {
    const txBufferTimeMicros = (bufferSize.txBufferSize / samplesPerSecond) * 1_000_000;
    
    if (txBufferTimeMicros < 100) {
      issues.push({
        id: 'tx-buffer-too-small',
        severity: 'error',
        category: 'Buffer',
        message: `TX buffer (${bufferSize.txBufferSize} samples) provides only ${txBufferTimeMicros.toFixed(1)} µs buffering - will cause underruns`,
        suggestion: `Minimum recommended: ${Math.ceil((samplesPerSecond * 0.001) / 1024) * 1024} samples (1 ms). Recommended: ${Math.ceil((samplesPerSecond * 0.010) / 1024) * 1024} samples (10 ms) to prevent TX underruns`,
        affectedFields: ['buffer', 'sampleRate'],
      });
    }
  }

  // 6. High Throughput Warnings
  if (throughputMBps > 500) {
    issues.push({
      id: 'very-high-throughput',
      severity: 'warning',
      category: 'Performance',
      message: `Configuration requires ${throughputMBps.toFixed(0)} MB/s throughput`,
      suggestion: `Ensure PCIe connection and sufficient CPU/memory for processing`,
      affectedFields: ['sampleRate'],
    });
  } else if (throughputMBps > 200) {
    issues.push({
      id: 'high-throughput',
      severity: 'info',
      category: 'Performance',
      message: `Configuration requires ${throughputMBps.toFixed(0)} MB/s throughput`,
      suggestion: `Monitor system resources during streaming`,
      affectedFields: ['sampleRate'],
    });
  }

  // 7. Channel Configuration Validation
  if (mode !== 'tx' && channels.rxMode === 'mask' && channels.rxChannelMask === 0) {
    issues.push({
      id: 'rx-no-channels',
      severity: 'error',
      category: 'Channels',
      message: `No RX channels selected (mask = 0)`,
      suggestion: `Select at least one RX channel or use auto mode`,
      affectedFields: ['channels'],
    });
  }

  if (mode !== 'rx' && channels.txMode === 'mask' && channels.txChannelMask === 0) {
    issues.push({
      id: 'tx-no-channels',
      severity: 'error',
      category: 'Channels',
      message: `No TX channels selected (mask = 0)`,
      suggestion: `Select at least one TX channel or use auto mode`,
      affectedFields: ['channels'],
    });
  }

  if (mode !== 'tx' && channels.rxMode === 'list' && (!channels.rxChannelList || channels.rxChannelList.length === 0)) {
    issues.push({
      id: 'rx-no-channel-list',
      severity: 'error',
      category: 'Channels',
      message: `No RX channels in named list`,
      suggestion: `Add at least one channel name or use auto mode`,
      affectedFields: ['channels'],
    });
  }

  if (mode !== 'rx' && channels.txMode === 'list' && (!channels.txChannelList || channels.txChannelList.length === 0)) {
    issues.push({
      id: 'tx-no-channel-list',
      severity: 'error',
      category: 'Channels',
      message: `No TX channels in named list`,
      suggestion: `Add at least one channel name or use auto mode`,
      affectedFields: ['channels'],
    });
  }

  // 8. Clock Configuration Validation
  if (clock.source === 'external' && (!clock.externalFrequency || clock.externalFrequency < 10_000_000 || clock.externalFrequency > 50_000_000)) {
    issues.push({
      id: 'external-clock-invalid',
      severity: 'warning',
      category: 'Clock',
      message: `External clock frequency should typically be between 10 MHz and 50 MHz`,
      suggestion: `Verify external clock frequency matches your reference oscillator`,
      affectedFields: ['clock'],
    });
  }

  // API-Specific Validation
  if (apiType === 'soapysdr') {
    issues.push({
      id: 'soapysdr-info',
      severity: 'info',
      category: 'API',
      message: 'Using SoapySDR API - C++ object-oriented interface',
      suggestion: 'SoapySDR provides better ecosystem integration with GNU Radio, Pothos, and other SDR tools. The generated code shows C++ examples using the SoapySDR::Device API.',
      affectedFields: [],
    });
    
    // SoapySDR-specific recommendations
    if (sampleRate.dataFormat === 'ci16') {
      issues.push({
        id: 'soapysdr-format-info',
        severity: 'info',
        category: 'API',
        message: 'Data format ci16 maps to SOAPY_SDR_CS16 in SoapySDR',
        suggestion: 'SoapySDR uses format constants like SOAPY_SDR_CS16 (16-bit complex integers) or SOAPY_SDR_CF32 (32-bit complex floats).',
        affectedFields: ['sampleRate'],
      });
    }
  } else {
    issues.push({
      id: 'libusdr-info',
      severity: 'info',
      category: 'API',
      message: 'Using libusdr API - Native C interface for direct hardware access',
      suggestion: 'libusdr provides low-level control ideal for driver development and debugging. For application development, consider switching to SoapySDR for better ecosystem compatibility.',
      affectedFields: [],
    });
  }
  
  // Calculate counts
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  return {
    valid: errorCount === 0,
    issues,
    errorCount,
    warningCount,
    infoCount,
  };
}
