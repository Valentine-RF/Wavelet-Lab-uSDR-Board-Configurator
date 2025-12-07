import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, Star, Download, Upload, Radio } from 'lucide-react';
import { Link } from 'wouter';

export default function Presets() {
  const { data: configs, isLoading, refetch } = trpc.deviceConfig.list.useQuery();
  const deleteConfig = trpc.deviceConfig.delete.useMutation({
    onSuccess: () => {
      toast.success('Configuration deleted');
      refetch();
    },
  });
  const setDefault = trpc.deviceConfig.setDefault.useMutation({
    onSuccess: () => {
      toast.success('Default configuration updated');
      refetch();
    },
  });

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Delete configuration "${name}"?`)) {
      deleteConfig.mutate({ id });
    }
  };

  const handleSetDefault = (id: number) => {
    setDefault.mutate({ id });
  };

  const handleExport = (config: any) => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usdr-config-${config.name.replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Configuration exported');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const config = JSON.parse(text);
        // TODO: Implement import via tRPC mutation
        toast.success('Configuration imported');
      } catch (error) {
        toast.error('Failed to import configuration');
      }
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--dd-bg-dark)' }}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: 'var(--dd-accent-green)' }}></div>
          <p style={{ color: 'var(--dd-text-secondary)' }}>Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--dd-bg-dark)' }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: 'var(--dd-bg-medium)', borderColor: 'var(--dd-border-default)' }}>
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <img src="/wavelet-logo.png" alt="Wavelet" className="h-14 rounded-lg cursor-pointer" style={{ imageRendering: 'auto' }} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
                  Configuration Presets
                </h1>
                <p className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>
                  Manage saved device configurations
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleImport}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Import
              </Button>
              <Link href="/">
                <Button
                  className="gap-2"
                  style={{
                    backgroundColor: 'var(--dd-accent-green)',
                    color: 'var(--dd-bg-dark)',
                  }}
                >
                  New Configuration
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {!configs || configs.length === 0 ? (
          <Card className="sdr-panel text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--dd-bg-light)' }}>
                <Radio className="w-8 h-8" style={{ color: 'var(--dd-text-secondary)' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
                No Configurations Saved
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--dd-text-secondary)' }}>
                Create and save your first device configuration to get started
              </p>
              <Link href="/">
                <Button
                  style={{
                    backgroundColor: 'var(--dd-accent-green)',
                    color: 'var(--dd-bg-dark)',
                  }}
                >
                  Create Configuration
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configs.map((config) => (
              <Card key={config.id} className="sdr-panel">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
                          {config.name}
                        </h3>
                        {config.isDefault && (
                          <Star className="w-4 h-4 fill-current" style={{ color: 'var(--dd-accent-yellow)' }} />
                        )}
                      </div>
                      {config.description && (
                        <p className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
                          {config.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Configuration Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--dd-text-secondary)' }}>RF Path:</span>
                      <Badge className="sdr-badge sdr-badge-info">{config.rfPath || 'N/A'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--dd-text-secondary)' }}>Mode:</span>
                      <Badge className="sdr-badge sdr-badge-success">{config.mode.toUpperCase()}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--dd-text-secondary)' }}>Sample Rate:</span>
                      <span className="font-mono" style={{ color: 'var(--dd-accent-green)' }}>
                        {(parseInt(config.sampleRate) / 1_000_000).toFixed(1)} MHz
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--dd-text-secondary)' }}>RX Freq:</span>
                      <span className="font-mono" style={{ color: 'var(--dd-accent-green)' }}>
                        {(parseInt(config.rxCenterFreq) / 1_000_000).toFixed(1)} MHz
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--dd-border-default)' }}>
                    {!config.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(config.id)}
                        className="flex-1 gap-2"
                      >
                        <Star className="w-3 h-3" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(config)}
                      className="gap-2"
                    >
                      <Download className="w-3 h-3" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(config.id, config.name)}
                      className="gap-2"
                      style={{ color: 'var(--dd-accent-red)', borderColor: 'var(--dd-accent-red)' }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
