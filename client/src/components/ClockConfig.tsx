import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ClockConfiguration {
  source: 'internal' | 'devboard' | 'external';
  externalFrequency?: number; // in Hz, for external clock (23-41 MHz)
  dacTuning?: number; // 0-4095 for DevBoard clock fine-tuning
  oscOn?: boolean; // DevBoard oscillator enable
}

interface ClockConfigProps {
  config: ClockConfiguration;
  onChange: (config: ClockConfiguration) => void;
}

export default function ClockConfig({ config, onChange }: ClockConfigProps) {
  const { t } = useLanguage();
  const updateConfig = (updates: Partial<ClockConfiguration>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-semibold" style={{ fontFamily: 'var(--dd-font-display)' }}>
          {t('clock.title')}
        </Label>
        <p className="text-sm mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
          {t('clock.subtitle')}
        </p>
      </div>

      <Card className="sdr-panel">
        <div className="space-y-6">
          {/* Clock Source Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
              {t('clock.source')}
            </Label>
            
            <RadioGroup
              value={config.source}
              onValueChange={(value: 'internal' | 'devboard' | 'external') => updateConfig({ source: value })}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 p-3 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)', border: '1px solid var(--dd-border-default)' }}>
                <RadioGroupItem value="internal" id="internal" />
                <div className="flex-1">
                  <Label htmlFor="internal" className="font-medium cursor-pointer" style={{ color: 'var(--dd-text-primary)' }}>
                    Internal uSDR Reference
                  </Label>
                  <p className="text-xs mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
                    26 MHz internal reference (default mode)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)', border: '1px solid var(--dd-border-default)' }}>
                <RadioGroupItem value="devboard" id="devboard" />
                <div className="flex-1">
                  <Label htmlFor="devboard" className="font-medium cursor-pointer" style={{ color: 'var(--dd-text-primary)' }}>
                    DevBoard Reference Clock
                  </Label>
                  <p className="text-xs mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
                    ~25 MHz DevBoard clock generator (Rev 1.0) with DAC fine-tuning
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)', border: '1px solid var(--dd-border-default)' }}>
                <RadioGroupItem value="external" id="external" />
                <div className="flex-1">
                  <Label htmlFor="external" className="font-medium cursor-pointer" style={{ color: 'var(--dd-text-primary)' }}>
                    External Clock Generator
                  </Label>
                  <p className="text-xs mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
                    External clock input (23-41 MHz, max 3.3V peak)
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* External Clock Frequency */}
          {config.source === 'external' && (
            <div className="space-y-2 p-4 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)', border: '1px solid var(--dd-border-active)' }}>
              <Label className="text-sm font-medium" style={{ color: 'var(--dd-text-primary)' }}>
                External Clock Frequency
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={config.externalFrequency ? (config.externalFrequency / 1_000_000).toFixed(3) : '26.000'}
                  onChange={(e) => {
                    const mhz = parseFloat(e.target.value);
                    if (!isNaN(mhz) && mhz >= 23 && mhz <= 41) {
                      updateConfig({ externalFrequency: mhz * 1_000_000 });
                    }
                  }}
                  min="23"
                  max="41"
                  step="0.001"
                  className="sdr-input sdr-numeric flex-1"
                />
                <span className="text-sm font-mono" style={{ color: 'var(--dd-text-secondary)' }}>MHz</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--dd-text-tertiary)' }}>
                Valid range: 23-41 MHz
              </p>
            </div>
          )}

          {/* DevBoard DAC Tuning */}
          {config.source === 'devboard' && (
            <div className="space-y-4 p-4 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)', border: '1px solid var(--dd-border-active)' }}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium" style={{ color: 'var(--dd-text-primary)' }}>
                    DAC Fine-Tuning
                  </Label>
                  <span className="text-sm font-mono font-bold" style={{ color: 'var(--dd-accent-green)' }}>
                    {config.dacTuning ?? 2048}
                  </span>
                </div>
                
                <Slider
                  value={[config.dacTuning ?? 2048]}
                  onValueChange={([value]) => updateConfig({ dacTuning: value })}
                  min={0}
                  max={4095}
                  step={1}
                  className="w-full"
                />
                
                <div className="flex justify-between text-xs" style={{ color: 'var(--dd-text-tertiary)' }}>
                  <span>0</span>
                  <span>2048 (center)</span>
                  <span>4095</span>
                </div>
                
                <p className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
                  DAC-controlled VCTCXO fine-tuning for precision clock adjustment
                </p>
              </div>
            </div>
          )}

          {/* GPSDO Information */}
          <div className="p-4 rounded" style={{ backgroundColor: 'rgba(30, 144, 255, 0.1)', border: '1px solid var(--dd-accent-blue)' }}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">🛰️</div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--dd-accent-blue)' }}>
                  GPSDO Available
                </h4>
                <p className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
                  The DevBoard includes a GNSS module with DAC-controlled VCTCXO for GPS-disciplined oscillator functionality. 
                  Enable GPSDO through device parameters for high-precision timing applications.
                </p>
              </div>
            </div>
          </div>

          {/* Clock Summary */}
          <div className="p-4 rounded" style={{ backgroundColor: 'var(--dd-bg-light)', border: '1px solid var(--dd-border-default)' }}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--dd-text-primary)' }}>
              Configuration Summary
            </h4>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span style={{ color: 'var(--dd-text-secondary)' }}>Source:</span>
                <span style={{ color: 'var(--dd-accent-green)' }}>
                  {config.source === 'internal' ? 'Internal (26 MHz)' : 
                   config.source === 'devboard' ? 'DevBoard (~25 MHz)' : 
                   `External (${config.externalFrequency ? (config.externalFrequency / 1_000_000).toFixed(3) : '26.000'} MHz)`}
                </span>
              </div>
              {config.source === 'devboard' && config.dacTuning !== undefined && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--dd-text-secondary)' }}>DAC Tuning:</span>
                  <span style={{ color: 'var(--dd-accent-green)' }}>{config.dacTuning}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
