import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SaveConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  isPending?: boolean;
  defaultName?: string;
}

/**
 * Dialog for saving a device configuration with a name
 * Replaces the browser prompt() for better UX
 */
export default function SaveConfigDialog({
  open,
  onOpenChange,
  onSave,
  isPending = false,
  defaultName = '',
}: SaveConfigDialogProps) {
  const [name, setName] = useState(defaultName);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSave(trimmedName);
    setName('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setName('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        style={{
          backgroundColor: 'var(--dd-bg-medium)',
          border: '1px solid var(--dd-border-default)',
        }}
        aria-describedby="save-config-description"
      >
        <DialogHeader>
          <DialogTitle
            style={{
              color: 'var(--dd-text-primary)',
              fontFamily: 'var(--dd-font-display)',
            }}
          >
            Save Configuration
          </DialogTitle>
          <DialogDescription
            id="save-config-description"
            style={{ color: 'var(--dd-text-secondary)' }}
          >
            Enter a name for this configuration to save it for later use.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            <Label
              htmlFor="config-name"
              style={{ color: 'var(--dd-text-primary)' }}
            >
              Configuration Name
            </Label>
            <Input
              id="config-name"
              placeholder="e.g., My WiFi Setup"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              autoFocus
              aria-required="true"
              style={{
                backgroundColor: 'var(--dd-bg-dark)',
                border: '1px solid var(--dd-border-default)',
                color: 'var(--dd-text-primary)',
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
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
            disabled={!name.trim() || isPending}
            aria-disabled={!name.trim() || isPending}
            style={{
              backgroundColor: 'var(--dd-accent-green)',
              color: 'var(--dd-bg-dark)',
            }}
          >
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
