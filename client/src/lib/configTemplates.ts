import type { FrequencyConfig } from '@/components/FrequencyControl';
import type { GainConfig } from '@/components/GainControl';
import type { ClockConfiguration } from '@/components/ClockConfig';
import type { SampleRateConfig } from '@/components/SampleRateConfig';
import type { BufferSizeConfiguration } from '@/components/BufferSizeConfig';
import type { ChannelConfiguration } from '@/components/ChannelConfig';
import type { DeviceParameters } from '@/components/DeviceParameterBuilder';

export interface ConfigurationTemplate {
  id: string;
  name: string;
  nameRu: string;
  description: string;
  descriptionRu: string;
  category: 'monitoring' | 'analysis' | 'communication' | 'testing';
  icon: string;
  mode: 'rx' | 'tx' | 'trx';
  rfPath: string;
  frequency: FrequencyConfig;
  gain: GainConfig;
  clock: ClockConfiguration;
  sampleRate: SampleRateConfig;
  buffer: BufferSizeConfiguration;
  channels: ChannelConfiguration;
  deviceParams: DeviceParameters;
}

export const configurationTemplates: ConfigurationTemplate[] = [
  {
    id: 'ism-2.4ghz-monitor',
    name: '2.4 GHz ISM Band Monitoring',
    nameRu: 'Мониторинг ISM диапазона 2.4 ГГц',
    description: 'Monitor WiFi, Bluetooth, and ZigBee signals in the 2.4 GHz ISM band',
    descriptionRu: 'Мониторинг сигналов WiFi, Bluetooth и ZigBee в ISM диапазоне 2.4 ГГц',
    category: 'monitoring',
    icon: 'Wifi',
    mode: 'rx',
    rfPath: 'rxw',
    frequency: {
      rxCenter: 2450000000, // 2.45 GHz center
      txCenter: 2450000000,
      rxBandwidth: 80000000, // 80 MHz to cover full ISM band
      txBandwidth: 20000000,
    },
    gain: {
      rxLna: 20,
      rxPga: 10,
      rxVga: 15,
      txGain: 30,
    },
    clock: {
      source: 'internal',
      externalFrequency: 26000000,
      dacTuning: 0,
    },
    sampleRate: {
      sampleRate: 100000000, // 100 MHz
      dataFormat: 'ci16',
      connectionType: 'pcie',
      blockSize: 4096,
    },
    buffer: {
      rxBufferSize: 8192,
      txBufferSize: 4096,
    },
    channels: {
      rxMode: 'auto',
      txMode: 'auto',
    },
    deviceParams: {
      lnaOn: true,
      paOn: false,
      gpsdoOn: false,
      oscOn: false,
      dacValue: 0,
    },
  },
  {
    id: 'lte-band7-analysis',
    name: 'LTE Band 7 Analysis',
    nameRu: 'Анализ LTE диапазона 7',
    description: 'Analyze LTE Band 7 (2.5-2.69 GHz) cellular signals',
    descriptionRu: 'Анализ сотовых сигналов LTE диапазона 7 (2.5-2.69 ГГц)',
    category: 'analysis',
    icon: 'Signal',
    mode: 'rx',
    rfPath: 'TRX_BAND7',
    frequency: {
      rxCenter: 2620000000, // 2.62 GHz (center of Band 7 downlink)
      txCenter: 2500000000,
      rxBandwidth: 20000000, // 20 MHz LTE channel
      txBandwidth: 20000000,
    },
    gain: {
      rxLna: 25,
      rxPga: 12,
      rxVga: 18,
      txGain: 30,
    },
    clock: {
      source: 'internal',
      externalFrequency: 26000000,
      dacTuning: 0,
    },
    sampleRate: {
      sampleRate: 30720000, // 30.72 MHz (standard LTE sample rate)
      dataFormat: 'ci16',
      connectionType: 'pcie',
      blockSize: 4096,
    },
    buffer: {
      rxBufferSize: 16384,
      txBufferSize: 4096,
    },
    channels: {
      rxMode: 'auto',
      txMode: 'auto',
    },
    deviceParams: {
      lnaOn: true,
      paOn: false,
      gpsdoOn: false,
      oscOn: false,
      dacValue: 0,
    },
  },
  {
    id: 'gps-l1-reception',
    name: 'GPS L1 Reception',
    nameRu: 'Прием GPS L1',
    description: 'Receive GPS L1 C/A signals at 1575.42 MHz',
    descriptionRu: 'Прием сигналов GPS L1 C/A на частоте 1575.42 МГц',
    category: 'monitoring',
    icon: 'Satellite',
    mode: 'rx',
    rfPath: 'rxw',
    frequency: {
      rxCenter: 1575420000, // 1575.42 MHz (GPS L1)
      txCenter: 1575420000,
      rxBandwidth: 2046000, // 2.046 MHz (GPS C/A bandwidth)
      txBandwidth: 2000000,
    },
    gain: {
      rxLna: 30, // High gain for weak GPS signals
      rxPga: 15,
      rxVga: 20,
      txGain: 30,
    },
    clock: {
      source: 'internal',
      externalFrequency: 26000000,
      dacTuning: 0,
    },
    sampleRate: {
      sampleRate: 4092000, // 4.092 MHz (2x GPS bandwidth)
      dataFormat: 'ci16',
      connectionType: 'usb',
      blockSize: 2048,
    },
    buffer: {
      rxBufferSize: 8192,
      txBufferSize: 4096,
    },
    channels: {
      rxMode: 'auto',
      txMode: 'auto',
    },
    deviceParams: {
      lnaOn: true,
      paOn: false,
      gpsdoOn: true, // Enable GPSDO if available
      oscOn: false,
      dacValue: 0,
    },
  },
  {
    id: 'wideband-spectrum-scan',
    name: 'Wideband Spectrum Scan',
    nameRu: 'Широкополосное сканирование спектра',
    description: 'Wide bandwidth spectrum scanning from 300 MHz to 3.8 GHz',
    descriptionRu: 'Широкополосное сканирование спектра от 300 МГц до 3.8 ГГц',
    category: 'analysis',
    icon: 'Activity',
    mode: 'rx',
    rfPath: 'rxw',
    frequency: {
      rxCenter: 2000000000, // 2 GHz center
      txCenter: 2000000000,
      rxBandwidth: 60000000, // 60 MHz instantaneous bandwidth
      txBandwidth: 20000000,
    },
    gain: {
      rxLna: 15, // Lower gain to avoid saturation
      rxPga: 8,
      rxVga: 12,
      txGain: 30,
    },
    clock: {
      source: 'internal',
      externalFrequency: 26000000,
      dacTuning: 0,
    },
    sampleRate: {
      sampleRate: 65000000, // 65 MHz
      dataFormat: 'ci16',
      connectionType: 'pcie',
      blockSize: 8192,
    },
    buffer: {
      rxBufferSize: 16384,
      txBufferSize: 4096,
    },
    channels: {
      rxMode: 'auto',
      txMode: 'auto',
    },
    deviceParams: {
      lnaOn: true,
      paOn: false,
      gpsdoOn: false,
      oscOn: false,
      dacValue: 0,
    },
  },
  {
    id: 'gsm900-monitoring',
    name: 'GSM 900 Monitoring',
    nameRu: 'Мониторинг GSM 900',
    description: 'Monitor GSM 900 cellular band (880-960 MHz)',
    descriptionRu: 'Мониторинг сотового диапазона GSM 900 (880-960 МГц)',
    category: 'monitoring',
    icon: 'Radio',
    mode: 'rx',
    rfPath: 'TRX_BAND8',
    frequency: {
      rxCenter: 945000000, // 945 MHz (GSM 900 downlink center)
      txCenter: 900000000,
      rxBandwidth: 200000, // 200 kHz GSM channel
      txBandwidth: 200000,
    },
    gain: {
      rxLna: 22,
      rxPga: 10,
      rxVga: 16,
      txGain: 30,
    },
    clock: {
      source: 'internal',
      externalFrequency: 26000000,
      dacTuning: 0,
    },
    sampleRate: {
      sampleRate: 1000000, // 1 MHz (5x GSM channel)
      dataFormat: 'ci16',
      connectionType: 'usb',
      blockSize: 2048,
    },
    buffer: {
      rxBufferSize: 4096,
      txBufferSize: 4096,
    },
    channels: {
      rxMode: 'auto',
      txMode: 'auto',
    },
    deviceParams: {
      lnaOn: true,
      paOn: false,
      gpsdoOn: false,
      oscOn: false,
      dacValue: 0,
    },
  },
  {
    id: 'narrowband-fm',
    name: 'Narrowband FM Reception',
    nameRu: 'Прием узкополосного FM',
    description: 'Receive narrowband FM signals (PMR446, FRS, GMRS)',
    descriptionRu: 'Прием узкополосных FM сигналов (PMR446, FRS, GMRS)',
    category: 'communication',
    icon: 'MessageSquare',
    mode: 'rx',
    rfPath: 'rxl',
    frequency: {
      rxCenter: 446000000, // 446 MHz (PMR446)
      txCenter: 446000000,
      rxBandwidth: 12500, // 12.5 kHz channel
      txBandwidth: 12500,
    },
    gain: {
      rxLna: 25,
      rxPga: 12,
      rxVga: 18,
      txGain: 30,
    },
    clock: {
      source: 'internal',
      externalFrequency: 26000000,
      dacTuning: 0,
    },
    sampleRate: {
      sampleRate: 250000, // 250 kHz (20x channel bandwidth)
      dataFormat: 'ci16',
      connectionType: 'usb',
      blockSize: 1024,
    },
    buffer: {
      rxBufferSize: 2048,
      txBufferSize: 2048,
    },
    channels: {
      rxMode: 'auto',
      txMode: 'auto',
    },
    deviceParams: {
      lnaOn: true,
      paOn: false,
      gpsdoOn: false,
      oscOn: false,
      dacValue: 0,
    },
  },
  {
    id: 'test-tone-generation',
    name: 'Test Tone Generation',
    nameRu: 'Генерация тестовых тонов',
    description: 'Generate test tones for TX path verification',
    descriptionRu: 'Генерация тестовых тонов для проверки тракта передачи',
    category: 'testing',
    icon: 'TestTube',
    mode: 'tx',
    rfPath: 'txw',
    frequency: {
      rxCenter: 1000000000,
      txCenter: 1000000000, // 1 GHz
      rxBandwidth: 20000000,
      txBandwidth: 1000000, // 1 MHz
    },
    gain: {
      rxLna: 20,
      rxPga: 10,
      rxVga: 15,
      txGain: 40, // Moderate TX gain for testing
    },
    clock: {
      source: 'internal',
      externalFrequency: 26000000,
      dacTuning: 0,
    },
    sampleRate: {
      sampleRate: 10000000, // 10 MHz
      dataFormat: 'ci16',
      connectionType: 'pcie',
      blockSize: 4096,
    },
    buffer: {
      rxBufferSize: 4096,
      txBufferSize: 8192,
    },
    channels: {
      rxMode: 'auto',
      txMode: 'auto',
    },
    deviceParams: {
      lnaOn: false,
      paOn: true, // Enable PA for TX
      gpsdoOn: false,
      oscOn: false,
      dacValue: 0,
    },
  },
];

export function getTemplatesByCategory(category: ConfigurationTemplate['category']) {
  return configurationTemplates.filter(t => t.category === category);
}

export function getTemplateById(id: string) {
  return configurationTemplates.find(t => t.id === id);
}
