import { BYTES_PER_SAMPLE } from '@shared/const';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { AlertTriangle, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface BufferSizeConfiguration {
  rxBufferSize: number;
  txBufferSize: number;
}

interface BufferSizeConfigProps {
  config: BufferSizeConfiguration;
  sampleRate: number;
  dataFormat: string;
  onChange: (config: BufferSizeConfiguration) => void;
}

// Calculate bytes per sample based on data format
function getBytesPerSample(format: string): number {
  return BYTES_PER_SAMPLE[format] ?? 4;
}

// Calculate data rate in MB/s
function calculateThroughput(sampleRate: number, format: string): number {
  const bytesPerSample = getBytesPerSample(format);
  const bytesPerSecond = sampleRate * bytesPerSample;
  return bytesPerSecond / (1024 * 1024); // Convert to MB/s
}

// Get recommended buffer size based on sample rate
function getRecommendedBufferSize(sampleRate: number): number {
  if (sampleRate <= 10e6) return 4096;
  if (sampleRate <= 30e6) return 8192;
  if (sampleRate <= 50e6) return 16384;
  return 32768; // For 60+ MHz
}

// Get warning level based on buffer size vs recommended
function getWarningLevel(bufferSize: number, recommended: number): 'none' | 'info' | 'warning' {
  if (bufferSize < recommended / 2) return 'warning';
  if (bufferSize < recommended) return 'info';
  return 'none';
}

export default function BufferSizeConfig({ config, sampleRate, dataFormat, onChange }: BufferSizeConfigProps) {
  const { t } = useLanguage();
  const recommendedRx = getRecommendedBufferSize(sampleRate);
  const recommendedTx = getRecommendedBufferSize(sampleRate);
  
  const rxThroughput = calculateThroughput(sampleRate, dataFormat);
  const txThroughput = calculateThroughput(sampleRate, dataFormat);
  
  const rxWarning = getWarningLevel(config.rxBufferSize, recommendedRx);
  const txWarning = getWarningLevel(config.txBufferSize, recommendedTx);

  const handleRxBufferChange = (value: number) => {
    onChange({ ...config, rxBufferSize: value });
  };

  const handleTxBufferChange = (value: number) => {
    onChange({ ...config, txBufferSize: value });
  };

  const bufferSizeOptions = [1024, 2048, 4096, 8192, 16384, 32768, 65536];

  return (
    <Card className="sdr-card p-6 space-y-6">
      <div>
        <Label className="text-lg font-semibold" style={{ fontFamily: 'var(--dd-font-display)' }}>
          {t('buffer.title')}
        </Label>
        <p className="text-sm mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
          {t('buffer.subtitle')}
        </p>
      </div>

      {/* RX Buffer Size */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
            RX Buffer Size
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={config.rxBufferSize}
              onChange={(e) => handleRxBufferChange(parseInt(e.target.value) || 4096)}
              className="w-28 text-right"
              style={{ fontFamily: 'var(--dd-font-mono)' }}
            />
            <span className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>samples</span>
          </div>
        </div>

        <Slider
          value={[Math.log2(config.rxBufferSize)]}
          onValueChange={([value]) => handleRxBufferChange(Math.pow(2, value))}
          min={10}
          max={16}
          step={1}
          className="w-full"
        />

        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
          <span>1024</span>
          <span>2048</span>
          <span>4096</span>
          <span>8192</span>
          <span>16K</span>
          <span>32K</span>
          <span>65K</span>
        </div>

        {/* RX Throughput Info */}
        <div className="flex items-start gap-2 p-3 rounded" style={{ backgroundColor: 'var(--dd-bg-secondary)' }}>
          <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--dd-accent-blue)' }} />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--dd-text-primary)' }}>
              RX Throughput: {rxThroughput.toFixed(2)} MB/s
            </p>
            <p className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
              Recommended: {recommendedRx.toLocaleString()} samples for {(sampleRate / 1e6).toFixed(1)} MHz sample rate
            </p>
          </div>
        </div>

        {/* RX Warning */}
        {rxWarning !== 'none' && (
          <div className={`flex items-start gap-2 p-3 rounded ${rxWarning === 'warning' ? 'sdr-alert-warning' : 'sdr-alert-info'}`}>
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {rxWarning === 'warning' ? 'Buffer Size Too Small' : 'Suboptimal Buffer Size'}
              </p>
              <p className="text-xs mt-1">
                {rxWarning === 'warning' 
                  ? `Buffer size is significantly below recommended. May cause dropped samples at high sample rates.`
                  : `Consider increasing to ${recommendedRx.toLocaleString()} samples for better performance.`
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* TX Buffer Size */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
            TX Buffer Size
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={config.txBufferSize}
              onChange={(e) => handleTxBufferChange(parseInt(e.target.value) || 4096)}
              className="w-28 text-right"
              style={{ fontFamily: 'var(--dd-font-mono)' }}
            />
            <span className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>samples</span>
          </div>
        </div>

        <Slider
          value={[Math.log2(config.txBufferSize)]}
          onValueChange={([value]) => handleTxBufferChange(Math.pow(2, value))}
          min={10}
          max={16}
          step={1}
          className="w-full"
        />

        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
          <span>1024</span>
          <span>2048</span>
          <span>4096</span>
          <span>8192</span>
          <span>16K</span>
          <span>32K</span>
          <span>65K</span>
        </div>

        {/* TX Throughput Info */}
        <div className="flex items-start gap-2 p-3 rounded" style={{ backgroundColor: 'var(--dd-bg-secondary)' }}>
          <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--dd-accent-blue)' }} />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--dd-text-primary)' }}>
              TX Throughput: {txThroughput.toFixed(2)} MB/s
            </p>
            <p className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
              Recommended: {recommendedTx.toLocaleString()} samples for {(sampleRate / 1e6).toFixed(1)} MHz sample rate
            </p>
          </div>
        </div>

        {/* TX Warning */}
        {txWarning !== 'none' && (
          <div className={`flex items-start gap-2 p-3 rounded ${txWarning === 'warning' ? 'sdr-alert-warning' : 'sdr-alert-info'}`}>
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {txWarning === 'warning' ? 'Buffer Size Too Small' : 'Suboptimal Buffer Size'}
              </p>
              <p className="text-xs mt-1">
                {txWarning === 'warning' 
                  ? `Buffer size is significantly below recommended. May cause underruns during transmission.`
                  : `Consider increasing to ${recommendedTx.toLocaleString()} samples for better performance.`
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Overall Throughput Summary */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--dd-border)' }}>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--dd-text-secondary)' }}>Total RX Throughput</p>
            <p className="text-lg font-bold" style={{ fontFamily: 'var(--dd-font-mono)', color: 'var(--dd-accent-blue)' }}>
              {rxThroughput.toFixed(2)} MB/s
            </p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--dd-text-secondary)' }}>Total TX Throughput</p>
            <p className="text-lg font-bold" style={{ fontFamily: 'var(--dd-font-mono)', color: 'var(--dd-accent-blue)' }}>
              {txThroughput.toFixed(2)} MB/s
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
