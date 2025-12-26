/**
 * Shared constants for the uSDR Dashboard server
 * Centralizes magic numbers and configuration values
 */

// =============================================================================
// Time Constants (milliseconds)
// =============================================================================

/** Interval between metrics updates during streaming (ms) */
export const METRICS_UPDATE_INTERVAL_MS = 5000;

/** One second in milliseconds */
export const ONE_SECOND_MS = 1000;

/** One minute in milliseconds */
export const ONE_MINUTE_MS = 60 * 1000;

/** Five minutes in milliseconds */
export const FIVE_MINUTES_MS = 5 * 60 * 1000;

// =============================================================================
// Server Configuration
// =============================================================================

/** Default server port */
export const DEFAULT_PORT = 3000;

/** Number of ports to scan when preferred port is unavailable */
export const PORT_SCAN_RANGE = 20;

// =============================================================================
// Streaming & Data
// =============================================================================

/** Bits per byte for throughput calculations */
export const BITS_PER_BYTE = 8;

/** Bytes per megabyte for file size calculations */
export const BYTES_PER_MB = 1024 * 1024;

/** Bits per megabit for throughput display */
export const BITS_PER_MEGABIT = 1_000_000;

// =============================================================================
// SDR Hardware Limits
// =============================================================================

/** Maximum RX LNA gain in dB */
export const MAX_RX_LNA_GAIN = 30;

/** Maximum RX PGA gain in dB */
export const MAX_RX_PGA_GAIN = 19;

/** Maximum RX VGA gain in dB */
export const MAX_RX_VGA_GAIN = 15;

/** Maximum TX gain in dB */
export const MAX_TX_GAIN = 89;

/** Maximum DAC tuning value (12-bit) */
export const MAX_DAC_TUNING = 4095;

// =============================================================================
// WebSocket Close Codes
// These are standard codes but named for clarity
// =============================================================================

/** Normal closure */
export const WS_CLOSE_NORMAL = 1000;

/** Policy violation - authentication/authorization failures */
export const WS_CLOSE_POLICY_VIOLATION = 1008;

/** Internal error */
export const WS_CLOSE_INTERNAL_ERROR = 1011;

// =============================================================================
// Validation Limits
// =============================================================================

/** Maximum config name length */
export const MAX_CONFIG_NAME_LENGTH = 255;

/** Maximum template description length */
export const MAX_DESCRIPTION_LENGTH = 1000;

/** Maximum command tags count */
export const MAX_TAGS_COUNT = 10;

/** Maximum tag length */
export const MAX_TAG_LENGTH = 50;

// =============================================================================
// Security
// =============================================================================

/** HSTS max-age in seconds (1 year) */
export const HSTS_MAX_AGE_SECONDS = 31536000;

/** Session cookie max age (7 days in seconds) */
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
