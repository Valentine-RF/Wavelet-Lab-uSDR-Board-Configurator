import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage, type Language } from '@/contexts/LanguageContext';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4" style={{ color: 'var(--dd-text-tertiary)' }} />
      <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
        <SelectTrigger
          className="w-[120px] h-8 text-sm border-0"
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
            value="en"
            style={{
              color: 'var(--dd-text-primary)',
            }}
          >
            English
          </SelectItem>
          <SelectItem
            value="ru"
            style={{
              color: 'var(--dd-text-primary)',
            }}
          >
            Русский
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
