import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig: {
    mode: 'rx' | 'tx' | 'trx';
    rfPath: string;
    frequency: any;
    gain: any;
    clock: any;
    sampleRate: any;
    bufferSize: any;
    channels: any;
    syncConfig: any;
    deviceParams: string;
  };
  command: string;
}

export default function SaveTemplateDialog({ open, onOpenChange, currentConfig, command }: SaveTemplateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'monitoring' | 'testing' | 'analysis' | 'communication'>('monitoring');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const utils = trpc.useUtils();
  const saveTemplateMutation = trpc.userTemplates.save.useMutation({
    onSuccess: () => {
      toast.success('Template saved successfully');
      utils.userTemplates.list.invalidate();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to save template: ${error.message}`);
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('monitoring');
    setDifficulty('intermediate');
    setTagInput('');
    setTags([]);
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a template description');
      return;
    }

    // Extract key parameters from current config
    const parameters = {
      mode: currentConfig.mode,
      rfPath: currentConfig.rfPath,
      frequency: currentConfig.frequency.rxCenter,
      bandwidth: currentConfig.frequency.rxBandwidth,
      sampleRate: currentConfig.sampleRate.sampleRate,
      gain: {
        rxLna: currentConfig.gain.rxLna,
        rxPga: currentConfig.gain.rxPga,
        rxVga: currentConfig.gain.rxVga,
        txGain: currentConfig.gain.txGain,
      },
    };

    saveTemplateMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      category,
      tags,
      difficulty,
      parameters,
      command,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" style={{ backgroundColor: 'var(--dd-bg-medium)', border: '1px solid var(--dd-border-default)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--dd-text-primary)', fontFamily: 'var(--dd-font-display)' }}>
            Save as Custom Template
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--dd-text-secondary)' }}>
            Save your current configuration as a reusable template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name" style={{ color: 'var(--dd-text-primary)' }}>
              Template Name *
            </Label>
            <Input
              id="template-name"
              placeholder="e.g., Custom WiFi Monitor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                backgroundColor: 'var(--dd-bg-dark)',
                border: '1px solid var(--dd-border-default)',
                color: 'var(--dd-text-primary)',
              }}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="template-description" style={{ color: 'var(--dd-text-primary)' }}>
              Description *
            </Label>
            <Textarea
              id="template-description"
              placeholder="Describe what this template is for and when to use it..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                backgroundColor: 'var(--dd-bg-dark)',
                border: '1px solid var(--dd-border-default)',
                color: 'var(--dd-text-primary)',
              }}
            />
          </div>

          {/* Category and Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-category" style={{ color: 'var(--dd-text-primary)' }}>
                Category *
              </Label>
              <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                <SelectTrigger
                  id="template-category"
                  style={{
                    backgroundColor: 'var(--dd-bg-dark)',
                    border: '1px solid var(--dd-border-default)',
                    color: 'var(--dd-text-primary)',
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="testing">Testing</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-difficulty" style={{ color: 'var(--dd-text-primary)' }}>
                Difficulty
              </Label>
              <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                <SelectTrigger
                  id="template-difficulty"
                  style={{
                    backgroundColor: 'var(--dd-bg-dark)',
                    border: '1px solid var(--dd-border-default)',
                    color: 'var(--dd-text-primary)',
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="template-tags" style={{ color: 'var(--dd-text-primary)' }}>
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                id="template-tags"
                placeholder="Add a tag (e.g., wifi, gps, amateur)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                style={{
                  backgroundColor: 'var(--dd-bg-dark)',
                  border: '1px solid var(--dd-border-default)',
                  color: 'var(--dd-text-primary)',
                }}
              />
              <Button
                type="button"
                onClick={addTag}
                size="sm"
                style={{
                  backgroundColor: 'var(--dd-accent-blue)',
                  color: 'white',
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="gap-1 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--dd-bg-dark)',
                      color: 'var(--dd-text-primary)',
                      border: '1px solid var(--dd-border-default)',
                    }}
                    onClick={() => removeTag(tag)}
                  >
                    #{tag}
                    <X className="w-3 h-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Configuration Preview */}
          <div className="space-y-2">
            <Label style={{ color: 'var(--dd-text-primary)' }}>Configuration Preview</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)' }}>
                <div className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>Mode</div>
                <div className="text-sm font-mono font-bold" style={{ color: 'var(--dd-accent-green)' }}>
                  {currentConfig.mode.toUpperCase()}
                </div>
              </div>
              <div className="p-2 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)' }}>
                <div className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>Frequency</div>
                <div className="text-sm font-mono font-bold" style={{ color: 'var(--dd-accent-green)' }}>
                  {(currentConfig.frequency.rxCenter / 1_000_000).toFixed(1)} MHz
                </div>
              </div>
              <div className="p-2 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)' }}>
                <div className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>Sample Rate</div>
                <div className="text-sm font-mono font-bold" style={{ color: 'var(--dd-accent-green)' }}>
                  {(currentConfig.sampleRate.sampleRate / 1_000_000).toFixed(1)} MHz
                </div>
              </div>
              <div className="p-2 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)' }}>
                <div className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>RF Path</div>
                <div className="text-sm font-mono font-bold" style={{ color: 'var(--dd-accent-green)' }}>
                  {currentConfig.rfPath}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            style={{
              backgroundColor: 'var(--dd-bg-dark)',
              color: 'var(--dd-text-primary)',
              border: '1px solid var(--dd-border-default)',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveTemplateMutation.isPending}
            style={{
              backgroundColor: 'var(--dd-accent-green)',
              color: 'var(--dd-bg-dark)',
            }}
          >
            {saveTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
