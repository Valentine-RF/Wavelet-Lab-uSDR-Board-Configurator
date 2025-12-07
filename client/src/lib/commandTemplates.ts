export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  category: 'monitoring' | 'testing' | 'analysis' | 'communication';
  tags: string[];
  command: string;
  parameters: {
    mode: 'rx' | 'tx' | 'trx';
    rfPath?: string;
    frequency?: number;
    bandwidth?: number;
    sampleRate?: number;
    gain?: {
      rxLna?: number;
      rxPga?: number;
      rxVga?: number;
      txGain?: number;
    };
  };
  useCase: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const commandTemplates: CommandTemplate[] = [
  // Monitoring Templates
  {
    id: 'wifi-monitor',
    name: 'WiFi Band Monitor',
    description: 'Monitor 2.4 GHz WiFi band for network activity and interference',
    category: 'monitoring',
    tags: ['wifi', '2.4ghz', 'ism', 'network'],
    command: 'usdr_dm_create -r 40000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx1200_2100',
      frequency: 2_450_000_000,
      bandwidth: 80_000_000,
      sampleRate: 40_000_000,
      gain: {
        rxLna: 15,
        rxPga: 12,
        rxVga: 10,
      },
    },
    useCase: 'Ideal for monitoring WiFi networks, detecting interference, and analyzing channel utilization in the 2.4 GHz ISM band.',
    difficulty: 'beginner',
  },
  {
    id: 'bluetooth-monitor',
    name: 'Bluetooth Signal Monitor',
    description: 'Monitor Bluetooth devices and connections in 2.4 GHz band',
    category: 'monitoring',
    tags: ['bluetooth', 'ble', '2.4ghz', 'ism'],
    command: 'usdr_dm_create -r 40000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx1200_2100',
      frequency: 2_440_000_000,
      bandwidth: 80_000_000,
      sampleRate: 40_000_000,
      gain: {
        rxLna: 18,
        rxPga: 15,
        rxVga: 12,
      },
    },
    useCase: 'Monitor Bluetooth Classic and BLE devices, analyze connection patterns, and detect nearby devices.',
    difficulty: 'beginner',
  },
  {
    id: 'gps-l1',
    name: 'GPS L1 Reception',
    description: 'Receive GPS L1 C/A signals at 1575.42 MHz',
    category: 'monitoring',
    tags: ['gps', 'gnss', 'navigation', 'l1'],
    command: 'usdr_dm_create -r 10000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx1200_2100',
      frequency: 1_575_420_000,
      bandwidth: 10_000_000,
      sampleRate: 10_000_000,
      gain: {
        rxLna: 30,
        rxPga: 19,
        rxVga: 15,
      },
    },
    useCase: 'Receive and decode GPS L1 C/A civilian signals for positioning, timing, and satellite tracking.',
    difficulty: 'intermediate',
  },
  {
    id: 'fm-broadcast',
    name: 'FM Radio Broadcast',
    description: 'Monitor FM radio broadcast band (88-108 MHz)',
    category: 'monitoring',
    tags: ['fm', 'radio', 'broadcast', 'audio'],
    command: 'usdr_dm_create -r 20000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx700_900',
      frequency: 98_000_000,
      bandwidth: 20_000_000,
      sampleRate: 20_000_000,
      gain: {
        rxLna: 10,
        rxPga: 8,
        rxVga: 5,
      },
    },
    useCase: 'Receive FM radio broadcasts, analyze signal quality, and monitor multiple stations simultaneously.',
    difficulty: 'beginner',
  },

  // Testing Templates
  {
    id: 'spectrum-sweep',
    name: 'Wideband Spectrum Sweep',
    description: 'High-bandwidth spectrum analysis for signal discovery',
    category: 'testing',
    tags: ['spectrum', 'sweep', 'analysis', 'wideband'],
    command: 'usdr_dm_create -r 100000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx1200_2100',
      frequency: 1_500_000_000,
      bandwidth: 100_000_000,
      sampleRate: 100_000_000,
      gain: {
        rxLna: 20,
        rxPga: 15,
        rxVga: 10,
      },
    },
    useCase: 'Perform wideband spectrum sweeps to discover signals, identify interference, and analyze frequency usage.',
    difficulty: 'intermediate',
  },
  {
    id: 'sensitivity-test',
    name: 'Receiver Sensitivity Test',
    description: 'Test receiver sensitivity with maximum gain settings',
    category: 'testing',
    tags: ['sensitivity', 'calibration', 'receiver', 'test'],
    command: 'usdr_dm_create -r 10000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx1200_2100',
      frequency: 1_000_000_000,
      bandwidth: 10_000_000,
      sampleRate: 10_000_000,
      gain: {
        rxLna: 30,
        rxPga: 19,
        rxVga: 15,
      },
    },
    useCase: 'Test receiver sensitivity by maximizing gain settings to detect weak signals and measure noise floor.',
    difficulty: 'advanced',
  },
  {
    id: 'loopback-test',
    name: 'TX/RX Loopback Test',
    description: 'Test transmit and receive paths with loopback',
    category: 'testing',
    tags: ['loopback', 'calibration', 'trx', 'test'],
    command: 'usdr_dm_create -r 20000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'trx',
      rfPath: 'trx1200_2100',
      frequency: 1_000_000_000,
      bandwidth: 20_000_000,
      sampleRate: 20_000_000,
      gain: {
        rxLna: 15,
        rxPga: 10,
        rxVga: 8,
        txGain: 30,
      },
    },
    useCase: 'Verify TX and RX chain functionality by transmitting a test signal and receiving it back through a loopback connection.',
    difficulty: 'advanced',
  },
  {
    id: 'buffer-stress-test',
    name: 'High Throughput Buffer Test',
    description: 'Stress test with maximum sample rate and buffer size',
    category: 'testing',
    tags: ['performance', 'buffer', 'throughput', 'stress'],
    command: 'usdr_dm_create -r 200000000 -F c116 -S 8192 -c 32768',
    parameters: {
      mode: 'rx',
      rfPath: 'trx1200_2100',
      frequency: 2_000_000_000,
      bandwidth: 200_000_000,
      sampleRate: 200_000_000,
      gain: {
        rxLna: 15,
        rxPga: 10,
        rxVga: 8,
      },
    },
    useCase: 'Test system performance under maximum data throughput to identify bottlenecks and validate buffer handling.',
    difficulty: 'advanced',
  },

  // Analysis Templates
  {
    id: 'lte-analysis',
    name: 'LTE Band Analysis',
    description: 'Analyze LTE cellular signals in Band 7 (2.6 GHz)',
    category: 'analysis',
    tags: ['lte', '4g', 'cellular', 'band7'],
    command: 'usdr_dm_create -r 40000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx1200_2100',
      frequency: 2_655_000_000,
      bandwidth: 40_000_000,
      sampleRate: 40_000_000,
      gain: {
        rxLna: 20,
        rxPga: 15,
        rxVga: 10,
      },
    },
    useCase: 'Analyze LTE cellular signals, decode system information, and monitor network parameters in Band 7.',
    difficulty: 'advanced',
  },
  {
    id: 'ism-analysis',
    name: 'ISM Band Analysis',
    description: 'Analyze 2.4 GHz ISM band for various protocols',
    category: 'analysis',
    tags: ['ism', '2.4ghz', 'zigbee', 'wifi', 'bluetooth'],
    command: 'usdr_dm_create -r 100000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx1200_2100',
      frequency: 2_450_000_000,
      bandwidth: 100_000_000,
      sampleRate: 100_000_000,
      gain: {
        rxLna: 18,
        rxPga: 12,
        rxVga: 10,
      },
    },
    useCase: 'Comprehensive analysis of the 2.4 GHz ISM band covering WiFi, Bluetooth, ZigBee, and other protocols.',
    difficulty: 'intermediate',
  },
  {
    id: 'narrowband-analysis',
    name: 'Narrowband Signal Analysis',
    description: 'Analyze narrowband signals with high resolution',
    category: 'analysis',
    tags: ['narrowband', 'precision', 'analysis'],
    command: 'usdr_dm_create -r 5000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx1200_2100',
      frequency: 1_000_000_000,
      bandwidth: 5_000_000,
      sampleRate: 5_000_000,
      gain: {
        rxLna: 25,
        rxPga: 18,
        rxVga: 12,
      },
    },
    useCase: 'High-resolution analysis of narrowband signals for precise frequency measurement and modulation analysis.',
    difficulty: 'intermediate',
  },

  // Communication Templates
  {
    id: 'amateur-2m',
    name: 'Amateur Radio 2m Band',
    description: 'Monitor amateur radio 2-meter band (144-148 MHz)',
    category: 'communication',
    tags: ['amateur', 'ham', '2m', 'vhf'],
    command: 'usdr_dm_create -r 10000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx700_900',
      frequency: 146_000_000,
      bandwidth: 10_000_000,
      sampleRate: 10_000_000,
      gain: {
        rxLna: 20,
        rxPga: 15,
        rxVga: 10,
      },
    },
    useCase: 'Monitor amateur radio communications in the 2-meter VHF band, including FM voice and digital modes.',
    difficulty: 'beginner',
  },
  {
    id: 'pager-monitor',
    name: 'Pager Signal Monitor',
    description: 'Monitor pager signals around 900 MHz',
    category: 'communication',
    tags: ['pager', 'pocsag', '900mhz'],
    command: 'usdr_dm_create -r 10000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx700_900',
      frequency: 931_000_000,
      bandwidth: 10_000_000,
      sampleRate: 10_000_000,
      gain: {
        rxLna: 25,
        rxPga: 18,
        rxVga: 12,
      },
    },
    useCase: 'Monitor and decode pager signals (POCSAG, FLEX) used by emergency services and businesses.',
    difficulty: 'intermediate',
  },
  {
    id: 'adsb-aircraft',
    name: 'ADS-B Aircraft Tracking',
    description: 'Receive ADS-B signals from aircraft at 1090 MHz',
    category: 'communication',
    tags: ['adsb', 'aircraft', 'aviation', '1090mhz'],
    command: 'usdr_dm_create -r 10000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx1200_2100',
      frequency: 1_090_000_000,
      bandwidth: 10_000_000,
      sampleRate: 10_000_000,
      gain: {
        rxLna: 20,
        rxPga: 15,
        rxVga: 10,
      },
    },
    useCase: 'Track aircraft positions and flight data by receiving ADS-B broadcasts at 1090 MHz.',
    difficulty: 'beginner',
  },
  
  // Additional Monitoring Templates
  {
    id: 'weather-satellite',
    name: 'Weather Satellite (NOAA APT)',
    description: 'Receive NOAA weather satellite APT transmissions at 137 MHz',
    category: 'monitoring',
    tags: ['noaa', 'weather', 'satellite', 'apt', 'vhf'],
    command: 'usdr_dm_create -r 10000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx700_900',
      frequency: 137_500_000,
      bandwidth: 10_000_000,
      sampleRate: 10_000_000,
      gain: {
        rxLna: 30,
        rxPga: 19,
        rxVga: 15,
      },
    },
    useCase: 'Receive and decode weather satellite images from NOAA satellites (NOAA 15, 18, 19) using APT protocol.',
    difficulty: 'intermediate',
  },
  {
    id: 'marine-vhf',
    name: 'Marine VHF Monitor',
    description: 'Monitor marine VHF communications (156-162 MHz)',
    category: 'monitoring',
    tags: ['marine', 'vhf', 'boat', 'channel16'],
    command: 'usdr_dm_create -r 10000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx700_900',
      frequency: 156_800_000,
      bandwidth: 10_000_000,
      sampleRate: 10_000_000,
      gain: {
        rxLna: 18,
        rxPga: 12,
        rxVga: 8,
      },
    },
    useCase: 'Monitor marine VHF communications including distress channel 16 (156.8 MHz) and other maritime channels.',
    difficulty: 'beginner',
  },
  {
    id: 'aviation-vhf',
    name: 'Aviation VHF Monitor',
    description: 'Monitor aviation communications (118-137 MHz)',
    category: 'monitoring',
    tags: ['aviation', 'vhf', 'atc', 'aircraft'],
    command: 'usdr_dm_create -r 20000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx700_900',
      frequency: 127_500_000,
      bandwidth: 20_000_000,
      sampleRate: 20_000_000,
      gain: {
        rxLna: 20,
        rxPga: 15,
        rxVga: 10,
      },
    },
    useCase: 'Monitor air traffic control (ATC) and pilot communications in the aviation VHF band.',
    difficulty: 'beginner',
  },
  {
    id: 'dab-radio',
    name: 'DAB+ Digital Radio',
    description: 'Receive DAB/DAB+ digital radio broadcasts (174-240 MHz)',
    category: 'monitoring',
    tags: ['dab', 'digital', 'radio', 'broadcast'],
    command: 'usdr_dm_create -r 10000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx700_900',
      frequency: 220_000_000,
      bandwidth: 10_000_000,
      sampleRate: 10_000_000,
      gain: {
        rxLna: 15,
        rxPga: 10,
        rxVga: 8,
      },
    },
    useCase: 'Receive and decode DAB/DAB+ digital radio broadcasts with superior audio quality compared to FM.',
    difficulty: 'intermediate',
  },
  {
    id: 'tetra-monitor',
    name: 'TETRA Digital Radio',
    description: 'Monitor TETRA digital trunked radio (380-430 MHz)',
    category: 'monitoring',
    tags: ['tetra', 'digital', 'trunked', 'emergency'],
    command: 'usdr_dm_create -r 10000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx700_900',
      frequency: 400_000_000,
      bandwidth: 10_000_000,
      sampleRate: 10_000_000,
      gain: {
        rxLna: 22,
        rxPga: 16,
        rxVga: 12,
      },
    },
    useCase: 'Monitor TETRA digital trunked radio systems used by emergency services, public safety, and transportation.',
    difficulty: 'advanced',
  },
  
  // Additional Communication Templates
  {
    id: 'lora-868',
    name: 'LoRa 868 MHz Monitor',
    description: 'Monitor LoRa IoT communications in EU 868 MHz band',
    category: 'communication',
    tags: ['lora', 'iot', 'lpwan', '868mhz'],
    command: 'usdr_dm_create -r 10000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx700_900',
      frequency: 868_000_000,
      bandwidth: 10_000_000,
      sampleRate: 10_000_000,
      gain: {
        rxLna: 25,
        rxPga: 18,
        rxVga: 12,
      },
    },
    useCase: 'Monitor LoRa and LoRaWAN IoT device communications in the European 868 MHz ISM band.',
    difficulty: 'intermediate',
  },
  {
    id: 'lora-915',
    name: 'LoRa 915 MHz Monitor',
    description: 'Monitor LoRa IoT communications in US 915 MHz band',
    category: 'communication',
    tags: ['lora', 'iot', 'lpwan', '915mhz'],
    command: 'usdr_dm_create -r 10000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx700_900',
      frequency: 915_000_000,
      bandwidth: 10_000_000,
      sampleRate: 10_000_000,
      gain: {
        rxLna: 25,
        rxPga: 18,
        rxVga: 12,
      },
    },
    useCase: 'Monitor LoRa and LoRaWAN IoT device communications in the US 915 MHz ISM band.',
    difficulty: 'intermediate',
  },
  {
    id: 'zigbee-monitor',
    name: 'ZigBee Network Monitor',
    description: 'Monitor ZigBee smart home and IoT networks (2.4 GHz)',
    category: 'communication',
    tags: ['zigbee', 'iot', 'smarthome', '2.4ghz'],
    command: 'usdr_dm_create -r 20000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx1200_2100',
      frequency: 2_450_000_000,
      bandwidth: 20_000_000,
      sampleRate: 20_000_000,
      gain: {
        rxLna: 20,
        rxPga: 15,
        rxVga: 10,
      },
    },
    useCase: 'Monitor ZigBee mesh networks used in smart home devices, sensors, and industrial automation.',
    difficulty: 'intermediate',
  },
  {
    id: 'amateur-70cm',
    name: 'Amateur Radio 70cm Band',
    description: 'Monitor amateur radio 70-centimeter band (420-450 MHz)',
    category: 'communication',
    tags: ['amateur', 'ham', '70cm', 'uhf'],
    command: 'usdr_dm_create -r 20000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx700_900',
      frequency: 435_000_000,
      bandwidth: 20_000_000,
      sampleRate: 20_000_000,
      gain: {
        rxLna: 20,
        rxPga: 15,
        rxVga: 10,
      },
    },
    useCase: 'Monitor amateur radio communications in the 70cm UHF band, including FM voice, digital modes, and satellites.',
    difficulty: 'beginner',
  },
  {
    id: 'dmr-monitor',
    name: 'DMR Digital Radio',
    description: 'Monitor DMR digital mobile radio communications',
    category: 'communication',
    tags: ['dmr', 'digital', 'mobile', 'uhf'],
    command: 'usdr_dm_create -r 10000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx700_900',
      frequency: 446_000_000,
      bandwidth: 10_000_000,
      sampleRate: 10_000_000,
      gain: {
        rxLna: 22,
        rxPga: 16,
        rxVga: 12,
      },
    },
    useCase: 'Monitor DMR (Digital Mobile Radio) communications used by amateur radio operators and commercial users.',
    difficulty: 'intermediate',
  },
  
  // Additional Testing Templates
  {
    id: 'interference-scan',
    name: 'Interference Detection Scan',
    description: 'Scan for interference sources across wide frequency range',
    category: 'testing',
    tags: ['interference', 'scan', 'detection', 'troubleshooting'],
    command: 'usdr_dm_create -r 100000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx1200_2100',
      frequency: 2_000_000_000,
      bandwidth: 100_000_000,
      sampleRate: 100_000_000,
      gain: {
        rxLna: 20,
        rxPga: 15,
        rxVga: 10,
      },
    },
    useCase: 'Detect and locate interference sources by scanning wide frequency ranges with high sensitivity.',
    difficulty: 'intermediate',
  },
  {
    id: 'signal-generator',
    name: 'CW Signal Generator',
    description: 'Generate continuous wave (CW) test signal',
    category: 'testing',
    tags: ['generator', 'cw', 'test', 'transmit'],
    command: 'usdr_dm_create -t -r 10000000 -F c116 -O 4096 -c 16384',
    parameters: {
      mode: 'tx',
      rfPath: 'trx1200_2100',
      frequency: 1_000_000_000,
      bandwidth: 10_000_000,
      sampleRate: 10_000_000,
      gain: {
        txGain: 40,
      },
    },
    useCase: 'Generate a continuous wave test signal for calibration, antenna tuning, and system verification.',
    difficulty: 'intermediate',
  },
  {
    id: 'noise-floor-measurement',
    name: 'Noise Floor Measurement',
    description: 'Measure receiver noise floor with minimal gain',
    category: 'testing',
    tags: ['noise', 'floor', 'measurement', 'calibration'],
    command: 'usdr_dm_create -r 10000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx1200_2100',
      frequency: 1_000_000_000,
      bandwidth: 10_000_000,
      sampleRate: 10_000_000,
      gain: {
        rxLna: 0,
        rxPga: 0,
        rxVga: 0,
      },
    },
    useCase: 'Measure the receiver noise floor with minimal gain to establish baseline performance metrics.',
    difficulty: 'advanced',
  },
  
  // Additional Analysis Templates
  {
    id: '5g-nr-analysis',
    name: '5G NR Signal Analysis',
    description: 'Analyze 5G New Radio signals in n78 band (3.5 GHz)',
    category: 'analysis',
    tags: ['5g', 'nr', 'cellular', 'n78'],
    command: 'usdr_dm_create -r 100000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx1200_2100',
      frequency: 3_500_000_000,
      bandwidth: 100_000_000,
      sampleRate: 100_000_000,
      gain: {
        rxLna: 20,
        rxPga: 15,
        rxVga: 10,
      },
    },
    useCase: 'Analyze 5G New Radio signals, decode system information, and monitor network parameters in n78 band.',
    difficulty: 'advanced',
  },
  {
    id: 'rf-fingerprinting',
    name: 'RF Device Fingerprinting',
    description: 'Capture RF signatures for device identification',
    category: 'analysis',
    tags: ['fingerprinting', 'identification', 'security', 'rf'],
    command: 'usdr_dm_create -r 50000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx1200_2100',
      frequency: 2_450_000_000,
      bandwidth: 50_000_000,
      sampleRate: 50_000_000,
      gain: {
        rxLna: 22,
        rxPga: 16,
        rxVga: 12,
      },
    },
    useCase: 'Capture and analyze RF signatures for device identification, authentication, and security applications.',
    difficulty: 'advanced',
  },
  {
    id: 'modulation-analysis',
    name: 'Modulation Classification',
    description: 'Analyze and classify signal modulation schemes',
    category: 'analysis',
    tags: ['modulation', 'classification', 'analysis', 'signal'],
    command: 'usdr_dm_create -r 20000000 -F c116 -S 4096 -c 16384',
    parameters: {
      mode: 'rx',
      rfPath: 'trx1200_2100',
      frequency: 1_000_000_000,
      bandwidth: 20_000_000,
      sampleRate: 20_000_000,
      gain: {
        rxLna: 20,
        rxPga: 15,
        rxVga: 10,
      },
    },
    useCase: 'Analyze unknown signals to identify modulation schemes (AM, FM, PSK, QAM, etc.) and signal characteristics.',
    difficulty: 'advanced',
  },
];

export function searchCommandTemplates(query: string, category?: string): CommandTemplate[] {
  const lowerQuery = query.toLowerCase();
  
  return commandTemplates.filter((template) => {
    const matchesCategory = !category || template.category === category;
    const matchesQuery =
      !query ||
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      template.useCase.toLowerCase().includes(lowerQuery);
    
    return matchesCategory && matchesQuery;
  });
}

export function getTemplatesByCategory(category: string): CommandTemplate[] {
  return commandTemplates.filter((template) => template.category === category);
}

export function getTemplateById(id: string): CommandTemplate | undefined {
  return commandTemplates.find((template) => template.id === id);
}
