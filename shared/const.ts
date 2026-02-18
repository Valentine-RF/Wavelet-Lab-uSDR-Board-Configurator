export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

/** Bytes per complex sample for each supported SDR data format */
export const BYTES_PER_SAMPLE: Record<string, number> = {
  'ci16': 4, 'ci12': 3, 'cf32': 8, 'cs8': 2,
  'cs16': 4, 'cf32@ci12': 8, 'cfftlpwri16': 4,
};
