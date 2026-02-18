import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

export interface RFPath {
  id: string;
  name: string;
  category: 'duplexer' | 'tx-only' | 'rx-only' | 'tdd';
  frequencyRange: string;
  description: string;
}

// RF paths mapped to usdr-lib command-line parameter values
// RX paths: rxl (low), rxw (wide), rxh (high), adc, rxl_lb, rxw_lb, rxh_lb
// TX paths: txb1, txb2, txw (wide), txh (high)
const RF_PATHS: RFPath[] = [
  // Duplexer-Backed Cellular Bands
  { id: 'band2', name: 'Band 2 / PCS / GSM1900', category: 'duplexer', frequencyRange: '1900 MHz', description: 'TRX_BAND2 with duplexer' },
  { id: 'band3', name: 'Band 3 / DCS / GSM1800', category: 'duplexer', frequencyRange: '1800 MHz', description: 'TRX_BAND3 with duplexer' },
  { id: 'band5', name: 'Band 5 / GSM850', category: 'duplexer', frequencyRange: '850 MHz', description: 'TRX_BAND5 with duplexer' },
  { id: 'band7', name: 'Band 7 / IMT-E', category: 'duplexer', frequencyRange: '2.6 GHz', description: 'TRX_BAND7 with duplexer' },
  { id: 'band8', name: 'Band 8 / GSM900', category: 'duplexer', frequencyRange: '900 MHz', description: 'TRX_BAND8 with duplexer' },
  
  // TX-only Paths (mapped to usdr-lib TX paths)
  { id: 'txb1', name: 'TX Band 1 (Low)', category: 'tx-only', frequencyRange: '0-1.2 GHz', description: 'TX Band 1 - Low frequency range' },
  { id: 'txb2', name: 'TX Band 2 (Mid)', category: 'tx-only', frequencyRange: '1.2-2.6 GHz', description: 'TX Band 2 - Mid frequency range' },
  { id: 'txw', name: 'TX Wideband', category: 'tx-only', frequencyRange: '0-4.2 GHz', description: 'TX Wideband path (full range)' },
  { id: 'txh', name: 'TX High', category: 'tx-only', frequencyRange: '2.6-4.2 GHz', description: 'TX High frequency path' },
  
  // RX-only Paths (mapped to usdr-lib RX paths)
  { id: 'rxl', name: 'RX Low', category: 'rx-only', frequencyRange: '0-1.2 GHz', description: 'RX Low band path' },
  { id: 'rxw', name: 'RX Wideband', category: 'rx-only', frequencyRange: '0-4.2 GHz', description: 'RX Wideband path (full range)' },
  { id: 'rxh', name: 'RX High', category: 'rx-only', frequencyRange: '2.1-4.2 GHz', description: 'RX High frequency path' },
  { id: 'adc', name: 'Direct ADC', category: 'rx-only', frequencyRange: 'Full Range', description: 'Direct ADC input (bypass RF frontend)' },
  { id: 'rxl_lb', name: 'RX Low (Loopback)', category: 'rx-only', frequencyRange: '0-1.2 GHz', description: 'RX Low band loopback' },
  { id: 'rxw_lb', name: 'RX Wide (Loopback)', category: 'rx-only', frequencyRange: '0-4.2 GHz', description: 'RX Wideband loopback' },
  { id: 'rxh_lb', name: 'RX High (Loopback)', category: 'rx-only', frequencyRange: '2.1-4.2 GHz', description: 'RX High frequency loopback' },
  
  // TDD / Half-Duplex Wideband Paths (auto-selected based on frequency)
  { id: 'rx_auto', name: 'RX Auto', category: 'tdd', frequencyRange: 'Auto', description: 'Automatic RX path selection based on frequency' },
  { id: 'tx_auto', name: 'TX Auto', category: 'tdd', frequencyRange: 'Auto', description: 'Automatic TX path selection based on frequency' },
];

const CATEGORY_LABELS = {
  'duplexer': 'Duplexer-Backed Cellular Bands',
  'tx-only': 'TX-Only Paths',
  'rx-only': 'RX-Only Paths',
  'tdd': 'TDD / Half-Duplex Wideband',
};

const CATEGORY_COLORS = {
  'duplexer': 'sdr-badge-info',
  'tx-only': 'sdr-badge-warning',
  'rx-only': 'sdr-badge-success',
  'tdd': 'sdr-badge-critical',
};

interface RFPathSelectorProps {
  selectedPath?: string;
  onPathSelect: (pathId: string) => void;
}

export default function RFPathSelector({ selectedPath, onPathSelect }: RFPathSelectorProps) {
  const { t } = useLanguage();
  const categories = ['duplexer', 'tx-only', 'rx-only', 'tdd'] as const;

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-semibold" style={{ fontFamily: 'var(--dd-font-display)' }}>
          {t('rfPath.title')}
        </Label>
        <p className="text-sm mt-1" style={{ color: 'var(--dd-text-secondary)' }}>
          {t('rfPath.subtitle')}
        </p>
      </div>

      {categories.map((category) => {
        const paths = RF_PATHS.filter((p) => p.category === category);
        
        return (
          <div key={category} className="space-y-3">
            <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
              {CATEGORY_LABELS[category]}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {paths.map((path) => (
                <Card
                  key={path.id}
                  className={`sdr-card ${selectedPath === path.id ? 'active' : ''}`}
                  onClick={() => onPathSelect(path.id)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
                        {path.name}
                      </h4>
                      <Badge className={`sdr-badge ${CATEGORY_COLORS[category]} shrink-0`}>
                        {path.frequencyRange}
                      </Badge>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
                      {path.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
