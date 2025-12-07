import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Language = 'en' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'usdr-dashboard-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'en' || stored === 'ru') ? stored : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key: string): string => {
    const translations = language === 'ru' ? translationsRu : translationsEn;
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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

// Russian translations
const translationsRu: Record<string, string> = {
  // Header
  'header.title': 'Плата разработки uSDR',
  'header.subtitle': 'Панель конфигурации высокопроизводительного SDR',
  'header.ready': 'Готов',
  'header.presets': 'Пресеты',
  'header.import': 'Импорт',
  'header.export': 'Экспорт',
  'header.saveConfig': 'Сохранить',
  
  // Operation Mode
  'mode.title': 'Режим работы',
  'mode.rx': 'Приём',
  'mode.tx': 'Передача',
  'mode.trx': 'Приём/Передача',
  
  // Quick-Start Templates
  'templates.title': 'Быстрые шаблоны',
  'templates.subtitle': 'Загрузить предварительно настроенные параметры для типичных задач SDR',
  'templates.apply': 'Применить шаблон',
  'templates.monitoring': 'Мониторинг',
  'templates.analysis': 'Анализ',
  'templates.comm': 'Связь',
  'templates.testing': 'Тестирование',
  
  // RF Path
  'rfpath.title': 'Выбор RF пути',
  'rfpath.subtitle': 'Выберите конфигурацию RF пути для вашей платы разработки uSDR',
  'rfpath.duplexer': 'Сотовые диапазоны с дуплексером',
  'rfpath.txonly': 'Только передача',
  'rfpath.rxonly': 'Только приём',
  'rfpath.tdd': 'TDD / Полудуплекс',
  
  // Frequency
  'frequency.title': 'Управление частотой и полосой',
  'frequency.rxCenter': 'Центральная частота приёма',
  'frequency.txCenter': 'Центральная частота передачи',
  'frequency.rxBandwidth': 'Полоса приёма',
  'frequency.txBandwidth': 'Полоса передачи',
  
  // Gain
  'gain.title': 'Управление усилением',
  'gain.rxLna': 'Усиление RX LNA',
  'gain.rxPga': 'Усиление RX PGA',
  'gain.rxVga': 'Усиление RX VGA',
  'gain.txGain': 'Усиление TX',
  'gain.total': 'Общее усиление RX',
  
  // Clock
  'clock.title': 'Конфигурация опорного генератора',
  'clock.source': 'Источник тактового сигнала',
  'clock.internal': 'Внутренний',
  'clock.devboard': 'Плата разработки',
  'clock.external': 'Внешний',
  'clock.externalFreq': 'Внешняя частота',
  'clock.dacTuning': 'Настройка ЦАП',
  
  // Sample Rate
  'sample.title': 'Частота дискретизации и формат данных',
  'sample.rate': 'Частота дискретизации',
  'sample.format': 'Формат данных',
  'sample.connection': 'Тип подключения',
  'sample.blockSize': 'Размер блока',
  'sample.throughput': 'Расчётная пропускная способность',
  
  // Buffer
  'buffer.title': 'Конфигурация размера буфера',
  'buffer.rxSize': 'Размер буфера RX',
  'buffer.txSize': 'Размер буфера TX',
  'buffer.throughput': 'Влияние на пропускную способность',
  'buffer.warning': 'Размер буфера может быть слишком мал для выбранной частоты дискретизации',
  
  // Channels
  'channels.title': 'Конфигурация каналов',
  'channels.rxMode': 'Режим канала RX',
  'channels.txMode': 'Режим канала TX',
  'channels.auto': 'Автоопределение',
  'channels.mask': 'Маска каналов',
  'channels.list': 'Именованный список',
  'channels.active': 'Активные каналы',
  
  // Device Parameters
  'device.title': 'Параметры устройства',
  'device.lna': 'МШУ',
  'device.pa': 'УМ',
  'device.gpsdo': 'GPSDO',
  'device.osc': 'Генератор',
  'device.dac': 'Значение ЦАП',
  
  // Command Preview
  'command.title': 'Предпросмотр команды',
  'command.copy': 'Копировать команду',
  'command.copied': 'Команда скопирована в буфер обмена',
  
  // Streaming
  'streaming.title': 'Управление потоком',
  'streaming.start': 'Начать поток',
  'streaming.stop': 'Остановить поток',
  'streaming.status': 'Статус',
  'streaming.duration': 'Длительность',
  'streaming.samples': 'Отсчёты',
  'streaming.throughput': 'Пропускная способность',
  
  // Validation
  'validation.title': 'Проверка конфигурации',
  'validation.error': 'Ошибка',
  'validation.warning': 'Предупреждение',
  'validation.info': 'Информация',
  'validation.noIssues': 'Нет проблем с проверкой',
  
  // Configuration Summary
  'summary.title': 'Сводка конфигурации',
  'summary.rfPath': 'RF путь',
  'summary.mode': 'Режим',
  'summary.sampleRate': 'Частота дискретизации',
  'summary.rxFreq': 'Частота приёма',
  'summary.totalGain': 'Общее усиление RX',
  
  // Import/Export
  'export.success': 'Конфигурация успешно экспортирована',
  'import.success': 'Конфигурация успешно импортирована',
  'import.error': 'Ошибка импорта',
  'import.warning': 'Предупреждения импорта',
};
