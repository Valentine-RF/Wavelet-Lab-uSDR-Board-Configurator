import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Copy, Check, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import type { FrequencyConfig } from './FrequencyControl';
import type { GainConfig } from './GainControl';
import type { ClockConfiguration } from './ClockConfig';
import type { SampleRateConfig } from './SampleRateConfig';
import type { BufferSizeConfiguration } from './BufferSizeConfig';
import type { ChannelConfiguration } from './ChannelConfig';
import type { SyncTypeConfiguration } from './SyncTypeConfig';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { highlightCommand } from '@/lib/syntaxHighlighter';

interface CommandPreviewProps {
  rfPath?: string;
  frequency: FrequencyConfig;
  gain: GainConfig;
  clock: ClockConfiguration;
  sampleRate: SampleRateConfig;
  bufferSize: BufferSizeConfiguration;
  channels: ChannelConfiguration;
  syncConfig: SyncTypeConfiguration;
  deviceParams: string;
  mode: 'rx' | 'tx' | 'trx';
  apiType?: 'libusdr' | 'soapysdr';
}

export default function CommandPreview({
  rfPath,
  frequency,
  gain,
  clock,
  sampleRate,
  bufferSize,
  channels,
  syncConfig,
  deviceParams,
  mode,
  apiType = 'libusdr'
}: CommandPreviewProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const executeCommandMutation = trpc.terminal.executeCommand.useMutation();
  const saveHistoryMutation = trpc.commandHistory.save.useMutation();



  const buildCommand = (): string => {
    if (apiType === 'soapysdr') {
      return buildSoapySDRCommand();
    }
    
    // libusdr command
    const parts: string[] = ['usdr_dm_create'];
    
    // Mode flags
    if (mode === 'tx') {
      parts.push('-t'); // TX only
    } else if (mode === 'trx') {
      parts.push('-T'); // TX + RX
    }
    // RX is default, no flag needed
    
    // Sample rate
    parts.push(`-r ${sampleRate.sampleRate}`);
    
    // Data format
    parts.push(`-F ${sampleRate.dataFormat}`);
    
    // Buffer sizes (use dedicated buffer config instead of blockSize)
    if (mode !== 'tx') {
      parts.push(`-S ${bufferSize.rxBufferSize}`);
    }
    if (mode === 'tx' || mode === 'trx') {
      parts.push(`-O ${bufferSize.txBufferSize}`);
    }
    
    // Block count
    parts.push(`-c ${sampleRate.blockSize}`);
    
    // Frequencies
    if (mode !== 'tx') {
      parts.push(`-e ${frequency.rxCenter}`);
      parts.push(`-w ${frequency.rxBandwidth}`);
    }
    if (mode === 'tx' || mode === 'trx') {
      parts.push(`-E ${frequency.txCenter}`);
      parts.push(`-W ${frequency.txBandwidth}`);
    }
    
    // Gain controls
    if (mode !== 'tx') {
      parts.push(`-y ${gain.rxLna}`);
      parts.push(`-u ${gain.rxPga}`);
      parts.push(`-U ${gain.rxVga}`);
    }
    if (mode === 'tx' || mode === 'trx') {
      parts.push(`-Y ${gain.txGain}`);
    }
    
    // Clock configuration
    if (clock.source === 'external') {
      parts.push('-a external');
      if (clock.externalFrequency) {
        parts.push(`-x ${clock.externalFrequency}`);
      }
    } else if (clock.source === 'internal') {
      parts.push('-a internal');
    }
    
    // Channel configuration
    // RX channels (-C parameter)
    if (mode !== 'tx') {
      if (channels.rxMode === 'mask' && channels.rxChannelMask !== undefined) {
        parts.push(`-C ${channels.rxChannelMask}`);
      } else if (channels.rxMode === 'list' && channels.rxChannelList && channels.rxChannelList.length > 0) {
        parts.push(`-C :${channels.rxChannelList.join(',')}`);
      }
      // Auto mode: no -C parameter (autodetect)
    }
    
    // TX channels (-R parameter)
    if (mode === 'tx' || mode === 'trx') {
      if (channels.txMode === 'mask' && channels.txChannelMask !== undefined) {
        parts.push(`-R ${channels.txChannelMask}`);
      } else if (channels.txMode === 'list' && channels.txChannelList && channels.txChannelList.length > 0) {
        parts.push(`-R :${channels.txChannelList.join(',')}`);
      }
      // Auto mode: no -R parameter (autodetect)
    }
    
    // Device parameters
    if (deviceParams) {
      parts.push(`-D ${deviceParams}`);
    }
    
    // Sync type
    if (syncConfig.syncType !== 'none') {
      parts.push(`-s ${syncConfig.syncType}`);
    }
    
    return parts.join(` \\\n  `);
  };
  
  const buildSoapySDRCommand = (): string => {
    const lines: string[] = [];
    
    lines.push('// SoapySDR C++ Example');
    lines.push('#include <SoapySDR/Device.hpp>');
    lines.push('#include <SoapySDR/Formats.hpp>');
    lines.push('');
    lines.push('// Create device');
    lines.push('auto dev = SoapySDR::Device::make("driver=usdr");');
    lines.push('');
    
    // Set sample rate
    const direction = mode === 'tx' ? 'SOAPY_SDR_TX' : 'SOAPY_SDR_RX';
    lines.push(`// Configure sample rate`);
    lines.push(`dev->setSampleRate(${direction}, 0, ${sampleRate.sampleRate});`);
    lines.push('');
    
    // Set frequency
    if (mode !== 'tx') {
      lines.push(`// Set RX frequency`);
      lines.push(`dev->setFrequency(SOAPY_SDR_RX, 0, ${frequency.rxCenter});`);
      lines.push(`dev->setBandwidth(SOAPY_SDR_RX, 0, ${frequency.rxBandwidth});`);
      lines.push('');
    }
    if (mode === 'tx' || mode === 'trx') {
      lines.push(`// Set TX frequency`);
      lines.push(`dev->setFrequency(SOAPY_SDR_TX, 0, ${frequency.txCenter});`);
      lines.push(`dev->setBandwidth(SOAPY_SDR_TX, 0, ${frequency.txBandwidth});`);
      lines.push('');
    }
    
    // Set gain
    if (mode !== 'tx') {
      const totalRxGain = gain.rxLna + gain.rxPga + gain.rxVga;
      lines.push(`// Set RX gain`);
      lines.push(`dev->setGain(SOAPY_SDR_RX, 0, ${totalRxGain});`);
      lines.push('');
    }
    if (mode === 'tx' || mode === 'trx') {
      lines.push(`// Set TX gain`);
      lines.push(`dev->setGain(SOAPY_SDR_TX, 0, ${gain.txGain});`);
      lines.push('');
    }
    
    // Setup stream
    lines.push(`// Setup stream`);
    const format = sampleRate.dataFormat === 'ci16' ? 'SOAPY_SDR_CS16' : 'SOAPY_SDR_CF32';
    lines.push(`auto stream = dev->setupStream(${direction}, "${format}");`);
    lines.push(`dev->activateStream(stream);`);
    lines.push('');
    
    lines.push(`// Read/write samples...`);
    lines.push(`// dev->readStream(stream, buffs, numElems, flags, timeNs);`);
    
    return lines.join('\n');
  };

  const command = buildCommand();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success(t('command.copied'));
      setTimeout(() => setCopied(false), 2000);
      
      // Save to history
      await saveHistoryMutation.mutateAsync({
        command,
        executionMethod: 'copy',
        mode,
        apiType,
        rfPath,
        centerFrequency: mode !== 'tx' ? frequency.rxCenter.toString() : frequency.txCenter.toString(),
        sampleRate: sampleRate.sampleRate.toString(),
        configuration: {
          rfPath,
          frequency,
          gain,
          clock,
          sampleRate,
          bufferSize,
          channels,
          syncConfig,
          deviceParams,
          mode,
        },
      });
    } catch (err) {
      toast.error(t('command.copyFailed'));
    }
  };

  const openInTerminal = async () => {
    try {
      const result = await executeCommandMutation.mutateAsync({ command });
      if (result.success) {
        toast.success('Terminal opened successfully');
        
        // Save to history
        await saveHistoryMutation.mutateAsync({
          command,
          executionMethod: 'terminal',
          mode,
          apiType,
          rfPath,
          centerFrequency: mode !== 'tx' ? frequency.rxCenter.toString() : frequency.txCenter.toString(),
          sampleRate: sampleRate.sampleRate.toString(),
          configuration: {
            rfPath,
            frequency,
            gain,
            clock,
            sampleRate,
            bufferSize,
            channels,
            syncConfig,
            deviceParams,
            mode,
          },
        });
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error('Failed to open terminal');
    }
  };

  return (
    <div className="space-y-4">
      {/* Sticky Header with Buttons */}
      <div className="sticky top-0 z-10 pb-4" style={{ backgroundColor: 'var(--dd-bg-medium)' }}>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-lg font-semibold" style={{ fontFamily: 'var(--dd-font-display)' }}>
              {t('command.title')}
            </Label>
            <p className="text-sm mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
              {t('command.subtitle')}
            </p>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              onClick={copyToClipboard}
              className="gap-2 flex-1 min-w-0"
              style={{
                backgroundColor: 'var(--dd-accent-green)',
                color: 'var(--dd-bg-dark)',
              }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t('command.copiedBtn') : t('command.copy')}
            </Button>

            <Button
              onClick={openInTerminal}
              disabled={executeCommandMutation.isPending}
              className="gap-2 flex-1 min-w-0"
              style={{
                backgroundColor: 'var(--dd-accent-blue)',
                color: 'white',
              }}
            >
              <Terminal className="w-4 h-4" />
              {executeCommandMutation.isPending ? 'Opening...' : 'Open in Terminal'}
            </Button>
          </div>
        </div>
      </div>

      <Card className="sdr-panel">
        <div className="space-y-4">
          {/* Command Display */}
          <div className="relative">
            <div className="absolute top-3 left-3 flex items-center gap-2" style={{ color: 'var(--dd-accent-green)' }}>
              <Terminal className="w-4 h-4" />
              <span className="text-xs font-semibold">TERMINAL</span>
            </div>
            
            <pre className="p-4 pt-12 rounded font-mono text-sm overflow-x-auto" style={{ 
              backgroundColor: 'var(--dd-bg-dark)', 
              border: '2px solid var(--dd-border-active)',
              color: 'var(--dd-text-primary)'
            }}>
              <code>{highlightCommand(command, apiType)}</code>
            </pre>
          </div>

          {/* Command Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)', border: '1px solid var(--dd-border-default)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--dd-text-secondary)' }}>Mode</div>
              <div className="text-sm font-bold font-mono" style={{ color: 'var(--dd-accent-green)' }}>
                {mode.toUpperCase()}
              </div>
            </div>
            
            <div className="p-3 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)', border: '1px solid var(--dd-border-default)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--dd-text-secondary)' }}>Sample Rate</div>
              <div className="text-sm font-bold font-mono" style={{ color: 'var(--dd-accent-green)' }}>
                {(sampleRate.sampleRate / 1_000_000).toFixed(1)} MHz
              </div>
            </div>
            
            <div className="p-3 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)', border: '1px solid var(--dd-border-default)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--dd-text-secondary)' }}>Format</div>
              <div className="text-sm font-bold font-mono" style={{ color: 'var(--dd-accent-green)' }}>
                {sampleRate.dataFormat.toUpperCase()}
              </div>
            </div>
            
            <div className="p-3 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)', border: '1px solid var(--dd-border-default)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--dd-text-secondary)' }}>Clock</div>
              <div className="text-sm font-bold font-mono" style={{ color: 'var(--dd-accent-green)' }}>
                {clock.source.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="p-4 rounded" style={{ backgroundColor: 'rgba(30, 144, 255, 0.1)', border: '1px solid var(--dd-accent-blue)' }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--dd-accent-blue)' }}>
              Usage Instructions
            </h4>
            <ul className="text-xs space-y-1" style={{ color: 'var(--dd-text-secondary)' }}>
              <li>• Copy the command above and run it in your terminal on the host system</li>
              <li>• Ensure the uSDR Development Board is properly connected (PCIe or USB)</li>
              <li>• The <code className="font-mono px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)' }}>-c -1</code> flag enables continuous streaming until CTRL-C</li>
              <li>• Modify output file with <code className="font-mono px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)' }}>-f &lt;filename&gt;</code> for recording</li>
              <li>• Add <code className="font-mono px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)' }}>-I &lt;file&gt;</code> for TX playback from file</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
