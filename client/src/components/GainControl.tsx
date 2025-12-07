import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export interface GainConfig {
  rxLna: number; // RX LNA gain in dB (0-30)
  rxPga: number; // RX PGA gain in dB (0-19)
  rxVga: number; // RX VGA gain in dB (0-15)
  txGain: number; // TX gain in dB (0-89)
}

interface GainControlProps {
  config: GainConfig;
  onChange: (config: GainConfig) => void;
}

interface GainSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  description?: string;
}

function GainSlider({ label, value, onChange, min, max, step = 1, unit = 'dB', description }: GainSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium" style={{ color: 'var(--dd-text-primary)' }}>
          {label}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={value}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value);
              if (!isNaN(newValue) && newValue >= min && newValue <= max) {
                onChange(newValue);
              }
            }}
            min={min}
            max={max}
            step={step}
            className="sdr-input sdr-numeric w-20 h-8 text-sm"
          />
          <span className="text-sm font-mono" style={{ color: 'var(--dd-text-secondary)' }}>
            {unit}
          </span>
        </div>
      </div>
      
      <Slider
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      
      <div className="flex justify-between text-xs" style={{ color: 'var(--dd-text-tertiary)' }}>
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
      
      {description && (
        <p className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
          {description}
        </p>
      )}
    </div>
  );
}

export default function GainControl({ config, onChange }: GainControlProps) {
  const { t } = useLanguage();
  const updateConfig = (updates: Partial<GainConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-semibold" style={{ fontFamily: 'var(--dd-font-display)' }}>
          {t('gain.title')}
        </Label>
        <p className="text-sm mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
          {t('gain.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RX Gain Controls */}
        <Card className="sdr-panel">
          <h3 className="text-base font-semibold mb-6" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-accent-green)' }}>
            {t('gain.rxStages')}
          </h3>
          <div className="space-y-6">
            <GainSlider
              label="RX LNA Gain"
              value={config.rxLna}
              onChange={(value) => updateConfig({ rxLna: value })}
              min={0}
              max={30}
              description="Low Noise Amplifier - Front-end gain stage (~19.5 dB typical)"
            />
            
            <GainSlider
              label="RX PGA Gain"
              value={config.rxPga}
              onChange={(value) => updateConfig({ rxPga: value })}
              min={0}
              max={19}
              description="Programmable Gain Amplifier - Intermediate gain stage"
            />
            
            <GainSlider
              label="RX VGA Gain"
              value={config.rxVga}
              onChange={(value) => updateConfig({ rxVga: value })}
              min={0}
              max={15}
              description="Variable Gain Amplifier - Final gain stage"
            />
          </div>
          
          <div className="mt-6 p-3 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)', border: '1px solid var(--dd-border-default)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--dd-text-secondary)' }}>
                {t('gain.totalRx')}
              </span>
              <span className="text-lg font-bold font-mono" style={{ color: 'var(--dd-accent-green)' }}>
                {config.rxLna + config.rxPga + config.rxVga} dB
              </span>
            </div>
          </div>
        </Card>

        {/* TX Gain Control */}
        <Card className="sdr-panel">
          <h3 className="text-base font-semibold mb-6" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-accent-orange)' }}>
            {t('gain.txControl')}
          </h3>
          <div className="space-y-6">
            <GainSlider
              label="TX Gain"
              value={config.txGain}
              onChange={(value) => updateConfig({ txGain: value })}
              min={0}
              max={89}
              description="Transmit power amplification for lab-grade over-the-air and cabled setups"
            />
            
            <div className="space-y-3 p-4 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)', border: '1px solid var(--dd-border-default)' }}>
              <h4 className="text-sm font-semibold" style={{ color: 'var(--dd-text-primary)' }}>
                TX Power Estimate
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span style={{ color: 'var(--dd-text-secondary)' }}>Gain Level:</span>
                  <div className="font-mono font-bold mt-1" style={{ color: 'var(--dd-accent-orange)' }}>
                    {config.txGain} dB
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--dd-text-secondary)' }}>Status:</span>
                  <div className="font-semibold mt-1" style={{ 
                    color: config.txGain > 70 ? 'var(--dd-accent-red)' : 
                           config.txGain > 50 ? 'var(--dd-accent-yellow)' : 
                           'var(--dd-accent-green)' 
                  }}>
                    {config.txGain > 70 ? 'High Power' : config.txGain > 50 ? 'Medium Power' : 'Low Power'}
                  </div>
                </div>
              </div>
              
              {config.txGain > 70 && (
                <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '1px solid var(--dd-accent-red)', color: 'var(--dd-accent-red)' }}>
                  ⚠️ High TX power - Ensure proper cooling and antenna connection
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
