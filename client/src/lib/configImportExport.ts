import type { FrequencyConfig } from '@/components/FrequencyControl';
import type { GainConfig } from '@/components/GainControl';
import type { ClockConfiguration } from '@/components/ClockConfig';
import type { SampleRateConfig } from '@/components/SampleRateConfig';
import type { BufferSizeConfiguration } from '@/components/BufferSizeConfig';
import type { ChannelConfiguration } from '@/components/ChannelConfig';
import type { DeviceParameters } from '@/components/DeviceParameterBuilder';
import type { SyncTypeConfiguration } from '@/components/SyncTypeConfig';

export const CONFIG_VERSION = '1.0.0';

export interface ExportedConfiguration {
  version: string;
  exportDate: string;
  appName: string;
  configuration: {
    mode: 'rx' | 'tx' | 'trx';
    rfPath: string;
    frequency: FrequencyConfig;
    gain: GainConfig;
    clock: ClockConfiguration;
    sampleRate: SampleRateConfig;
    buffer: BufferSizeConfiguration;
    channels: ChannelConfiguration;
    sync: SyncTypeConfiguration;
    deviceParams: DeviceParameters;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  config?: ExportedConfiguration['configuration'];
}

/**
 * Export current configuration to JSON format
 */
export function exportConfiguration(
  mode: 'rx' | 'tx' | 'trx',
  rfPath: string,
  frequency: FrequencyConfig,
  gain: GainConfig,
  clock: ClockConfiguration,
  sampleRate: SampleRateConfig,
  buffer: BufferSizeConfiguration,
  channels: ChannelConfiguration,
  sync: SyncTypeConfiguration,
  deviceParams: DeviceParameters
): ExportedConfiguration {
  return {
    version: CONFIG_VERSION,
    exportDate: new Date().toISOString(),
    appName: 'uSDR Development Board Dashboard',
    configuration: {
      mode,
      rfPath,
      frequency,
      gain,
      clock,
      sampleRate,
      buffer,
      channels,
      sync,
      deviceParams,
    },
  };
}

/**
 * Download configuration as JSON file
 */
export function downloadConfigurationFile(config: ExportedConfiguration, filename?: string): void {
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `usdr-config-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate imported configuration structure and values
 */
export function validateImportedConfiguration(data: any): ImportValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Check if data is an object
  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'root',
      message: 'Invalid configuration file format',
      severity: 'error',
    });
    return { valid: false, errors, warnings };
  }

  // Check version
  if (!data.version) {
    errors.push({
      field: 'version',
      message: 'Missing version field',
      severity: 'error',
    });
  } else if (data.version !== CONFIG_VERSION) {
    warnings.push({
      field: 'version',
      message: `Configuration version mismatch (expected ${CONFIG_VERSION}, got ${data.version})`,
      severity: 'warning',
    });
  }

  // Check configuration object exists
  if (!data.configuration || typeof data.configuration !== 'object') {
    errors.push({
      field: 'configuration',
      message: 'Missing or invalid configuration object',
      severity: 'error',
    });
    return { valid: false, errors, warnings };
  }

  const config = data.configuration;

  // Validate mode
  if (!config.mode || !['rx', 'tx', 'trx'].includes(config.mode)) {
    errors.push({
      field: 'mode',
      message: 'Invalid or missing mode (must be rx, tx, or trx)',
      severity: 'error',
    });
  }

  // Validate rfPath
  if (!config.rfPath || typeof config.rfPath !== 'string') {
    errors.push({
      field: 'rfPath',
      message: 'Invalid or missing RF path',
      severity: 'error',
    });
  }

  // Validate frequency configuration
  if (!config.frequency || typeof config.frequency !== 'object') {
    errors.push({
      field: 'frequency',
      message: 'Missing frequency configuration',
      severity: 'error',
    });
  } else {
    const freq = config.frequency;
    if (typeof freq.rxCenter !== 'number' || freq.rxCenter < 0) {
      errors.push({
        field: 'frequency.rxCenter',
        message: 'Invalid RX center frequency',
        severity: 'error',
      });
    }
    if (typeof freq.txCenter !== 'number' || freq.txCenter < 0) {
      errors.push({
        field: 'frequency.txCenter',
        message: 'Invalid TX center frequency',
        severity: 'error',
      });
    }
    if (typeof freq.rxBandwidth !== 'number' || freq.rxBandwidth <= 0) {
      errors.push({
        field: 'frequency.rxBandwidth',
        message: 'Invalid RX bandwidth',
        severity: 'error',
      });
    }
    if (typeof freq.txBandwidth !== 'number' || freq.txBandwidth <= 0) {
      errors.push({
        field: 'frequency.txBandwidth',
        message: 'Invalid TX bandwidth',
        severity: 'error',
      });
    }
  }

  // Validate gain configuration
  if (!config.gain || typeof config.gain !== 'object') {
    errors.push({
      field: 'gain',
      message: 'Missing gain configuration',
      severity: 'error',
    });
  } else {
    const gain = config.gain;
    if (typeof gain.rxLna !== 'number' || gain.rxLna < 0 || gain.rxLna > 40) {
      errors.push({
        field: 'gain.rxLna',
        message: 'Invalid RX LNA gain (must be 0-40 dB)',
        severity: 'error',
      });
    }
    if (typeof gain.rxPga !== 'number' || gain.rxPga < 0 || gain.rxPga > 19) {
      errors.push({
        field: 'gain.rxPga',
        message: 'Invalid RX PGA gain (must be 0-19 dB)',
        severity: 'error',
      });
    }
    if (typeof gain.rxVga !== 'number' || gain.rxVga < 0 || gain.rxVga > 30) {
      errors.push({
        field: 'gain.rxVga',
        message: 'Invalid RX VGA gain (must be 0-30 dB)',
        severity: 'error',
      });
    }
    if (typeof gain.txGain !== 'number' || gain.txGain < 0 || gain.txGain > 89) {
      errors.push({
        field: 'gain.txGain',
        message: 'Invalid TX gain (must be 0-89 dB)',
        severity: 'error',
      });
    }
  }

  // Validate clock configuration
  if (!config.clock || typeof config.clock !== 'object') {
    errors.push({
      field: 'clock',
      message: 'Missing clock configuration',
      severity: 'error',
    });
  } else {
    const clock = config.clock;
    if (!['internal', 'external', 'devboard'].includes(clock.source)) {
      errors.push({
        field: 'clock.source',
        message: 'Invalid clock source',
        severity: 'error',
      });
    }
  }

  // Validate sample rate configuration
  if (!config.sampleRate || typeof config.sampleRate !== 'object') {
    errors.push({
      field: 'sampleRate',
      message: 'Missing sample rate configuration',
      severity: 'error',
    });
  } else {
    const sr = config.sampleRate;
    if (typeof sr.sampleRate !== 'number' || sr.sampleRate <= 0) {
      errors.push({
        field: 'sampleRate.sampleRate',
        message: 'Invalid sample rate',
        severity: 'error',
      });
    }
    if (!['ci16', 'ci12', 'cf32', 'cs8', 'cs16', 'cf32@ci12', 'cfftlpwri16'].includes(sr.dataFormat)) {
      errors.push({
        field: 'sampleRate.dataFormat',
        message: 'Invalid data format',
        severity: 'error',
      });
    }
    if (!['usb', 'pcie'].includes(sr.connectionType)) {
      errors.push({
        field: 'sampleRate.connectionType',
        message: 'Invalid connection type',
        severity: 'error',
      });
    }
  }

  // Validate buffer configuration
  if (!config.buffer || typeof config.buffer !== 'object') {
    errors.push({
      field: 'buffer',
      message: 'Missing buffer configuration',
      severity: 'error',
    });
  } else {
    const buf = config.buffer;
    if (typeof buf.rxBufferSize !== 'number' || buf.rxBufferSize <= 0) {
      errors.push({
        field: 'buffer.rxBufferSize',
        message: 'Invalid RX buffer size',
        severity: 'error',
      });
    }
    if (typeof buf.txBufferSize !== 'number' || buf.txBufferSize <= 0) {
      errors.push({
        field: 'buffer.txBufferSize',
        message: 'Invalid TX buffer size',
        severity: 'error',
      });
    }
  }

  // Validate channel configuration
  if (!config.channels || typeof config.channels !== 'object') {
    errors.push({
      field: 'channels',
      message: 'Missing channel configuration',
      severity: 'error',
    });
  }

  // Validate sync configuration (optional, may not exist in older exports)
  if (config.sync && typeof config.sync !== 'object') {
    warnings.push({
      field: 'sync',
      message: 'Invalid sync configuration format',
      severity: 'warning',
    });
  }

  // Validate device parameters
  if (!config.deviceParams || typeof config.deviceParams !== 'object') {
    errors.push({
      field: 'deviceParams',
      message: 'Missing device parameters',
      severity: 'error',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config: errors.length === 0 ? config : undefined,
  };
}

/**
 * Parse and validate configuration from JSON file
 */
export async function importConfigurationFromFile(file: File): Promise<ImportValidationResult> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    return validateImportedConfiguration(data);
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          field: 'file',
          message: error instanceof Error ? error.message : 'Failed to parse JSON file',
          severity: 'error',
        },
      ],
      warnings: [],
    };
  }
}
