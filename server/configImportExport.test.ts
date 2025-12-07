import { describe, it, expect } from 'vitest';
import {
  exportConfiguration,
  validateImportedConfiguration,
  CONFIG_VERSION,
  type ExportedConfiguration,
} from '../client/src/lib/configImportExport';

describe('Configuration Import/Export', () => {
  const validConfig = {
    mode: 'rx' as const,
    rfPath: 'rxw',
    frequency: {
      rxCenter: 2450000000,
      txCenter: 2450000000,
      rxBandwidth: 20000000,
      txBandwidth: 20000000,
    },
    gain: {
      rxLna: 20,
      rxPga: 10,
      rxVga: 15,
      txGain: 30,
    },
    clock: {
      source: 'internal' as const,
      externalFrequency: 26000000,
      dacTuning: 0,
    },
    sampleRate: {
      sampleRate: 40000000,
      dataFormat: 'ci16' as const,
      connectionType: 'pcie' as const,
      blockSize: 4096,
    },
    buffer: {
      rxBufferSize: 4096,
      txBufferSize: 4096,
    },
    channels: {
      rxMode: 'auto' as const,
      txMode: 'auto' as const,
    },
    sync: {
      syncType: 'none' as const,
    },
    deviceParams: {
      lnaOn: true,
      paOn: false,
      gpsdoOn: false,
      oscOn: false,
      dacValue: 0,
    },
  };

  describe('exportConfiguration', () => {
    it('should export configuration with correct version', () => {
      const exported = exportConfiguration(
        validConfig.mode,
        validConfig.rfPath,
        validConfig.frequency,
        validConfig.gain,
        validConfig.clock,
        validConfig.sampleRate,
        validConfig.buffer,
        validConfig.channels,
        validConfig.sync,
        validConfig.deviceParams
      );

      expect(exported.version).toBe(CONFIG_VERSION);
      expect(exported.appName).toBe('uSDR Development Board Dashboard');
      expect(exported.exportDate).toBeDefined();
      expect(exported.configuration).toEqual(validConfig);
    });

    it('should include ISO date string', () => {
      const exported = exportConfiguration(
        validConfig.mode,
        validConfig.rfPath,
        validConfig.frequency,
        validConfig.gain,
        validConfig.clock,
        validConfig.sampleRate,
        validConfig.buffer,
        validConfig.channels,
        validConfig.sync,
        validConfig.deviceParams
      );

      expect(() => new Date(exported.exportDate)).not.toThrow();
      expect(new Date(exported.exportDate).toISOString()).toBe(exported.exportDate);
    });
  });

  describe('validateImportedConfiguration', () => {
    it('should validate correct configuration', () => {
      const exported: ExportedConfiguration = {
        version: CONFIG_VERSION,
        exportDate: new Date().toISOString(),
        appName: 'uSDR Development Board Dashboard',
        configuration: validConfig,
      };

      const result = validateImportedConfiguration(exported);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.config).toEqual(validConfig);
    });

    it('should reject invalid data types', () => {
      const result = validateImportedConfiguration(null);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('root');
    });

    it('should reject missing version', () => {
      const invalidData = {
        exportDate: new Date().toISOString(),
        appName: 'uSDR Development Board Dashboard',
        configuration: validConfig,
      };

      const result = validateImportedConfiguration(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'version')).toBe(true);
    });

    it('should warn on version mismatch', () => {
      const oldVersion = {
        version: '0.9.0',
        exportDate: new Date().toISOString(),
        appName: 'uSDR Development Board Dashboard',
        configuration: validConfig,
      };

      const result = validateImportedConfiguration(oldVersion);

      expect(result.warnings.some(w => w.field === 'version')).toBe(true);
    });

    it('should reject missing configuration object', () => {
      const invalidData = {
        version: CONFIG_VERSION,
        exportDate: new Date().toISOString(),
        appName: 'uSDR Development Board Dashboard',
      };

      const result = validateImportedConfiguration(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'configuration')).toBe(true);
    });

    it('should validate mode field', () => {
      const invalidMode = {
        version: CONFIG_VERSION,
        exportDate: new Date().toISOString(),
        appName: 'uSDR Development Board Dashboard',
        configuration: {
          ...validConfig,
          mode: 'invalid',
        },
      };

      const result = validateImportedConfiguration(invalidMode);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'mode')).toBe(true);
    });

    it('should validate frequency ranges', () => {
      const invalidFreq = {
        version: CONFIG_VERSION,
        exportDate: new Date().toISOString(),
        appName: 'uSDR Development Board Dashboard',
        configuration: {
          ...validConfig,
          frequency: {
            rxCenter: -1000,
            txCenter: 2450000000,
            rxBandwidth: 20000000,
            txBandwidth: 20000000,
          },
        },
      };

      const result = validateImportedConfiguration(invalidFreq);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'frequency.rxCenter')).toBe(true);
    });

    it('should validate gain ranges', () => {
      const invalidGain = {
        version: CONFIG_VERSION,
        exportDate: new Date().toISOString(),
        appName: 'uSDR Development Board Dashboard',
        configuration: {
          ...validConfig,
          gain: {
            rxLna: 50, // exceeds max of 40
            rxPga: 10,
            rxVga: 15,
            txGain: 30,
          },
        },
      };

      const result = validateImportedConfiguration(invalidGain);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'gain.rxLna')).toBe(true);
    });

    it('should validate clock source', () => {
      const invalidClock = {
        version: CONFIG_VERSION,
        exportDate: new Date().toISOString(),
        appName: 'uSDR Development Board Dashboard',
        configuration: {
          ...validConfig,
          clock: {
            source: 'invalid',
          },
        },
      };

      const result = validateImportedConfiguration(invalidClock);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'clock.source')).toBe(true);
    });

    it('should validate sample rate configuration', () => {
      const invalidSampleRate = {
        version: CONFIG_VERSION,
        exportDate: new Date().toISOString(),
        appName: 'uSDR Development Board Dashboard',
        configuration: {
          ...validConfig,
          sampleRate: {
            sampleRate: -1000,
            dataFormat: 'ci16',
            connectionType: 'pcie',
            blockSize: 4096,
          },
        },
      };

      const result = validateImportedConfiguration(invalidSampleRate);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'sampleRate.sampleRate')).toBe(true);
    });

    it('should validate buffer sizes', () => {
      const invalidBuffer = {
        version: CONFIG_VERSION,
        exportDate: new Date().toISOString(),
        appName: 'uSDR Development Board Dashboard',
        configuration: {
          ...validConfig,
          buffer: {
            rxBufferSize: 0,
            txBufferSize: 4096,
          },
        },
      };

      const result = validateImportedConfiguration(invalidBuffer);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'buffer.rxBufferSize')).toBe(true);
    });

    it('should handle missing sync configuration gracefully', () => {
      const noSync = {
        version: CONFIG_VERSION,
        exportDate: new Date().toISOString(),
        appName: 'uSDR Development Board Dashboard',
        configuration: {
          ...validConfig,
          sync: undefined,
        },
      };

      const result = validateImportedConfiguration(noSync);

      // Should still be valid as sync is optional for backward compatibility
      expect(result.valid).toBe(true);
    });

    it('should validate all required fields are present', () => {
      const missingFields = {
        version: CONFIG_VERSION,
        exportDate: new Date().toISOString(),
        appName: 'uSDR Development Board Dashboard',
        configuration: {
          mode: 'rx',
          rfPath: 'rxw',
          // Missing other required fields
        },
      };

      const result = validateImportedConfiguration(missingFields);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
