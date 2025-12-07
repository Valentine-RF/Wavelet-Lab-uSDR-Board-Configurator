import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  BookOpen, 
  Zap, 
  Radio, 
  BarChart3, 
  MessageSquare,
  ChevronRight,
  Check,
  Copy,
  Terminal
} from 'lucide-react';
import { searchCommandTemplates, type CommandTemplate } from '@/lib/commandTemplates';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Trash2, User, Star } from 'lucide-react';

interface CommandTemplateLibraryProps {
  onApplyTemplate: (template: CommandTemplate) => void;
}

const categoryIcons = {
  monitoring: Radio,
  testing: Zap,
  analysis: BarChart3,
  communication: MessageSquare,
};

const categoryColors = {
  monitoring: '#1E90FF',
  testing: '#FFD700',
  analysis: '#00FF7F',
  communication: '#FF69B4',
};

const difficultyColors = {
  beginner: 'var(--dd-accent-green)',
  intermediate: 'var(--dd-accent-blue)',
  advanced: '#FF6B6B',
};

export default function CommandTemplateLibrary({ onApplyTemplate }: CommandTemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Fetch user templates and favorites
  const { data: userTemplates = [] } = trpc.userTemplates.list.useQuery();
  const { data: favorites = [] } = trpc.templateFavorites.list.useQuery();
  const utils = trpc.useUtils();
  
  const deleteTemplateMutation = trpc.userTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success('Template deleted');
      utils.userTemplates.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  const addFavoriteMutation = trpc.templateFavorites.add.useMutation({
    onSuccess: () => {
      utils.templateFavorites.list.invalidate();
    },
  });

  const removeFavoriteMutation = trpc.templateFavorites.remove.useMutation({
    onSuccess: () => {
      utils.templateFavorites.list.invalidate();
    },
  });

  const executeCommandMutation = trpc.terminal.executeCommand.useMutation({
    onSuccess: () => {
      toast.success('Command executed in terminal');
    },
    onError: (error: any) => {
      toast.error(`Failed to execute command: ${error.message}`);
    },
  });

  // Helper to check if template is favorited
  const isFavorited = (template: any) => {
    if (template.isUserTemplate) {
      return favorites.some((f: any) => f.userTemplateId === template.dbId);
    } else {
      return favorites.some((f: any) => f.templateId === template.id);
    }
  };

  // Toggle favorite
  const toggleFavorite = (template: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const favorited = isFavorited(template);
    
    if (favorited) {
      if (template.isUserTemplate) {
        removeFavoriteMutation.mutate({ userTemplateId: template.dbId });
      } else {
        removeFavoriteMutation.mutate({ templateId: template.id });
      }
    } else {
      if (template.isUserTemplate) {
        addFavoriteMutation.mutate({ userTemplateId: template.dbId });
      } else {
        addFavoriteMutation.mutate({ templateId: template.id });
      }
    }
  };

  // Merge built-in and user templates
  const builtInTemplates = searchCommandTemplates(searchQuery, selectedCategory);
  const filteredUserTemplates = userTemplates
    .filter((t: any) => {
      const matchesCategory = !selectedCategory || t.category === selectedCategory;
      const lowerQuery = searchQuery.toLowerCase();
      const matchesQuery =
        !searchQuery ||
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        (Array.isArray(t.tags) && t.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery)));
      return matchesCategory && matchesQuery;
    })
    .map((t: any) => ({
      id: `user-${t.id}`,
      name: t.name,
      description: t.description,
      category: t.category,
      tags: Array.isArray(t.tags) ? t.tags : [],
      command: t.command,
      parameters: t.parameters,
      useCase: t.description,
      difficulty: t.difficulty,
      isUserTemplate: true,
      dbId: t.id,
    }));

  let templates = [...filteredUserTemplates, ...builtInTemplates];
  
  // Filter by favorites if enabled
  if (showFavoritesOnly) {
    templates = templates.filter(t => isFavorited(t));
  }

  const categories = [
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'monitoring', label: 'Monitoring', icon: Radio },
    { id: 'testing', label: 'Testing', icon: Zap },
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
  ];

  const favoritesCount = favorites.length;

  const handleApplyTemplate = (template: CommandTemplate) => {
    onApplyTemplate(template);
    toast.success(`Applied template: ${template.name}`);
  };

  const toggleExpand = (templateId: string) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-lg font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--dd-font-display)' }}>
            <BookOpen className="w-5 h-5" style={{ color: 'var(--dd-accent-blue)' }} />
            Command Templates
          </Label>
          <p className="text-sm mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
            Pre-configured commands for common SDR use cases
          </p>
        </div>
        <Badge className="sdr-badge sdr-badge-info">{templates.length} templates</Badge>
      </div>

      {/* Search and Filter */}
      <Card className="sdr-panel p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--dd-text-secondary)' }} />
            <Input
              type="text"
              placeholder="Search templates by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              style={{
                backgroundColor: 'var(--dd-bg-dark)',
                border: '1px solid var(--dd-border-default)',
                color: 'var(--dd-text-primary)',
              }}
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                setSelectedCategory(undefined);
                setShowFavoritesOnly(false);
              }}
              className="gap-2"
              style={{
                backgroundColor: !selectedCategory && !showFavoritesOnly ? 'var(--dd-accent-blue)' : 'var(--dd-bg-dark)',
                color: !selectedCategory && !showFavoritesOnly ? 'white' : 'var(--dd-text-primary)',
                border: '1px solid var(--dd-border-default)',
              }}
            >
              All Categories
            </Button>
            {categories.map((category) => {
              const Icon = category.icon;
              const isFavoritesCategory = category.id === 'favorites';
              const isSelected = isFavoritesCategory ? showFavoritesOnly : selectedCategory === category.id;
              
              return (
                <Button
                  key={category.id}
                  size="sm"
                  onClick={() => {
                    if (isFavoritesCategory) {
                      setShowFavoritesOnly(!showFavoritesOnly);
                      setSelectedCategory(undefined);
                    } else {
                      setSelectedCategory(category.id);
                      setShowFavoritesOnly(false);
                    }
                  }}
                  className="gap-2"
                  style={{
                    backgroundColor: isSelected ? (isFavoritesCategory ? '#FFD700' : categoryColors[category.id as keyof typeof categoryColors]) : 'var(--dd-bg-dark)',
                    color: isSelected ? 'var(--dd-bg-dark)' : 'var(--dd-text-primary)',
                    border: `1px solid ${isSelected ? categoryColors[category.id as keyof typeof categoryColors] : 'var(--dd-border-default)'}`,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {category.label}
                  {isFavoritesCategory && favoritesCount > 0 && (
                    <Badge className="ml-1 text-xs" style={{ backgroundColor: 'var(--dd-bg-dark)', color: '#FFD700' }}>
                      {favoritesCount}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Card className="sdr-panel p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--dd-text-secondary)', opacity: 0.5 }} />
            <p style={{ color: 'var(--dd-text-secondary)' }}>No templates found</p>
            <p className="text-sm mt-1" style={{ color: 'var(--dd-text-secondary)', opacity: 0.7 }}>
              Try adjusting your search or filters
            </p>
          </Card>
        ) : (
          templates.map((template) => {
            const Icon = categoryIcons[template.category as keyof typeof categoryIcons];
            const isExpanded = expandedTemplate === template.id;
            
            return (
              <Card
                key={template.id}
                className="sdr-panel p-4 cursor-pointer transition-all hover:border-opacity-100"
                style={{
                  borderColor: isExpanded ? categoryColors[template.category as keyof typeof categoryColors] : 'var(--dd-border-default)',
                }}
                onClick={() => toggleExpand(template.id)}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5" style={{ color: categoryColors[template.category as keyof typeof categoryColors] }} />
                        <h3 className="font-semibold" style={{ color: 'var(--dd-text-primary)' }}>
                          {template.name}
                        </h3>
                        {(template as any).isUserTemplate && (
                          <Badge className="text-xs" style={{ backgroundColor: 'var(--dd-accent-blue)', color: 'white' }}>
                            <User className="w-3 h-3 mr-1" />
                            Custom
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>
                        {template.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => toggleFavorite(template, e)}
                          style={{
                            color: isFavorited(template) ? '#FFD700' : 'var(--dd-text-secondary)',
                          }}
                        >
                          <Star
                            className="w-4 h-4"
                            fill={isFavorited(template) ? '#FFD700' : 'none'}
                          />
                        </Button>
                        <Badge
                          className="text-xs"
                          style={{
                            backgroundColor: `${difficultyColors[template.difficulty as keyof typeof difficultyColors]}20`,
                            color: difficultyColors[template.difficulty as keyof typeof difficultyColors],
                            border: `1px solid ${difficultyColors[template.difficulty as keyof typeof difficultyColors]}40`,
                          }}
                        >
                          {template.difficulty}
                        </Badge>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        style={{ color: 'var(--dd-text-secondary)' }}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded text-xs font-mono"
                        style={{
                          backgroundColor: 'var(--dd-bg-dark)',
                          color: 'var(--dd-text-secondary)',
                          border: '1px solid var(--dd-border-default)',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--dd-border-default)' }}>
                      {/* Use Case */}
                      <div>
                        <Label className="text-sm font-semibold mb-1">Use Case</Label>
                        <p className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>
                          {template.useCase}
                        </p>
                      </div>

                      {/* Parameters Preview */}
                      <div>
                        <Label className="text-sm font-semibold mb-2">Parameters</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="p-2 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)' }}>
                            <div className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>Mode</div>
                            <div className="text-sm font-mono font-bold" style={{ color: 'var(--dd-accent-green)' }}>
                              {template.parameters.mode.toUpperCase()}
                            </div>
                          </div>
                          {template.parameters.frequency && (
                            <div className="p-2 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)' }}>
                              <div className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>Frequency</div>
                              <div className="text-sm font-mono font-bold" style={{ color: 'var(--dd-accent-green)' }}>
                                {(template.parameters.frequency / 1_000_000).toFixed(1)} MHz
                              </div>
                            </div>
                          )}
                          {template.parameters.sampleRate && (
                            <div className="p-2 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)' }}>
                              <div className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>Sample Rate</div>
                              <div className="text-sm font-mono font-bold" style={{ color: 'var(--dd-accent-green)' }}>
                                {(template.parameters.sampleRate / 1_000_000).toFixed(1)} MHz
                              </div>
                            </div>
                          )}
                          {template.parameters.bandwidth && (
                            <div className="p-2 rounded" style={{ backgroundColor: 'var(--dd-bg-dark)' }}>
                              <div className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>Bandwidth</div>
                              <div className="text-sm font-mono font-bold" style={{ color: 'var(--dd-accent-green)' }}>
                                {(template.parameters.bandwidth / 1_000_000).toFixed(1)} MHz
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Command Preview */}
                      <div>
                        <Label className="text-sm font-semibold mb-2">Command</Label>
                        <pre
                          className="p-3 rounded text-xs font-mono overflow-x-auto"
                          style={{
                            backgroundColor: 'var(--dd-bg-dark)',
                            border: '1px solid var(--dd-border-active)',
                            color: 'var(--dd-text-primary)',
                          }}
                        >
                          {template.command}
                        </pre>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {/* Quick Actions */}
                        <div className="flex gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(template.command);
                              toast.success('Command copied to clipboard');
                            }}
                            variant="outline"
                            className="flex-1 gap-2"
                            style={{
                              backgroundColor: 'var(--dd-bg-dark)',
                              color: 'var(--dd-text-primary)',
                              border: '1px solid var(--dd-border-default)',
                            }}
                          >
                            <Copy className="w-4 h-4" />
                            Copy
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              const commandWith3s = template.command + ' -d 3 -f sigmf';
                              executeCommandMutation.mutate({ command: commandWith3s });
                            }}
                            variant="outline"
                            className="flex-1 gap-2"
                            style={{
                              backgroundColor: 'var(--dd-bg-dark)',
                              color: 'var(--dd-accent-blue)',
                              border: '1px solid var(--dd-accent-blue)',
                            }}
                          >
                            <Terminal className="w-4 h-4" />
                            Run 3s
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              const commandWith5s = template.command + ' -d 5 -f sigmf';
                              executeCommandMutation.mutate({ command: commandWith5s });
                            }}
                            variant="outline"
                            className="flex-1 gap-2"
                            style={{
                              backgroundColor: 'var(--dd-bg-dark)',
                              color: 'var(--dd-accent-green)',
                              border: '1px solid var(--dd-accent-green)',
                            }}
                          >
                            <Terminal className="w-4 h-4" />
                            Run 5s
                          </Button>
                        </div>
                        {/* Apply Template */}
                        <div className="flex gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyTemplate(template);
                            }}
                            className="flex-1 gap-2"
                            style={{
                              backgroundColor: categoryColors[template.category as keyof typeof categoryColors],
                              color: 'var(--dd-bg-dark)',
                            }}
                          >
                            <Check className="w-4 h-4" />
                            Apply Config
                          </Button>
                          {(template as any).isUserTemplate && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this template?')) {
                                  deleteTemplateMutation.mutate({ id: (template as any).dbId });
                                }
                              }}
                              variant="outline"
                              size="icon"
                              style={{
                                backgroundColor: 'var(--dd-bg-dark)',
                                color: '#FF6B6B',
                                border: '1px solid #FF6B6B',
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
