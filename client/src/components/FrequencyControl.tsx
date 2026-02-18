import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export interface FrequencyConfig {
  rxCenter: number; // in Hz
  txCenter: number; // in Hz
  rxBandwidth: number; // in Hz
  txBandwidth: number; // in Hz
}

interface FrequencyControlProps {
  config: FrequencyConfig;
  onChange: (config: FrequencyConfig) => void;
}

type FrequencyUnit = 'Hz' | 'kHz' | 'MHz' | 'GHz';

const UNIT_MULTIPLIERS: Record<FrequencyUnit, number> = {
  'Hz': 1,
  'kHz': 1_000,
  'MHz': 1_000_000,
  'GHz': 1_000_000_000,
};

function formatFrequency(hz: number): { value: string; unit: FrequencyUnit } {
  if (hz >= 1_000_000_000) {
    return { value: (hz / 1_000_000_000).toFixed(3), unit: 'GHz' };
  } else if (hz >= 1_000_000) {
    return { value: (hz / 1_000_000).toFixed(3), unit: 'MHz' };
  } else if (hz >= 1_000) {
    return { value: (hz / 1_000).toFixed(3), unit: 'kHz' };
  }
  return { value: hz.toString(), unit: 'Hz' };
}

function FrequencyInput({
  label,
  value,
  onChange,
  min = 0,
  max = 6_000_000_000,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const formatted = formatFrequency(value);
  const [displayValue, setDisplayValue] = useState(formatted.value);
  const [unit, setUnit] = useState<FrequencyUnit>(formatted.unit);

  // Sync display when value prop changes externally (template load, config import)
  useEffect(() => {
    const f = formatFrequency(value);
    setDisplayValue(f.value);
    setUnit(f.unit);
  }, [value]);

  const handleValueChange = (newValue: string) => {
    setDisplayValue(newValue);
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue)) {
      const hz = numValue * UNIT_MULTIPLIERS[unit];
      if (hz >= min && hz <= max) {
        onChange(hz);
      }
    }
  };

  const handleUnitChange = (newUnit: FrequencyUnit) => {
    setUnit(newUnit);
    const numValue = parseFloat(displayValue);
    if (!isNaN(numValue)) {
      const hz = numValue * UNIT_MULTIPLIERS[newUnit];
      if (hz >= min && hz <= max) {
        onChange(hz);
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium" style={{ color: 'var(--dd-text-primary)' }}>
        {label}
      </Label>
      <div className="flex gap-2">
        <Input
          type="number"
          step="0.001"
          value={displayValue}
          onChange={(e) => handleValueChange(e.target.value)}
          className="sdr-input sdr-numeric flex-1"
        />
        <Select value={unit} onValueChange={handleUnitChange}>
          <SelectTrigger className="w-24 sdr-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Hz">Hz</SelectItem>
            <SelectItem value="kHz">kHz</SelectItem>
            <SelectItem value="MHz">MHz</SelectItem>
            <SelectItem value="GHz">GHz</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
        {value.toLocaleString()} Hz
      </p>
    </div>
  );
}

export default function FrequencyControl({ config, onChange }: FrequencyControlProps) {
  const { t } = useLanguage();
  const updateConfig = (updates: Partial<FrequencyConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-semibold" style={{ fontFamily: 'var(--dd-font-display)' }}>
          {t('frequency.title')}
        </Label>
        <p className="text-sm mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
          {t('frequency.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RX Configuration */}
        <Card className="sdr-panel">
          <h3 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-accent-green)' }}>
            {t('frequency.rxConfig')}
          </h3>
          <div className="space-y-4">
            <FrequencyInput
              label="RX Center Frequency"
              value={config.rxCenter}
              onChange={(value) => updateConfig({ rxCenter: value })}
              min={30_000_000}
              max={6_000_000_000}
            />
            <FrequencyInput
              label="RX Bandwidth"
              value={config.rxBandwidth}
              onChange={(value) => updateConfig({ rxBandwidth: value })}
              min={1_000_000}
              max={70_000_000}
            />
          </div>
        </Card>

        {/* TX Configuration */}
        <Card className="sdr-panel">
          <h3 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-accent-orange)' }}>
            {t('frequency.txConfig')}
          </h3>
          <div className="space-y-4">
            <FrequencyInput
              label="TX Center Frequency"
              value={config.txCenter}
              onChange={(value) => updateConfig({ txCenter: value })}
              min={30_000_000}
              max={6_000_000_000}
            />
            <FrequencyInput
              label="TX Bandwidth"
              value={config.txBandwidth}
              onChange={(value) => updateConfig({ txBandwidth: value })}
              min={1_000_000}
              max={70_000_000}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
