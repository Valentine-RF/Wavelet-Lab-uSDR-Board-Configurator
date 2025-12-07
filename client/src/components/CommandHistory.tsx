import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { History, Terminal, Copy, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { highlightCommand } from '@/lib/syntaxHighlighter';

interface CommandHistoryProps {
  onLoadConfiguration?: (config: any) => void;
}

export default function CommandHistory({ onLoadConfiguration }: CommandHistoryProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  const { data: history, isLoading, refetch } = trpc.commandHistory.list.useQuery({ limit: 20 });
  const deleteHistoryMutation = trpc.commandHistory.delete.useMutation();
  const executeCommandMutation = trpc.terminal.executeCommand.useMutation();

  const formatTimestamp = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      toast.success('Command copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy command');
    }
  };

  const executeInTerminal = async (command: string) => {
    try {
      const result = await executeCommandMutation.mutateAsync({ command });
      if (result.success) {
        toast.success('Terminal opened successfully');
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error('Failed to open terminal');
    }
  };

  const deleteEntry = async (id: number) => {
    try {
      await deleteHistoryMutation.mutateAsync({ id });
      toast.success('Command deleted from history');
      refetch();
    } catch (err) {
      toast.error('Failed to delete command');
    }
  };

  const loadConfiguration = (entry: any) => {
    if (entry.configuration && onLoadConfiguration) {
      onLoadConfiguration(entry.configuration);
      toast.success('Configuration loaded');
    } else {
      toast.info('No configuration data available');
    }
  };

  if (isLoading) {
    return (
      <Card className="sdr-panel p-6">
        <div className="flex items-center justify-center">
          <div className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>
            Loading history...
          </div>
        </div>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className="sdr-panel p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <History className="w-12 h-12 mb-3" style={{ color: 'var(--dd-text-secondary)', opacity: 0.5 }} />
          <div className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>
            No command history yet
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--dd-text-secondary)', opacity: 0.7 }}>
            Commands you execute will appear here
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-lg font-semibold" style={{ fontFamily: 'var(--dd-font-display)' }}>
            Command History
          </Label>
          <p className="text-sm mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
            Recent commands executed via the dashboard
          </p>
        </div>
        <div className="flex items-center gap-2" style={{ color: 'var(--dd-text-secondary)' }}>
          <History className="w-4 h-4" />
          <span className="text-sm">{history.length} commands</span>
        </div>
      </div>

      <Card className="sdr-panel">
        <div className="divide-y" style={{ borderColor: 'var(--dd-border-default)' }}>
          {history.map((entry) => (
            <div
              key={entry.id}
              className={`p-4 transition-colors cursor-pointer ${
                selectedId === entry.id ? 'bg-opacity-10' : ''
              }`}
              style={{
                backgroundColor: selectedId === entry.id ? 'var(--dd-accent-blue)' : 'transparent',
              }}
              onClick={() => setSelectedId(selectedId === entry.id ? null : entry.id)}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Command Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {/* Execution Method Badge */}
                    <span
                      className="px-2 py-0.5 rounded text-xs font-mono uppercase"
                      style={{
                        backgroundColor:
                          entry.executionMethod === 'terminal'
                            ? 'rgba(30, 144, 255, 0.2)'
                            : entry.executionMethod === 'stream'
                            ? 'rgba(0, 255, 127, 0.2)'
                            : 'rgba(255, 215, 0, 0.2)',
                        color:
                          entry.executionMethod === 'terminal'
                            ? 'var(--dd-accent-blue)'
                            : entry.executionMethod === 'stream'
                            ? 'var(--dd-accent-green)'
                            : '#FFD700',
                      }}
                    >
                      {entry.executionMethod}
                    </span>

                    {/* Mode Badge */}
                    <span
                      className="px-2 py-0.5 rounded text-xs font-mono uppercase"
                      style={{
                        backgroundColor: 'rgba(30, 144, 255, 0.1)',
                        color: 'var(--dd-accent-blue)',
                      }}
                    >
                      {entry.mode}
                    </span>
                    
                    {/* API Badge */}
                    <span
                      className="px-2 py-0.5 rounded text-xs font-mono uppercase"
                      style={{
                        backgroundColor: entry.apiType === 'soapysdr' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 144, 255, 0.2)',
                        color: entry.apiType === 'soapysdr' ? '#ef4444' : 'var(--dd-accent-blue)',
                        border: `1px solid ${entry.apiType === 'soapysdr' ? '#ef4444' : 'var(--dd-accent-blue)'}`,
                      }}
                    >
                      {entry.apiType || 'libusdr'}
                    </span>

                    {/* Success/Error Indicator */}
                    {entry.success ? (
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--dd-accent-green)' }} />
                    ) : (
                      <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                    )}

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 ml-auto" style={{ color: 'var(--dd-text-secondary)' }}>
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{formatTimestamp(entry.executedAt)}</span>
                    </div>
                  </div>

                  {/* Command Preview */}
                  <pre
                    className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all"
                    style={{ color: 'var(--dd-text-primary)' }}
                  >
                    {entry.command.length > 200 && selectedId !== entry.id
                      ? highlightCommand(entry.command.substring(0, 200) + '...', entry.apiType || 'libusdr')
                      : highlightCommand(entry.command, entry.apiType || 'libusdr')}
                  </pre>

                  {/* Metadata */}
                  {selectedId === entry.id && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {entry.rfPath && (
                        <div>
                          <span style={{ color: 'var(--dd-text-secondary)' }}>RF Path: </span>
                          <span className="font-mono" style={{ color: 'var(--dd-accent-blue)' }}>
                            {entry.rfPath}
                          </span>
                        </div>
                      )}
                      {entry.centerFrequency && (
                        <div>
                          <span style={{ color: 'var(--dd-text-secondary)' }}>Frequency: </span>
                          <span className="font-mono" style={{ color: 'var(--dd-accent-blue)' }}>
                            {(parseInt(entry.centerFrequency) / 1_000_000).toFixed(1)} MHz
                          </span>
                        </div>
                      )}
                      {entry.sampleRate && (
                        <div>
                          <span style={{ color: 'var(--dd-text-secondary)' }}>Sample Rate: </span>
                          <span className="font-mono" style={{ color: 'var(--dd-accent-blue)' }}>
                            {(parseInt(entry.sampleRate) / 1_000_000).toFixed(1)} MHz
                          </span>
                        </div>
                      )}
                      {entry.errorMessage && (
                        <div className="col-span-2 md:col-span-4">
                          <span style={{ color: '#ef4444' }}>Error: </span>
                          <span className="font-mono text-xs" style={{ color: '#ef4444' }}>
                            {entry.errorMessage}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Action Buttons */}
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(entry.command);
                    }}
                    className="gap-1 h-7 px-2"
                    style={{
                      backgroundColor: 'var(--dd-bg-dark)',
                      color: 'var(--dd-text-primary)',
                      border: '1px solid var(--dd-border-default)',
                    }}
                  >
                    <Copy className="w-3 h-3" />
                    <span className="text-xs">Copy</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      executeInTerminal(entry.command);
                    }}
                    disabled={executeCommandMutation.isPending}
                    className="gap-1 h-7 px-2"
                    style={{
                      backgroundColor: 'var(--dd-accent-blue)',
                      color: 'white',
                    }}
                  >
                    <Terminal className="w-3 h-3" />
                    <span className="text-xs">Run</span>
                  </Button>

                  {entry.configuration ? (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadConfiguration(entry);
                      }}
                      className="gap-1 h-7 px-2"
                      style={{
                        backgroundColor: 'var(--dd-accent-green)',
                        color: 'var(--dd-bg-dark)',
                      }}
                    >
                      <span className="text-xs">Load</span>
                    </Button>
                  ) : null}

                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEntry(entry.id);
                    }}
                    disabled={deleteHistoryMutation.isPending}
                    className="gap-1 h-7 px-2"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
