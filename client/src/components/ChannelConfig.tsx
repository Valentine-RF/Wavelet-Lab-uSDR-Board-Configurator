import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, Radio } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ChannelConfiguration {
  rxMode: 'auto' | 'mask' | 'list';
  rxChannelMask?: number;
  rxChannelList?: string[];
  txMode: 'auto' | 'mask' | 'list';
  txChannelMask?: number;
  txChannelList?: string[];
}

interface ChannelConfigProps {
  config: ChannelConfiguration;
  onChange: (config: ChannelConfiguration) => void;
}

// Common channel names for SDR applications
const COMMON_CHANNELS = ['A', 'B', 'C', 'D'];

export default function ChannelConfig({ config, onChange }: ChannelConfigProps) {
  const { t } = useLanguage();
  const [rxChannelInput, setRxChannelInput] = useState('');
  const [txChannelInput, setTxChannelInput] = useState('');

  const handleRxModeChange = (mode: 'auto' | 'mask' | 'list') => {
    onChange({
      ...config,
      rxMode: mode,
      rxChannelMask: mode === 'mask' ? (config.rxChannelMask || 1) : undefined,
      rxChannelList: mode === 'list' ? (config.rxChannelList || ['A']) : undefined,
    });
  };

  const handleTxModeChange = (mode: 'auto' | 'mask' | 'list') => {
    onChange({
      ...config,
      txMode: mode,
      txChannelMask: mode === 'mask' ? (config.txChannelMask || 1) : undefined,
      txChannelList: mode === 'list' ? (config.txChannelList || ['A']) : undefined,
    });
  };

  const handleRxMaskChange = (mask: number) => {
    onChange({ ...config, rxChannelMask: mask });
  };

  const handleTxMaskChange = (mask: number) => {
    onChange({ ...config, txChannelMask: mask });
  };

  const toggleRxChannel = (channel: string) => {
    const currentList = config.rxChannelList || [];
    const newList = currentList.includes(channel)
      ? currentList.filter(c => c !== channel)
      : [...currentList, channel];
    onChange({ ...config, rxChannelList: newList.length > 0 ? newList : ['A'] });
  };

  const toggleTxChannel = (channel: string) => {
    const currentList = config.txChannelList || [];
    const newList = currentList.includes(channel)
      ? currentList.filter(c => c !== channel)
      : [...currentList, channel];
    onChange({ ...config, txChannelList: newList.length > 0 ? newList : ['A'] });
  };

  const addRxCustomChannel = () => {
    if (rxChannelInput.trim()) {
      const currentList = config.rxChannelList || [];
      if (!currentList.includes(rxChannelInput.trim())) {
        onChange({ ...config, rxChannelList: [...currentList, rxChannelInput.trim()] });
      }
      setRxChannelInput('');
    }
  };

  const addTxCustomChannel = () => {
    if (txChannelInput.trim()) {
      const currentList = config.txChannelList || [];
      if (!currentList.includes(txChannelInput.trim())) {
        onChange({ ...config, txChannelList: [...currentList, txChannelInput.trim()] });
      }
      setTxChannelInput('');
    }
  };

  const removeRxChannel = (channel: string) => {
    const newList = (config.rxChannelList || []).filter(c => c !== channel);
    onChange({ ...config, rxChannelList: newList.length > 0 ? newList : ['A'] });
  };

  const removeTxChannel = (channel: string) => {
    const newList = (config.txChannelList || []).filter(c => c !== channel);
    onChange({ ...config, txChannelList: newList.length > 0 ? newList : ['A'] });
  };

  // Convert mask to binary representation for display
  const maskToBinary = (mask: number): string => {
    return mask.toString(2).padStart(8, '0');
  };

  // Get active channels from mask
  const getActiveChannelsFromMask = (mask: number): number[] => {
    const channels: number[] = [];
    for (let i = 0; i < 8; i++) {
      if (mask & (1 << i)) {
        channels.push(i);
      }
    }
    return channels;
  };

  return (
    <Card className="sdr-card p-6 space-y-6">
      <div>
        <Label className="text-lg font-semibold" style={{ fontFamily: 'var(--dd-font-display)' }}>
          {t('channels.title')}
        </Label>
        <p className="text-sm mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
          {t('channels.subtitle')}
        </p>
      </div>

      <div className="flex items-start gap-2 p-3 rounded" style={{ backgroundColor: 'var(--dd-bg-secondary)' }}>
        <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--dd-accent-blue)' }} />
        <div className="flex-1 text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
          <p className="font-semibold mb-1" style={{ color: 'var(--dd-text-primary)' }}>Channel Selection Modes:</p>
          <ul className="space-y-1 ml-4 list-disc">
            <li><strong>Auto:</strong> Automatic channel detection (default)</li>
            <li><strong>Mask:</strong> Numeric bitmask (e.g., 3 = channels 0 and 1)</li>
            <li><strong>Named List:</strong> Comma-separated channel names (e.g., A,B,C)</li>
          </ul>
        </div>
      </div>

      {/* RX Channels */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5" style={{ color: 'var(--dd-accent-blue)' }} />
          <Label className="text-base font-semibold" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
            {t('channels.rxChannels')}
          </Label>
        </div>

        <Tabs value={config.rxMode} onValueChange={(value) => handleRxModeChange(value as 'auto' | 'mask' | 'list')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auto">Auto</TabsTrigger>
            <TabsTrigger value="mask">Mask</TabsTrigger>
            <TabsTrigger value="list">Named List</TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="mt-4">
            <div className="text-center py-6" style={{ color: 'var(--dd-text-secondary)' }}>
              <p className="text-sm">Channels will be automatically detected</p>
              <p className="text-xs mt-2">No manual configuration required</p>
            </div>
          </TabsContent>

          <TabsContent value="mask" className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-sm mb-2 block">Channel Mask (Decimal)</Label>
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={config.rxChannelMask || 1}
                  onChange={(e) => handleRxMaskChange(parseInt(e.target.value) || 1)}
                  className="font-mono"
                />
              </div>
              <div className="flex-1">
                <Label className="text-sm mb-2 block">Binary Representation</Label>
                <div className="px-3 py-2 rounded border font-mono text-sm" style={{ backgroundColor: 'var(--dd-bg-secondary)', borderColor: 'var(--dd-border)' }}>
                  {maskToBinary(config.rxChannelMask || 1)}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Active Channels</Label>
              <div className="flex flex-wrap gap-2">
                {getActiveChannelsFromMask(config.rxChannelMask || 1).map(ch => (
                  <Badge key={ch} className="sdr-badge sdr-badge-success">
                    Channel {ch}
                  </Badge>
                ))}
                {getActiveChannelsFromMask(config.rxChannelMask || 1).length === 0 && (
                  <span className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>No channels selected</span>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-4 space-y-4">
            <div>
              <Label className="text-sm mb-2 block">Common Channels</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_CHANNELS.map(channel => (
                  <Button
                    key={channel}
                    variant={config.rxChannelList?.includes(channel) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleRxChannel(channel)}
                    className={config.rxChannelList?.includes(channel) ? 'sdr-button-primary' : ''}
                  >
                    {channel}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Custom Channel Name</Label>
              <div className="flex gap-2">
                <Input
                  value={rxChannelInput}
                  onChange={(e) => setRxChannelInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addRxCustomChannel()}
                  placeholder="Enter channel name..."
                  className="flex-1"
                />
                <Button onClick={addRxCustomChannel} variant="outline">Add</Button>
              </div>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Selected Channels</Label>
              <div className="flex flex-wrap gap-2">
                {(config.rxChannelList || []).map(channel => (
                  <Badge
                    key={channel}
                    className="sdr-badge sdr-badge-info cursor-pointer"
                    onClick={() => removeRxChannel(channel)}
                  >
                    {channel} ×
                  </Badge>
                ))}
                {(config.rxChannelList || []).length === 0 && (
                  <span className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>No channels selected</span>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* TX Channels */}
      <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--dd-border)' }}>
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5" style={{ color: 'var(--dd-accent-blue)' }} />
          <Label className="text-base font-semibold" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
            TX Channels
          </Label>
        </div>

        <Tabs value={config.txMode} onValueChange={(value) => handleTxModeChange(value as 'auto' | 'mask' | 'list')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auto">Auto</TabsTrigger>
            <TabsTrigger value="mask">Mask</TabsTrigger>
            <TabsTrigger value="list">Named List</TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="mt-4">
            <div className="text-center py-6" style={{ color: 'var(--dd-text-secondary)' }}>
              <p className="text-sm">Channels will be automatically detected</p>
              <p className="text-xs mt-2">No manual configuration required</p>
            </div>
          </TabsContent>

          <TabsContent value="mask" className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-sm mb-2 block">Channel Mask (Decimal)</Label>
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={config.txChannelMask || 1}
                  onChange={(e) => handleTxMaskChange(parseInt(e.target.value) || 1)}
                  className="font-mono"
                />
              </div>
              <div className="flex-1">
                <Label className="text-sm mb-2 block">Binary Representation</Label>
                <div className="px-3 py-2 rounded border font-mono text-sm" style={{ backgroundColor: 'var(--dd-bg-secondary)', borderColor: 'var(--dd-border)' }}>
                  {maskToBinary(config.txChannelMask || 1)}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Active Channels</Label>
              <div className="flex flex-wrap gap-2">
                {getActiveChannelsFromMask(config.txChannelMask || 1).map(ch => (
                  <Badge key={ch} className="sdr-badge sdr-badge-warning">
                    Channel {ch}
                  </Badge>
                ))}
                {getActiveChannelsFromMask(config.txChannelMask || 1).length === 0 && (
                  <span className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>No channels selected</span>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-4 space-y-4">
            <div>
              <Label className="text-sm mb-2 block">Common Channels</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_CHANNELS.map(channel => (
                  <Button
                    key={channel}
                    variant={config.txChannelList?.includes(channel) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleTxChannel(channel)}
                    className={config.txChannelList?.includes(channel) ? 'sdr-button-primary' : ''}
                  >
                    {channel}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Custom Channel Name</Label>
              <div className="flex gap-2">
                <Input
                  value={txChannelInput}
                  onChange={(e) => setTxChannelInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTxCustomChannel()}
                  placeholder="Enter channel name..."
                  className="flex-1"
                />
                <Button onClick={addTxCustomChannel} variant="outline">Add</Button>
              </div>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Selected Channels</Label>
              <div className="flex flex-wrap gap-2">
                {(config.txChannelList || []).map(channel => (
                  <Badge
                    key={channel}
                    className="sdr-badge sdr-badge-warning cursor-pointer"
                    onClick={() => removeTxChannel(channel)}
                  >
                    {channel} ×
                  </Badge>
                ))}
                {(config.txChannelList || []).length === 0 && (
                  <span className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>No channels selected</span>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
