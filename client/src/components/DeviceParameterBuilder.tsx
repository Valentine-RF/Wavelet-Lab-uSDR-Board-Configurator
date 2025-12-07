import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export interface DeviceParameters {
  lnaOn: boolean;
  paOn: boolean;
  gpsdoOn: boolean;
  oscOn: boolean;
  rfPath?: string;
  dacValue?: number;
}

interface DeviceParameterBuilderProps {
  parameters: DeviceParameters;
  onChange: (parameters: DeviceParameters) => void;
  rfPath?: string;
  clockSource?: string;
  dacTuning?: number;
}

export default function DeviceParameterBuilder({ 
  parameters, 
  onChange,
  rfPath,
  clockSource,
  dacTuning
}: DeviceParameterBuilderProps) {
  const [copied, setCopied] = useState(false);

  const updateParameter = (updates: Partial<DeviceParameters>) => {
    onChange({ ...parameters, ...updates });
  };

  // Build the -D parameter string
  const buildDeviceString = (): string => {
    const parts: string[] = ['fe=pciefev1'];
    
    // Add RF path if selected
    if (rfPath) {
      parts.push(`path_${rfPath}`);
    }
    
    // Add LNA control
    if (parameters.lnaOn) {
      parts.push('lna_on');
    } else {
      parts.push('lna_off');
    }
    
    // Add PA control
    if (parameters.paOn) {
      parts.push('pa_on');
    } else {
      parts.push('pa_off');
    }
    
    // Add GPSDO control
    if (parameters.gpsdoOn) {
      parts.push('gpsdo_on');
    }
    
    // Add oscillator control (for DevBoard clock)
    if (clockSource === 'devboard' || parameters.oscOn) {
      parts.push('osc_on');
    }
    
    // Add DAC tuning if DevBoard clock is selected
    if (clockSource === 'devboard' && dacTuning !== undefined) {
      parts.push(`dac_${dacTuning}`);
    }
    
    return parts.join(':');
  };

  const deviceString = buildDeviceString();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(deviceString);
      setCopied(true);
      toast.success('Device parameter string copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-semibold" style={{ fontFamily: 'var(--dd-font-display)' }}>
          Device Parameters (-D)
        </Label>
        <p className="text-sm mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
          Configure DevBoard-specific front-end options
        </p>
      </div>

      <Card className="sdr-panel">
        <div className="space-y-6">
          {/* Hardware Controls */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
              Hardware Controls
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)', border: '1px solid var(--dd-border-default)' }}>
                <div className="space-y-1">
                  <Label htmlFor="lna-switch" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--dd-text-primary)' }}>
                    LNA (Low Noise Amplifier)
                  </Label>
                  <p className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
                    Front-end RX amplification
                  </p>
                </div>
                <Switch
                  id="lna-switch"
                  checked={parameters.lnaOn}
                  onCheckedChange={(checked) => updateParameter({ lnaOn: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)', border: '1px solid var(--dd-border-default)' }}>
                <div className="space-y-1">
                  <Label htmlFor="pa-switch" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--dd-text-primary)' }}>
                    PA (Power Amplifier)
                  </Label>
                  <p className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
                    TX power amplification
                  </p>
                </div>
                <Switch
                  id="pa-switch"
                  checked={parameters.paOn}
                  onCheckedChange={(checked) => updateParameter({ paOn: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)', border: '1px solid var(--dd-border-default)' }}>
                <div className="space-y-1">
                  <Label htmlFor="gpsdo-switch" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--dd-text-primary)' }}>
                    GPSDO
                  </Label>
                  <p className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
                    GPS-disciplined oscillator
                  </p>
                </div>
                <Switch
                  id="gpsdo-switch"
                  checked={parameters.gpsdoOn}
                  onCheckedChange={(checked) => updateParameter({ gpsdoOn: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)', border: '1px solid var(--dd-border-default)' }}>
                <div className="space-y-1">
                  <Label htmlFor="osc-switch" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--dd-text-primary)' }}>
                    DevBoard Oscillator
                  </Label>
                  <p className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
                    Enable DevBoard clock
                  </p>
                </div>
                <Switch
                  id="osc-switch"
                  checked={parameters.oscOn || clockSource === 'devboard'}
                  onCheckedChange={(checked) => updateParameter({ oscOn: checked })}
                  disabled={clockSource === 'devboard'}
                />
              </div>
            </div>
          </div>

          {/* Generated Parameter String */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
                Generated Parameter String
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            
            <div className="p-4 rounded font-mono text-sm overflow-x-auto" style={{ 
              backgroundColor: 'var(--dd-bg-dark)', 
              border: '2px solid var(--dd-border-active)',
              color: 'var(--dd-accent-green)'
            }}>
              -D {deviceString}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {deviceString.split(':').map((param, index) => (
                <Badge key={index} className="sdr-badge sdr-badge-success">
                  {param}
                </Badge>
              ))}
            </div>
          </div>

          {/* Parameter Explanation */}
          <div className="p-4 rounded" style={{ backgroundColor: 'rgba(30, 144, 255, 0.1)', border: '1px solid var(--dd-accent-blue)' }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--dd-accent-blue)' }}>
              Parameter Format
            </h4>
            <p className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
              The <code className="font-mono px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)' }}>-D</code> option 
              accepts a comma-separated name=value list. For the <code className="font-mono px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)' }}>fe=</code> parameter, 
              values are colon-separated sub-parameters that configure the DevBoard front-end (RF paths, LNA/PA, GPS, etc.).
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
