import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

export interface SampleRateConfig {
  sampleRate: number; // in Hz
  dataFormat: 'ci16' | 'ci12' | 'cf32' | 'cs8' | 'cs16' | 'cf32@ci12' | 'cfftlpwri16';
  blockSize: number; // samples per block
  connectionType: 'usb' | 'pcie';
}

interface SampleRateConfigProps {
  config: SampleRateConfig;
  onChange: (config: SampleRateConfig) => void;
}

const DATA_FORMATS = [
  {
    value: 'ci16',
    label: 'CI16 - Complex Int16',
    description: 'I/Q 4 bytes/sample - Ideal for PCIe bandwidth',
    bytesPerSample: 4,
  },
  {
    value: 'ci12',
    label: 'CI12 - Complex Int12',
    description: 'I/Q 3 bytes/sample - Reduced bandwidth',
    bytesPerSample: 3,
  },
  {
    value: 'cf32',
    label: 'CF32 - Complex Float32',
    description: 'I/Q 8 bytes/sample - Higher precision',
    bytesPerSample: 8,
  },
  {
    value: 'cs8',
    label: 'CS8 - Complex Signed 8-bit',
    description: 'I/Q 2 bytes/sample - Minimum bandwidth',
    bytesPerSample: 2,
  },
  {
    value: 'cs16',
    label: 'CS16 - Complex Signed 16-bit',
    description: 'I/Q 4 bytes/sample - Standard precision',
    bytesPerSample: 4,
  },
  {
    value: 'cf32@ci12',
    label: 'CF32@CI12 - Hybrid',
    description: 'Host sees CF32, wire uses 12-bit (RX only)',
    bytesPerSample: 3,
  },
  {
    value: 'cfftlpwri16',
    label: 'CFFTLPWRI16 - FFT',
    description: 'Hardware FFT frames in int16 (RX only)',
    bytesPerSample: 4,
  },
];

const BLOCK_SIZES = [4096, 8192, 16384, 32768, 65536];

export default function SampleRateConfig({ config, onChange }: SampleRateConfigProps) {
  const { t } = useLanguage();
  const updateConfig = (updates: Partial<SampleRateConfig>) => {
    onChange({ ...config, ...updates });
  };

  const maxSampleRate = config.connectionType === 'usb' ? 30_000_000 : 70_000_000;
  const minSampleRate = 1_000_000;

  const formatInfo = DATA_FORMATS.find(f => f.value === config.dataFormat);
  const throughputMbps = formatInfo 
    ? (config.sampleRate * formatInfo.bytesPerSample * 8) / 1_000_000 
    : 0;

  const isRateValid = config.sampleRate >= minSampleRate && config.sampleRate <= maxSampleRate;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-semibold" style={{ fontFamily: 'var(--dd-font-display)' }}>
          {t('sampleRate.title')}
        </Label>
        <p className="text-sm mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
          {t('sampleRate.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sample Rate Configuration */}
        <Card className="sdr-panel">
          <h3 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-accent-green)' }}>
            {t('sampleRate.rate')}
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: 'var(--dd-text-primary)' }}>
                Connection Type
              </Label>
              <Select 
                value={config.connectionType} 
                onValueChange={(value: 'usb' | 'pcie') => updateConfig({ connectionType: value })}
              >
                <SelectTrigger className="sdr-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usb">USB (≈30 MHz max)</SelectItem>
                  <SelectItem value="pcie">PCIe DevBoard (≈70 MHz max)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: 'var(--dd-text-primary)' }}>
                Sample Rate (MHz)
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={(config.sampleRate / 1_000_000).toFixed(3)}
                  onChange={(e) => {
                    const mhz = parseFloat(e.target.value);
                    if (!isNaN(mhz)) {
                      updateConfig({ sampleRate: mhz * 1_000_000 });
                    }
                  }}
                  min={(minSampleRate / 1_000_000).toString()}
                  max={(maxSampleRate / 1_000_000).toString()}
                  step="0.1"
                  className="sdr-input sdr-numeric flex-1"
                />
                <span className="text-sm font-mono" style={{ color: 'var(--dd-text-secondary)' }}>MHz</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--dd-text-tertiary)' }}>
                Range: {minSampleRate / 1_000_000} - {maxSampleRate / 1_000_000} MHz
              </p>
              {!isRateValid && (
                <p className="text-xs" style={{ color: 'var(--dd-accent-red)' }}>
                  ⚠️ Sample rate out of valid range
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: 'var(--dd-text-primary)' }}>
                Block Size (samples)
              </Label>
              <Select 
                value={config.blockSize.toString()} 
                onValueChange={(value) => updateConfig({ blockSize: parseInt(value) })}
              >
                <SelectTrigger className="sdr-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_SIZES.map(size => (
                    <SelectItem key={size} value={size.toString()}>
                      {size.toLocaleString()} samples
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
                Choose block sizes that map cleanly to GPU buffer granularity
              </p>
            </div>
          </div>
        </Card>

        {/* Data Format Configuration */}
        <Card className="sdr-panel">
          <h3 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-accent-blue)' }}>
            Data Format
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-3">
              {DATA_FORMATS.map((format) => (
                <div
                  key={format.value}
                  className={`sdr-card ${config.dataFormat === format.value ? 'active' : ''}`}
                  onClick={() => updateConfig({ dataFormat: format.value as any })}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
                        {format.label}
                      </h4>
                      <Badge className="sdr-badge sdr-badge-info">
                        {format.bytesPerSample}B/sample
                      </Badge>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
                      {format.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded" style={{ backgroundColor: 'rgba(30, 144, 255, 0.1)', border: '1px solid var(--dd-accent-blue)' }}>
              <p className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
                <strong style={{ color: 'var(--dd-accent-blue)' }}>Holoscan Tip:</strong> For GPU pipelines, 
                CI16 is ideal for PCIe bandwidth efficiency. Convert to CF32 on GPU for processing.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Throughput Estimation */}
      <Card className="sdr-panel">
        <h3 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
          Throughput Estimation
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>Sample Rate</span>
            <div className="text-lg font-bold font-mono" style={{ color: 'var(--dd-accent-green)' }}>
              {(config.sampleRate / 1_000_000).toFixed(1)} MHz
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>Data Rate</span>
            <div className="text-lg font-bold font-mono" style={{ color: 'var(--dd-accent-green)' }}>
              {throughputMbps.toFixed(1)} Mbps
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>Block Size</span>
            <div className="text-lg font-bold font-mono" style={{ color: 'var(--dd-accent-green)' }}>
              {(config.blockSize / 1024).toFixed(0)}K
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>Format</span>
            <div className="text-lg font-bold font-mono" style={{ color: 'var(--dd-accent-green)' }}>
              {config.dataFormat.toUpperCase()}
            </div>
          </div>
        </div>

        {throughputMbps > 500 && (
          <div className="mt-4 p-3 rounded text-xs" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', border: '1px solid var(--dd-accent-yellow)', color: 'var(--dd-accent-yellow)' }}>
            ⚠️ High throughput configuration - Ensure adequate PCIe bandwidth and system resources
          </div>
        )}
      </Card>
    </div>
  );
}
