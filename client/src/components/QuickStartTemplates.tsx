import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wifi, Signal, Satellite, Activity, Radio, MessageSquare, TestTube, Zap } from 'lucide-react';
import { configurationTemplates, type ConfigurationTemplate } from '@/lib/configTemplates';
import { useLanguage } from '@/contexts/LanguageContext';

const iconMap: Record<string, any> = {
  Wifi,
  Signal,
  Satellite,
  Activity,
  Radio,
  MessageSquare,
  TestTube,
};

interface QuickStartTemplatesProps {
  onApplyTemplate: (template: ConfigurationTemplate) => void;
}

export default function QuickStartTemplates({ onApplyTemplate }: QuickStartTemplatesProps) {
  const { t, language } = useLanguage();
  
  const categories = {
    monitoring: configurationTemplates.filter(t => t.category === 'monitoring'),
    analysis: configurationTemplates.filter(t => t.category === 'analysis'),
    communication: configurationTemplates.filter(t => t.category === 'communication'),
    testing: configurationTemplates.filter(t => t.category === 'testing'),
  };

  const renderTemplate = (template: ConfigurationTemplate) => {
    const Icon = iconMap[template.icon] || Zap;
    
    return (
      <Card
        key={template.id}
        className="sdr-card p-4 hover:border-blue-500 transition-all cursor-pointer group"
        onClick={() => onApplyTemplate(template)}
      >
        <div className="flex items-start gap-3">
          <div
            className="p-2 rounded-lg shrink-0"
            style={{ backgroundColor: 'var(--dd-bg-secondary)' }}
          >
            <Icon className="w-5 h-5" style={{ color: 'var(--dd-accent-blue)' }} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4
                className="font-semibold text-sm group-hover:text-blue-400 transition-colors"
                style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}
              >
                {language === 'ru' ? template.nameRu : template.name}
              </h4>
              <Badge
                className="sdr-badge shrink-0"
                style={{
                  backgroundColor: template.mode === 'rx' ? 'rgba(30, 144, 255, 0.2)' : template.mode === 'tx' ? 'rgba(255, 165, 0, 0.2)' : 'rgba(138, 43, 226, 0.2)',
                  color: template.mode === 'rx' ? '#1e90ff' : template.mode === 'tx' ? '#ffa500' : '#8a2be2',
                }}
              >
                {template.mode.toUpperCase()}
              </Badge>
            </div>
            
            <p className="text-xs mb-3" style={{ color: 'var(--dd-text-secondary)' }}>
              {language === 'ru' ? template.descriptionRu : template.description}
            </p>
            
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <div className="flex items-center gap-1">
                <span style={{ color: 'var(--dd-text-tertiary)' }}>Freq:</span>
                <span style={{ color: 'var(--dd-accent-blue)' }}>
                  {(template.frequency.rxCenter / 1_000_000).toFixed(1)} MHz
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ color: 'var(--dd-text-tertiary)' }}>BW:</span>
                <span style={{ color: 'var(--dd-accent-blue)' }}>
                  {template.frequency.rxBandwidth >= 1_000_000
                    ? `${(template.frequency.rxBandwidth / 1_000_000).toFixed(1)} MHz`
                    : `${(template.frequency.rxBandwidth / 1_000).toFixed(0)} kHz`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ color: 'var(--dd-text-tertiary)' }}>SR:</span>
                <span style={{ color: 'var(--dd-accent-blue)' }}>
                  {(template.sampleRate.sampleRate / 1_000_000).toFixed(1)} MHz
                </span>
              </div>
            </div>
            
            <Button
              size="sm"
              className="mt-3 w-full"
              style={{
                backgroundColor: 'var(--dd-accent-blue)',
                color: 'white',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onApplyTemplate(template);
              }}
            >
              <Zap className="w-3 h-3 mr-1" />
              {t('templates.apply')}
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <Card className="sdr-card p-6">
      <div className="mb-4">
        <h3
          className="text-lg font-semibold mb-1"
          style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}
        >
          {t('templates.title')}
        </h3>
        <p className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>
          {t('templates.subtitle')}
        </p>
      </div>

      <Tabs defaultValue="monitoring" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="monitoring">
            {t('templates.monitoring')} ({categories.monitoring.length})
          </TabsTrigger>
          <TabsTrigger value="analysis">
            {t('templates.analysis')} ({categories.analysis.length})
          </TabsTrigger>
          <TabsTrigger value="communication">
            {t('templates.comm')} ({categories.communication.length})
          </TabsTrigger>
          <TabsTrigger value="testing">
            {t('templates.testing')} ({categories.testing.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-3">
          {categories.monitoring.map(renderTemplate)}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-3">
          {categories.analysis.map(renderTemplate)}
        </TabsContent>

        <TabsContent value="communication" className="space-y-3">
          {categories.communication.map(renderTemplate)}
        </TabsContent>

        <TabsContent value="testing" className="space-y-3">
          {categories.testing.map(renderTemplate)}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
