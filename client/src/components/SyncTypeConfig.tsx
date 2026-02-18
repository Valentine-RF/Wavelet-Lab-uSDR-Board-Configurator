import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Satellite, Radio, Zap, Ban, Power } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface SyncTypeConfiguration {
  syncType: '1pps' | 'rx' | 'tx' | 'any' | 'none' | 'off';
}

interface SyncTypeConfigProps {
  value: SyncTypeConfiguration;
  onChange: (config: SyncTypeConfiguration) => void;
}

const syncModes = [
  {
    id: '1pps' as const,
    label: '1PPS',
    icon: Satellite,
    description: 'GPS 1 Pulse Per Second timing',
    useCase: 'GPS-disciplined oscillator synchronization',
    color: 'var(--dd-accent-blue)',
  },
  {
    id: 'rx' as const,
    label: 'RX Sync',
    icon: Radio,
    description: 'Synchronize to RX stream',
    useCase: 'Receive-only applications',
    color: 'var(--dd-accent-green)',
  },
  {
    id: 'tx' as const,
    label: 'TX Sync',
    icon: Zap,
    description: 'Synchronize to TX stream',
    useCase: 'Transmit-only applications',
    color: 'var(--dd-accent-orange)',
  },
  {
    id: 'any' as const,
    label: 'Any',
    icon: Clock,
    description: 'Automatic synchronization',
    useCase: 'Multi-device coordination',
    color: 'var(--dd-accent-purple)',
  },
  {
    id: 'none' as const,
    label: 'None',
    icon: Ban,
    description: 'No external synchronization',
    useCase: 'Standalone operation',
    color: 'var(--dd-text-secondary)',
  },
  {
    id: 'off' as const,
    label: 'Off',
    icon: Power,
    description: 'Disable synchronization',
    useCase: 'Free-running mode',
    color: 'var(--dd-text-tertiary)',
  },
];

export default function SyncTypeConfig({ value, onChange }: SyncTypeConfigProps) {
  const { t } = useLanguage();

  const handleModeChange = (mode: SyncTypeConfiguration['syncType']) => {
    onChange({ syncType: mode });
  };

  const currentMode = syncModes.find(m => m.id === value.syncType);

  return (
    <Card className="sdr-panel">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold" style={{ fontFamily: 'var(--dd-font-display)' }}>
            {t('sync.title')}
          </Label>
          <p className="text-sm mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
            {t('sync.subtitle')}
          </p>
        </div>

        {/* Current Selection Summary */}
        {currentMode && (
          <div 
            className="p-4 rounded-lg border-l-4"
            style={{
              backgroundColor: 'var(--dd-bg-secondary)',
              borderLeftColor: currentMode.color,
            }}
          >
            <div className="flex items-start gap-3">
              <currentMode.icon 
                className="w-5 h-5 mt-0.5" 
                style={{ color: currentMode.color }} 
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold" style={{ color: 'var(--dd-text-primary)' }}>
                    {currentMode.label}
                  </span>
                  <Badge 
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${currentMode.color}20`,
                      color: currentMode.color,
                      border: `1px solid ${currentMode.color}40`,
                    }}
                  >
                    {t('sync.active')}
                  </Badge>
                </div>
                <p className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>
                  {currentMode.description}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--dd-text-tertiary)' }}>
                  {t('sync.useCase')}: {currentMode.useCase}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mode Selection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {syncModes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = value.syncType === mode.id;
            
            return (
              <Button
                key={mode.id}
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => handleModeChange(mode.id)}
                className="h-auto p-4 flex flex-col items-start gap-2 text-left"
                style={isSelected ? {
                  backgroundColor: mode.color,
                  borderColor: mode.color,
                  color: 'white',
                } : {
                  borderColor: 'var(--dd-border-default)',
                }}
              >
                <div className="flex items-center gap-2 w-full">
                  <Icon 
                    className="w-4 h-4" 
                    style={{ color: isSelected ? 'white' : mode.color }} 
                  />
                  <span className="font-semibold text-sm">
                    {mode.label}
                  </span>
                </div>
                <p 
                  className="text-xs line-clamp-2"
                  style={{ 
                    color: isSelected ? 'rgba(255,255,255,0.9)' : 'var(--dd-text-secondary)' 
                  }}
                >
                  {mode.description}
                </p>
              </Button>
            );
          })}
        </div>

        {/* Validation Warnings */}
        {value.syncType === '1pps' && (
          <div 
            className="p-3 rounded-lg flex items-start gap-2"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
          >
            <Satellite className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--dd-accent-blue)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--dd-text-primary)' }}>
                {t('sync.gpsRequired')}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
                {t('sync.gpsWarning')}
              </p>
            </div>
          </div>
        )}

        {(value.syncType === 'rx' || value.syncType === 'tx') && (
          <div 
            className="p-3 rounded-lg flex items-start gap-2"
            style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}
          >
            <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--dd-status-warning)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--dd-text-primary)' }}>
                {t('sync.streamWarning')}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
                {t('sync.streamWarningDetail')}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
