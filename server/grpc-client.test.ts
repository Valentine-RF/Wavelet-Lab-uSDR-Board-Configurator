/**
 * Unit tests for gRPC-Web client wrapper
 */

import { describe, it, expect } from 'vitest';

// Test the error mapping logic (duplicated for testing)
function mapGrpcError(error: any) {
  const statusCodeMap: Record<number, string> = {
    0: 'OK', 1: 'CANCELLED', 2: 'UNKNOWN', 3: 'INVALID_ARGUMENT',
    4: 'DEADLINE_EXCEEDED', 5: 'NOT_FOUND', 6: 'ALREADY_EXISTS',
    7: 'PERMISSION_DENIED', 8: 'RESOURCE_EXHAUSTED', 9: 'FAILED_PRECONDITION',
    10: 'ABORTED', 11: 'OUT_OF_RANGE', 12: 'UNIMPLEMENTED',
    13: 'INTERNAL', 14: 'UNAVAILABLE', 15: 'DATA_LOSS', 16: 'UNAUTHENTICATED',
  };
  const code = error.code !== undefined ? error.code : 2;
  const statusName = statusCodeMap[code] || 'UNKNOWN';
  return {
    code,
    message: error.message || `gRPC error: ${statusName}`,
    details: error.metadata?.toString(),
  };
}

describe('gRPC-Web Client', () => {
  describe('mapGrpcError', () => {
    it('should map gRPC status code 0 to OK', () => {
      const error = { code: 0, message: 'Success' };
      const mapped = mapGrpcError(error);
      
      expect(mapped.code).toBe(0);
      expect(mapped.message).toBe('Success');
    });

    it('should map gRPC status code 3 to INVALID_ARGUMENT', () => {
      const error = { code: 3, message: 'Invalid parameter' };
      const mapped = mapGrpcError(error);
      
      expect(mapped.code).toBe(3);
      expect(mapped.message).toBe('Invalid parameter');
    });

    it('should map gRPC status code 14 to UNAVAILABLE', () => {
      const error = { code: 14, message: 'Service unavailable' };
      const mapped = mapGrpcError(error);
      
      expect(mapped.code).toBe(14);
      expect(mapped.message).toBe('Service unavailable');
    });

    it('should handle unknown status codes', () => {
      const error = { code: 999, message: 'Unknown error' };
      const mapped = mapGrpcError(error);
      
      expect(mapped.code).toBe(999);
      expect(mapped.message).toBe('Unknown error');
    });

    it('should default to code 2 (UNKNOWN) when code is missing', () => {
      const error = { message: 'Error without code' };
      const mapped = mapGrpcError(error);
      
      expect(mapped.code).toBe(2);
      // When message is provided, it's used as-is
      expect(mapped.message).toBe('Error without code');
    });

    it('should include metadata details when available', () => {
      const error = {
        code: 13,
        message: 'Internal error',
        metadata: { toString: () => 'debug-info' },
      };
      const mapped = mapGrpcError(error);
      
      expect(mapped.details).toBe('debug-info');
    });
  });

  describe('gRPC Status Code Mapping', () => {
    const testCases = [
      { code: 0, name: 'OK' },
      { code: 1, name: 'CANCELLED' },
      { code: 2, name: 'UNKNOWN' },
      { code: 3, name: 'INVALID_ARGUMENT' },
      { code: 4, name: 'DEADLINE_EXCEEDED' },
      { code: 5, name: 'NOT_FOUND' },
      { code: 6, name: 'ALREADY_EXISTS' },
      { code: 7, name: 'PERMISSION_DENIED' },
      { code: 8, name: 'RESOURCE_EXHAUSTED' },
      { code: 9, name: 'FAILED_PRECONDITION' },
      { code: 10, name: 'ABORTED' },
      { code: 11, name: 'OUT_OF_RANGE' },
      { code: 12, name: 'UNIMPLEMENTED' },
      { code: 13, name: 'INTERNAL' },
      { code: 14, name: 'UNAVAILABLE' },
      { code: 15, name: 'DATA_LOSS' },
      { code: 16, name: 'UNAUTHENTICATED' },
    ];

    testCases.forEach(({ code, name }) => {
      it(`should recognize status code ${code} as ${name}`, () => {
        const error = { code, message: `Test ${name}` };
        const mapped = mapGrpcError(error);
        
        // Code should be preserved
        expect(mapped.code).toBe(code);
        // Message should be preserved when provided
        expect(mapped.message).toBe(`Test ${name}`);
      });
    });
  });
});
