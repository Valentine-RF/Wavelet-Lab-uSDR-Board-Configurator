# Changelog

All notable changes to the uSDR Development Board Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-06

### Added
- Initial stable release
- Dual API support (libusdr CLI and SoapySDR C++)
- 30+ command templates organized by category
- Real-time validation engine with actionable suggestions
- RF path configuration (700-6000 MHz)
- Multi-stage gain control (LNA, PGA, VGA)
- Configuration presets and import/export
- Command history tracking
- OWASP security headers (A+ rating)
- Manus OAuth 2.0 authentication
- Role-based access control
- Automated database backups (7-day retention)
- Docker deployment support
- Comprehensive documentation
- 16-slide feature showcase presentation
- English and Russian language support

### Security
- Implemented OWASP Top 10 compliance
- Added security headers (CSP, X-Frame-Options, HSTS, etc.)
- Configured AES-256 encryption for backups
- Enabled TLS 1.3 for data in transit
- Implemented JWT-based session management

## [Unreleased]

### Planned
- Real-time I/Q data streaming
- Waterfall chart visualization
- gRPC integration for Holoscan backend
- Advanced spectrum analysis tools
- Multi-device management
- Cloud synchronization of presets

---

For detailed release notes, see [docs/RELEASE_NOTES.md](docs/RELEASE_NOTES.md)
