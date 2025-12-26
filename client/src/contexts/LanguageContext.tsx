import { createContext, useContext, type ReactNode } from 'react';

export type Language = 'en';

interface LanguageContextType {
  language: Language;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const t = (key: string): string => {
    return translationsEn[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language: 'en', t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

// English translations
const translationsEn: Record<string, string> = {
  // Header
  'header.title': 'uSDR Development Board',
  'header.subtitle': 'High-Performance SDR Configuration Dashboard',
  'header.ready': 'Ready',
  'header.presets': 'Presets',
  'header.import': 'Import',
  'header.export': 'Export',
  'header.saveConfig': 'Save Config',
  
  // Operation Mode
  'mode.title': 'Operation Mode',
  'mode.rx': 'RX',
  'mode.tx': 'TX',
  'mode.trx': 'TRX',
  
  // Quick-Start Templates
  'templates.title': 'Quick-Start Templates',
  'templates.subtitle': 'Load pre-configured settings for common SDR use cases',
  'templates.apply': 'Apply Template',
  'templates.monitoring': 'Monitoring',
  'templates.analysis': 'Analysis',
  'templates.comm': 'Comm',
  'templates.testing': 'Testing',
  
  // RF Path
  'rfpath.title': 'RF Path Selection',
  'rfpath.subtitle': 'Select the RF path configuration for your uSDR Development Board',
  'rfpath.duplexer': 'Duplexer-Backed Cellular Bands',
  'rfpath.txonly': 'TX-Only Paths',
  'rfpath.rxonly': 'RX-Only Paths',
  'rfpath.tdd': 'TDD / Half-Duplex Paths',
  
  // Frequency
  'frequency.title': 'Frequency & Bandwidth Control',
  'frequency.rxCenter': 'RX Center Frequency',
  'frequency.txCenter': 'TX Center Frequency',
  'frequency.rxBandwidth': 'RX Bandwidth',
  'frequency.txBandwidth': 'TX Bandwidth',
  
  // Gain
  'gain.title': 'Gain Control',
  'gain.rxLna': 'RX LNA Gain',
  'gain.rxPga': 'RX PGA Gain',
  'gain.rxVga': 'RX VGA Gain',
  'gain.txGain': 'TX Gain',
  'gain.total': 'Total RX Gain',
  
  // Clock
  'clock.title': 'Reference Clock Configuration',
  'clock.source': 'Clock Source',
  'clock.internal': 'Internal',
  'clock.devboard': 'DevBoard',
  'clock.external': 'External',
  'clock.externalFreq': 'External Frequency',
  'clock.dacTuning': 'DAC Tuning',
  
  // Sample Rate
  'sample.title': 'Sample Rate & Data Format',
  'sample.rate': 'Sample Rate',
  'sample.format': 'Data Format',
  'sample.connection': 'Connection Type',
  'sample.blockSize': 'Block Size',
  'sample.throughput': 'Estimated Throughput',
  
  // Buffer
  'buffer.title': 'Buffer Size Configuration',
  'buffer.rxSize': 'RX Buffer Size',
  'buffer.txSize': 'TX Buffer Size',
  'buffer.throughput': 'Throughput Impact',
  'buffer.warning': 'Buffer size may be too small for selected sample rate',
  
  // Channels
  'channels.title': 'Channel Configuration',
  'channels.rxMode': 'RX Channel Mode',
  'channels.txMode': 'TX Channel Mode',
  'channels.auto': 'Auto-detect',
  'channels.mask': 'Channel Mask',
  'channels.list': 'Named List',
  'channels.active': 'Active Channels',
  
  // Device Parameters
  'device.title': 'Device Parameters',
  'device.lna': 'LNA',
  'device.pa': 'PA',
  'device.gpsdo': 'GPSDO',
  'device.osc': 'OSC',
  'device.dac': 'DAC Value',
  
  // Command Preview
  'command.title': 'Command Preview',
  'command.copy': 'Copy Command',
  'command.copied': 'Command copied to clipboard',
  
  // Streaming
  'streaming.title': 'Streaming Control',
  'streaming.start': 'Start Stream',
  'streaming.stop': 'Stop Stream',
  'streaming.status': 'Status',
  'streaming.duration': 'Duration',
  'streaming.samples': 'Samples',
  'streaming.throughput': 'Throughput',
  
  // Validation
  'validation.title': 'Configuration Validation',
  'validation.error': 'Error',
  'validation.warning': 'Warning',
  'validation.info': 'Info',
  'validation.noIssues': 'No validation issues',
  
  // Configuration Summary
  'summary.title': 'Configuration Summary',
  'summary.rfPath': 'RF Path',
  'summary.mode': 'Mode',
  'summary.sampleRate': 'Sample Rate',
  'summary.rxFreq': 'RX Frequency',
  'summary.totalGain': 'Total RX Gain',
  
  // Import/Export
  'export.success': 'Configuration exported successfully',
  'import.success': 'Configuration imported successfully',
  'import.error': 'Import failed',
  'import.warning': 'Import warnings',
};
