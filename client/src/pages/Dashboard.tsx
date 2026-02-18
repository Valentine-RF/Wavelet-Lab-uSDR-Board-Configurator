import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Radio, Save, FolderOpen, Settings, Activity, Download, Upload } from 'lucide-react';

import RFPathSelector from '@/components/RFPathSelector';
import FrequencyControl, { FrequencyConfig } from '@/components/FrequencyControl';
import GainControl, { GainConfig } from '@/components/GainControl';
import ClockConfig, { ClockConfiguration } from '@/components/ClockConfig';
import SampleRateConfig, { SampleRateConfig as SampleRateConfigType } from '@/components/SampleRateConfig';
import BufferSizeConfig, { BufferSizeConfiguration } from '@/components/BufferSizeConfig';
import ChannelConfig, { ChannelConfiguration } from '@/components/ChannelConfig';
import DeviceParameterBuilder, { DeviceParameters } from '@/components/DeviceParameterBuilder';
import CommandPreview from '@/components/CommandPreview';

import ValidationPanel from '@/components/ValidationPanel';
import { validateConfiguration, type ValidationResult } from '@/lib/configValidator';

import QuickStartTemplates from '@/components/QuickStartTemplates';
import type { ConfigurationTemplate } from '@/lib/configTemplates';

import { useLanguage } from '@/contexts/LanguageContext';
import SyncTypeConfig, { SyncTypeConfiguration } from '@/components/SyncTypeConfig';
import CommandHistory from '@/components/CommandHistory';
import CommandTemplateLibrary from '@/components/CommandTemplateLibrary';
import type { CommandTemplate } from '@/lib/commandTemplates';
import SaveTemplateDialog from '@/components/SaveTemplateDialog';
import SaveConfigDialog from '@/components/SaveConfigDialog';
import {
  exportConfiguration,
  downloadConfigurationFile,
  importConfigurationFromFile,
  type ImportValidationResult,
} from '@/lib/configImportExport';


export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Configuration state
  const [apiType, setApiType] = useState<'libusdr' | 'soapysdr'>('libusdr');
  const [rfPath, setRfPath] = useState<string>('rxw');
  const [mode, setMode] = useState<'rx' | 'tx' | 'trx'>('rx');
  
  const [frequencyConfig, setFrequencyConfig] = useState<FrequencyConfig>({
    rxCenter: 2_450_000_000, // 2.45 GHz (ISM band)
    txCenter: 2_450_000_000,
    rxBandwidth: 20_000_000, // 20 MHz
    txBandwidth: 20_000_000,
  });

  const [gainConfig, setGainConfig] = useState<GainConfig>({
    rxLna: 15,
    rxPga: 10,
    rxVga: 8,
    txGain: 40,
  });

  const [clockConfig, setClockConfig] = useState<ClockConfiguration>({
    source: 'internal',
  });

  const [sampleRateConfig, setSampleRateConfig] = useState<SampleRateConfigType>({
    sampleRate: 40_000_000, // 40 MHz
    dataFormat: 'ci16',
    blockSize: 16384,
    connectionType: 'pcie',
  });

  const [bufferConfig, setBufferConfig] = useState<BufferSizeConfiguration>({
    rxBufferSize: 4096,
    txBufferSize: 4096,
  });

  const [channelConfig, setChannelConfig] = useState<ChannelConfiguration>({
    rxMode: 'auto',
    txMode: 'auto',
  });
  const [syncConfig, setSyncConfig] = useState<SyncTypeConfiguration>({
    syncType: 'none',
  });

  // Validation state
  const [validation, setValidation] = useState<ValidationResult>({
    valid: true,
    issues: [],
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
  });

  // Theme switching effect based on API selection
  useEffect(() => {
    const root = document.documentElement;
    
    if (apiType === 'soapysdr') {
      // Red theme for SoapySDR
      root.style.setProperty('--dd-accent-blue', '#ef4444');
      root.style.setProperty('--dd-accent-green', '#f97316');
      root.style.setProperty('--dd-accent-yellow', '#fbbf24');
      root.style.setProperty('--dd-border-active', '#ef4444');
      root.style.setProperty('--dd-border-hover', '#f87171');
      root.style.setProperty('--dd-status-applied', '#ef4444');
      root.style.setProperty('--dd-status-info', '#ef4444');
      root.style.setProperty('--primary', 'oklch(0.60 0.20 20)'); /* red */
      root.style.setProperty('--accent', 'oklch(0.60 0.20 20)'); /* red */
    } else {
      // Blue theme for libusdr (default)
      root.style.setProperty('--dd-accent-blue', '#1e90ff');
      root.style.setProperty('--dd-accent-green', '#1e90ff');
      root.style.setProperty('--dd-accent-yellow', '#ffd700');
      root.style.setProperty('--dd-border-active', '#1e90ff');
      root.style.setProperty('--dd-border-hover', '#4da6ff');
      root.style.setProperty('--dd-status-applied', '#1e90ff');
      root.style.setProperty('--dd-status-info', '#1e90ff');
      root.style.setProperty('--primary', 'oklch(0.60 0.20 230)'); /* blue */
      root.style.setProperty('--accent', 'oklch(0.60 0.20 230)'); /* blue */
    }
  }, [apiType]);
  
  // Real-time validation effect
  useEffect(() => {
    const result = validateConfiguration(
      mode,
      rfPath,
      frequencyConfig,
      gainConfig,
      clockConfig,
      sampleRateConfig,
      bufferConfig,
      channelConfig,
      apiType
    );
    setValidation(result);
  }, [mode, rfPath, frequencyConfig, gainConfig, clockConfig, sampleRateConfig, bufferConfig, channelConfig, apiType]);

  // Apply quick-start template
  const handleApplyTemplate = (template: ConfigurationTemplate) => {
    setMode(template.mode);
    setRfPath(template.rfPath);
    setFrequencyConfig(template.frequency);
    setGainConfig(template.gain);
    setClockConfig(template.clock);
    setSampleRateConfig(template.sampleRate);
    setBufferConfig(template.buffer);
    setChannelConfig(template.channels);
    setDeviceParams(template.deviceParams);
    
    toast.success(`Applied template: ${template.name}`, {
      description: template.description,
    });
  };

  // Apply command template from library
  const handleApplyCommandTemplate = (template: CommandTemplate) => {
    setMode(template.parameters.mode);
    if (template.parameters.rfPath) {
      setRfPath(template.parameters.rfPath);
    }
    if (template.parameters.frequency) {
      setFrequencyConfig(prev => ({
        ...prev,
        rxCenter: template.parameters.frequency || prev.rxCenter,
        txCenter: template.parameters.frequency || prev.txCenter,
        rxBandwidth: template.parameters.bandwidth || prev.rxBandwidth,
        txBandwidth: template.parameters.bandwidth || prev.txBandwidth,
      }));
    }
    if (template.parameters.sampleRate) {
      setSampleRateConfig(prev => ({
        ...prev,
        sampleRate: template.parameters.sampleRate || prev.sampleRate,
      }));
    }
    if (template.parameters.gain) {
      setGainConfig(prev => ({
        ...prev,
        rxLna: template.parameters.gain?.rxLna ?? prev.rxLna,
        rxPga: template.parameters.gain?.rxPga ?? prev.rxPga,
        rxVga: template.parameters.gain?.rxVga ?? prev.rxVga,
        txGain: template.parameters.gain?.txGain ?? prev.txGain,
      }));
    }
  };

  // Save template dialog state
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);

  // Save config dialog state (for device configuration save)
  const [saveConfigDialogOpen, setSaveConfigDialogOpen] = useState(false);

  // Generate command string for template saving
  const generateCommand = (): string => {
    const parts: string[] = ['usdr_dm_create'];
    if (mode === 'tx') parts.push('-t');
    else if (mode === 'trx') parts.push('-T');
    parts.push(`-r ${sampleRateConfig.sampleRate}`);
    parts.push(`-F ${sampleRateConfig.dataFormat}`);
    if (mode !== 'tx') parts.push(`-S ${bufferConfig.rxBufferSize}`);
    if (mode === 'tx' || mode === 'trx') parts.push(`-O ${bufferConfig.txBufferSize}`);
    parts.push(`-c ${sampleRateConfig.blockSize}`);
    if (mode !== 'tx') {
      parts.push(`-e ${frequencyConfig.rxCenter}`);
      parts.push(`-w ${frequencyConfig.rxBandwidth}`);
    }
    if (mode === 'tx' || mode === 'trx') {
      parts.push(`-E ${frequencyConfig.txCenter}`);
      parts.push(`-W ${frequencyConfig.txBandwidth}`);
    }
    if (mode !== 'tx') {
      parts.push(`-y ${gainConfig.rxLna}`);
      parts.push(`-u ${gainConfig.rxPga}`);
      parts.push(`-U ${gainConfig.rxVga}`);
    }
    if (mode === 'tx' || mode === 'trx') {
      parts.push(`-Y ${gainConfig.txGain}`);
    }
    // Clock configuration
    if (clockConfig.source === 'external') {
      parts.push('-a external');
      if (clockConfig.externalFrequency) {
        parts.push(`-x ${clockConfig.externalFrequency}`);
      }
    } else if (clockConfig.source === 'internal') {
      parts.push('-a internal');
    }
    if (rfPath) parts.push(`-R ${rfPath}`);
    // Channel configuration
    if (mode !== 'tx') {
      if (channelConfig.rxMode === 'mask' && channelConfig.rxChannelMask !== undefined) {
        parts.push(`-C ${channelConfig.rxChannelMask}`);
      } else if (channelConfig.rxMode === 'list' && channelConfig.rxChannelList && channelConfig.rxChannelList.length > 0) {
        parts.push(`-C :${channelConfig.rxChannelList.join(',')}`);
      }
    }
    const deviceString = Object.entries(deviceParams)
      .filter(([_, value]) => value)
      .map(([key]) => key)
      .join(',');
    if (deviceString) parts.push(`-D ${deviceString}`);
    return parts.join(' \\\
  ');
  };

  const [deviceParams, setDeviceParams] = useState<DeviceParameters>({
    lnaOn: true,
    paOn: false,
    gpsdoOn: false,
    oscOn: false,
  });

  // Build device parameter string
  const buildDeviceString = (): string => {
    const parts: string[] = ['fe=pciefev1'];
    
    if (rfPath) {
      parts.push(`path_${rfPath}`);
    }
    
    if (deviceParams.lnaOn) {
      parts.push('lna_on');
    } else {
      parts.push('lna_off');
    }
    
    if (deviceParams.paOn) {
      parts.push('pa_on');
    } else {
      parts.push('pa_off');
    }
    
    if (deviceParams.gpsdoOn) {
      parts.push('gpsdo_on');
    }
    
    if (clockConfig.source === 'devboard' || deviceParams.oscOn) {
      parts.push('osc_on');
    }
    
    if (clockConfig.source === 'devboard' && clockConfig.dacTuning !== undefined) {
      parts.push(`dac_${clockConfig.dacTuning}`);
    }
    
    return parts.join(':');
  };

  const deviceString = buildDeviceString();

  // tRPC mutations
  const createConfig = trpc.deviceConfig.create.useMutation({
    onSuccess: () => {
      toast.success('Configuration saved successfully');
    },
    onError: (error) => {
      toast.error(`Failed to save configuration: ${error.message}`);
    },
  });

  // Opens the save config dialog (replaces browser prompt)
  const handleSaveConfig = () => {
    setSaveConfigDialogOpen(true);
  };

  // Actually saves the config when dialog confirms
  const handleConfirmSaveConfig = (configName: string) => {
    createConfig.mutate({
      name: configName,
      description: `RF Path: ${rfPath}, Mode: ${mode.toUpperCase()}`,
      rfPath,
      rxCenterFreq: frequencyConfig.rxCenter,
      txCenterFreq: frequencyConfig.txCenter,
      rxBandwidth: frequencyConfig.rxBandwidth,
      txBandwidth: frequencyConfig.txBandwidth,
      rxLnaGain: gainConfig.rxLna,
      rxPgaGain: gainConfig.rxPga,
      rxVgaGain: gainConfig.rxVga,
      txGain: gainConfig.txGain,
      clockSource: clockConfig.source,
      externalClockFreq: clockConfig.externalFrequency,
      dacTuning: clockConfig.dacTuning,
      sampleRate: sampleRateConfig.sampleRate,
      dataFormat: sampleRateConfig.dataFormat,
      blockSize: sampleRateConfig.blockSize,
      connectionType: sampleRateConfig.connectionType,
      lnaOn: deviceParams.lnaOn,
      paOn: deviceParams.paOn,
      gpsdoOn: deviceParams.gpsdoOn,
      oscOn: deviceParams.oscOn,
      mode,
    });
    setSaveConfigDialogOpen(false);
  };

  // Export configuration to JSON file
  const handleExportConfig = () => {
    const config = exportConfiguration(
      mode,
      rfPath,
      frequencyConfig,
      gainConfig,
      clockConfig,
      sampleRateConfig,
      bufferConfig,
      channelConfig,
      syncConfig,
      deviceParams
    );
    downloadConfigurationFile(config);
    toast.success(t('export.success') || 'Configuration exported successfully');
  };

  // Import configuration from JSON file
  const handleImportConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const result: ImportValidationResult = await importConfigurationFromFile(file);

      if (!result.valid) {
        const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`).join('\n');
        toast.error(t('import.error') || 'Import failed', {
          description: errorMessages,
        });
        return;
      }

      if (result.warnings.length > 0) {
        const warningMessages = result.warnings.map(w => `${w.field}: ${w.message}`).join('\n');
        toast.warning(t('import.warning') || 'Import warnings', {
          description: warningMessages,
        });
      }

      if (result.config) {
        // Apply imported configuration
        setMode(result.config.mode);
        setRfPath(result.config.rfPath);
        setFrequencyConfig(result.config.frequency);
        setGainConfig(result.config.gain);
        setClockConfig(result.config.clock);
        setSampleRateConfig(result.config.sampleRate);
        setBufferConfig(result.config.buffer);
        setChannelConfig(result.config.channels);
        if (result.config.sync) {
          setSyncConfig(result.config.sync);
        }
        setDeviceParams(result.config.deviceParams);

        toast.success(t('import.success') || 'Configuration imported successfully');
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--dd-bg-dark)' }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: 'var(--dd-bg-medium)', borderColor: 'var(--dd-border-default)' }}>
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/wavelet-logo.png" alt="Wavelet" className="h-16 rounded-lg" style={{ imageRendering: 'auto' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
                  {t('header.title')}
                </h1>
                <p className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>
                  {t('header.subtitle')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* API Selection Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: 'var(--dd-text-tertiary)' }}>API:</span>
                <Select value={apiType} onValueChange={(value) => setApiType(value as 'libusdr' | 'soapysdr')}>
                  <SelectTrigger
                    className="w-[140px] h-8 text-sm border-0"
                    style={{
                      backgroundColor: 'var(--dd-bg-medium)',
                      color: 'var(--dd-text-primary)',
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      backgroundColor: 'var(--dd-bg-medium)',
                      borderColor: 'var(--dd-border-subtle)',
                    }}
                  >
                    <SelectItem
                      value="libusdr"
                      style={{
                        color: 'var(--dd-text-primary)',
                      }}
                    >
                      libusdr
                    </SelectItem>
                    <SelectItem
                      value="soapysdr"
                      style={{
                        color: 'var(--dd-text-primary)',
                      }}
                    >
                      SoapySDR
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              


              <Button
                onClick={() => window.location.href = '/presets'}
                variant="outline"
                className="gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                {t('header.presets')}
              </Button>
              
              <Button
                onClick={handleImportConfig}
                variant="outline"
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {t('header.import') || 'Import'}
              </Button>
              
              <Button
                onClick={handleExportConfig}
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {t('header.export') || 'Export'}
              </Button>
              
              <Button
                onClick={handleSaveConfig}
                className="gap-2"
                style={{
                  backgroundColor: 'var(--dd-accent-green)',
                  color: 'var(--dd-bg-dark)',
                }}
              >
                <Save className="w-4 h-4" />
                {t('header.saveConfig')}
              </Button>
              
              <Button
                onClick={() => setSaveTemplateDialogOpen(true)}
                className="gap-2"
                style={{
                  backgroundColor: 'var(--dd-accent-blue)',
                  color: 'white',
                }}
              >
                <Save className="w-4 h-4" />
                Save as Template
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration Panels */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mode Selection */}
            <Card className="sdr-panel">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
                  {t('mode.title')}
                </h2>
                <div className="flex gap-3">
                  {(['rx', 'tx', 'trx'] as const).map((m) => (
                    <Button
                      key={m}
                      variant={mode === m ? 'default' : 'outline'}
                      onClick={() => setMode(m)}
                      className="flex-1"
                      style={mode === m ? {
                        backgroundColor: 'var(--dd-accent-green)',
                        color: 'var(--dd-bg-dark)',
                      } : {}}
                    >
                      {t(`mode.${m}`)}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Command Templates Library */}
            <CommandTemplateLibrary onApplyTemplate={handleApplyCommandTemplate} />

            {/* Quick-Start Templates */}
            <QuickStartTemplates onApplyTemplate={handleApplyTemplate} />

            {/* Configuration Tabs */}
            <Tabs defaultValue="rf-path" className="w-full">
              <TabsList className="grid w-full grid-cols-7" style={{ backgroundColor: 'var(--dd-bg-medium)' }}>
                <TabsTrigger value="rf-path">RF Path</TabsTrigger>
                <TabsTrigger value="frequency">Frequency</TabsTrigger>
                <TabsTrigger value="gain">Gain</TabsTrigger>
                <TabsTrigger value="clock">Clock</TabsTrigger>
                <TabsTrigger value="sample">Sample</TabsTrigger>
                <TabsTrigger value="buffer">Buffer</TabsTrigger>
                <TabsTrigger value="channels">Channels</TabsTrigger>
              </TabsList>

              <TabsContent value="rf-path" className="mt-6">
                <RFPathSelector
                  selectedPath={rfPath}
                  onPathSelect={setRfPath}
                />
              </TabsContent>

              <TabsContent value="frequency" className="mt-6">
                <FrequencyControl
                  config={frequencyConfig}
                  onChange={setFrequencyConfig}
                />
              </TabsContent>

              <TabsContent value="gain" className="mt-6">
                <GainControl
                  config={gainConfig}
                  onChange={setGainConfig}
                />
              </TabsContent>

              <TabsContent value="clock" className="mt-6">
                <ClockConfig
                  config={clockConfig}
                  onChange={setClockConfig}
                />
              </TabsContent>

              <TabsContent value="sample" className="mt-6">
                <SampleRateConfig
                  config={sampleRateConfig}
                  onChange={setSampleRateConfig}
                />
              </TabsContent>

              <TabsContent value="buffer" className="mt-6">
                <BufferSizeConfig
                  config={bufferConfig}
                  sampleRate={sampleRateConfig.sampleRate}
                  dataFormat={sampleRateConfig.dataFormat}
                  onChange={setBufferConfig}
                />
              </TabsContent>

              <TabsContent value="channels" className="mt-6">
                <ChannelConfig
                  config={channelConfig}
                  onChange={setChannelConfig}
                />
              </TabsContent>
            </Tabs>

            {/* Sync Type Configuration */}
            <SyncTypeConfig
              value={syncConfig}
              onChange={setSyncConfig}
            />

            {/* Device Parameters */}
            <DeviceParameterBuilder
              parameters={deviceParams}
              onChange={setDeviceParams}
              rfPath={rfPath}
              clockSource={clockConfig.source}
              dacTuning={clockConfig.dacTuning}
            />
          </div>

          {/* Right Column - Command Preview & Status */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="sdr-panel">
              <h3 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
                {t('summary.title')}
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--dd-text-secondary)' }}>API:</span>
                  <Badge 
                    className="font-mono font-semibold"
                    style={{ 
                      backgroundColor: apiType === 'soapysdr' ? '#ef4444' : 'var(--dd-accent-blue)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    {apiType === 'soapysdr' ? 'SoapySDR' : 'libusdr'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--dd-text-secondary)' }}>{t('summary.rfPath')}:</span>
                  <Badge className="sdr-badge sdr-badge-info">{rfPath}</Badge>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--dd-text-secondary)' }}>{t('summary.mode')}:</span>
                  <Badge className="sdr-badge sdr-badge-success">{t(`mode.${mode}`)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--dd-text-secondary)' }}>{t('summary.sampleRate')}:</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--dd-accent-green)' }}>
                    {(sampleRateConfig.sampleRate / 1_000_000).toFixed(1)} MHz
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--dd-text-secondary)' }}>{t('summary.rxFreq')}:</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--dd-accent-green)' }}>
                    {(frequencyConfig.rxCenter / 1_000_000).toFixed(1)} MHz
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--dd-text-secondary)' }}>{t('summary.totalGain')}:</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--dd-accent-green)' }}>
                    {gainConfig.rxLna + gainConfig.rxPga + gainConfig.rxVga} dB
                  </span>
                </div>
              </div>
            </Card>

            {/* Command Preview - Sticky */}
            <div className="lg:sticky lg:top-6 space-y-6">

            <CommandPreview
              rfPath={rfPath}
              frequency={frequencyConfig}
              gain={gainConfig}
              clock={clockConfig}
              sampleRate={sampleRateConfig}
              bufferSize={bufferConfig}
              channels={channelConfig}
              syncConfig={syncConfig}
              deviceParams={deviceString}
              mode={mode}
              apiType={apiType}
            />

            <ValidationPanel validation={validation} />

            <CommandHistory
              onLoadConfiguration={(config) => {
                if (config.rfPath) setRfPath(config.rfPath);
                if (config.frequency) setFrequencyConfig(config.frequency);
                if (config.gain) setGainConfig(config.gain);
                if (config.clock) setClockConfig(config.clock);
                if (config.sampleRate) setSampleRateConfig(config.sampleRate);
                if (config.bufferSize) setBufferConfig(config.bufferSize);
                if (config.channels) setChannelConfig(config.channels);
                if (config.syncConfig) setSyncConfig(config.syncConfig);
                if (config.deviceParams) {
                  setDeviceParams({
                    lnaOn: config.deviceParams.lnaOn || false,
                    paOn: config.deviceParams.paOn || false,
                    gpsdoOn: config.deviceParams.gpsdoOn || false,
                    oscOn: config.deviceParams.oscOn || false,
                  });
                }
                if (config.mode) setMode(config.mode);
              }}
            />
            </div>
          </div>
        </div>
      </main>
      
      {/* Save Template Dialog */}
      <SaveTemplateDialog
        open={saveTemplateDialogOpen}
        onOpenChange={setSaveTemplateDialogOpen}
        currentConfig={{
          mode,
          rfPath,
          frequency: frequencyConfig,
          gain: gainConfig,
          clock: clockConfig,
          sampleRate: sampleRateConfig,
          bufferSize: bufferConfig,
          channels: channelConfig,
          syncConfig: syncConfig,
          deviceParams: JSON.stringify(deviceParams),
        }}
        command={generateCommand()}
      />

      {/* Save Config Dialog (replaces browser prompt) */}
      <SaveConfigDialog
        open={saveConfigDialogOpen}
        onOpenChange={setSaveConfigDialogOpen}
        onSave={handleConfirmSaveConfig}
        isPending={createConfig.isPending}
      />

    </div>
  );
}
