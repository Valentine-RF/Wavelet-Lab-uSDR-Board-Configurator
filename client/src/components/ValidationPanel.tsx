import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import type { ValidationResult, ValidationIssue } from '@/lib/configValidator';
import { useLanguage } from '@/contexts/LanguageContext';

interface ValidationPanelProps {
  validation: ValidationResult;
}

export default function ValidationPanel({ validation }: ValidationPanelProps) {
  const { t } = useLanguage();
  const getSeverityIcon = (severity: ValidationIssue['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-4 h-4" style={{ color: 'var(--dd-status-error)' }} />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" style={{ color: 'var(--dd-status-warning)' }} />;
      case 'info':
        return <Info className="w-4 h-4" style={{ color: 'var(--dd-accent-blue)' }} />;
    }
  };

  const getSeverityBadgeClass = (severity: ValidationIssue['severity']) => {
    switch (severity) {
      case 'error':
        return 'sdr-badge sdr-badge-error';
      case 'warning':
        return 'sdr-badge sdr-badge-warning';
      case 'info':
        return 'sdr-badge sdr-badge-info';
    }
  };

  const getSeverityBorderColor = (severity: ValidationIssue['severity']) => {
    switch (severity) {
      case 'error':
        return 'var(--dd-status-error)';
      case 'warning':
        return 'var(--dd-status-warning)';
      case 'info':
        return 'var(--dd-accent-blue)';
    }
  };

  if (validation.issues.length === 0) {
    return (
      <Card className="sdr-card p-6 border-2" style={{ borderColor: 'var(--dd-status-success)', backgroundColor: 'rgba(34, 197, 94, 0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
            <CheckCircle className="w-6 h-6" style={{ color: 'var(--dd-status-success)' }} />
          </div>
          <div>
            <p className="font-semibold text-lg" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-status-success)' }}>
              {t('validation.valid')}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
              {t('validation.noIssues')}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="sdr-card p-6 space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-lg" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
            {t('validation.title')}
          </p>
          <div className="flex items-center gap-2">
            {validation.errorCount > 0 && (
              <Badge className="sdr-badge sdr-badge-error">
                {validation.errorCount} Error{validation.errorCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {validation.warningCount > 0 && (
              <Badge className="sdr-badge sdr-badge-warning">
                {validation.warningCount} Warning{validation.warningCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {validation.infoCount > 0 && (
              <Badge className="sdr-badge sdr-badge-info">
                {validation.infoCount} Info
              </Badge>
            )}
          </div>
        </div>
        
        {!validation.valid && (
          <p className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>
            {t('validation.resolveErrors')}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {validation.issues.map((issue, index) => (
          <div
            key={issue.id}
            className="p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md"
            style={{
              backgroundColor: 'var(--dd-bg-secondary)',
              borderLeftColor: getSeverityBorderColor(issue.severity),
              animationDelay: `${index * 50}ms`,
              animation: 'fadeIn 0.3s ease-out forwards',
              opacity: 0,
            }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getSeverityIcon(issue.severity)}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getSeverityBadgeClass(issue.severity)}>
                        {issue.category}
                      </Badge>
                      <span className="text-xs font-mono" style={{ color: 'var(--dd-text-tertiary)' }}>
                        {issue.id}
                      </span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--dd-text-primary)' }}>
                      {issue.message}
                    </p>
                  </div>
                </div>

                {issue.suggestion && (
                  <div className="flex items-start gap-2 mt-2 p-3 rounded border" style={{ backgroundColor: 'var(--dd-bg-primary)', borderColor: 'var(--dd-accent-blue)', borderWidth: '1px' }}>
                    <div className="p-1 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                      <Info className="w-3 h-3 shrink-0" style={{ color: 'var(--dd-accent-blue)' }} />
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--dd-text-secondary)' }}>
                      <strong style={{ color: 'var(--dd-accent-blue)' }}>{t('validation.suggestion')}:</strong> {issue.suggestion}
                    </p>
                  </div>
                )}

                {issue.affectedFields.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs" style={{ color: 'var(--dd-text-tertiary)' }}>
                      {t('validation.affected')}:
                    </span>
                    {issue.affectedFields.map((field) => (
                      <Badge
                        key={field}
                        variant="outline"
                        className="text-xs font-mono"
                        style={{ borderColor: 'var(--dd-border)' }}
                      >
                        {field}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {validation.errorCount > 0 && (
        <div className="pt-4 border-t" style={{ borderColor: 'var(--dd-border)' }}>
          <div className="flex items-start gap-3 p-4 rounded-lg border-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'var(--dd-status-error)' }}>
            <div className="p-2 rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <AlertCircle className="w-5 h-5 shrink-0" style={{ color: 'var(--dd-status-error)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--dd-status-error)' }}>
                Streaming Blocked
              </p>
              <p className="text-sm" style={{ color: 'var(--dd-text-primary)' }}>
                Configuration contains {validation.errorCount} critical error{validation.errorCount !== 1 ? 's' : ''} that must be resolved before starting.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
