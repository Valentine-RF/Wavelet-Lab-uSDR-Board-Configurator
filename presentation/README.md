# uSDR Dashboard Feature Showcase Presentation

A professional 16-slide presentation showcasing the uSDR Development Board Dashboard features in Wavelet Lab's signature cyberpunk technical aesthetic.

## 🎨 Design Theme

- **Color Palette**: Dark navy backgrounds with electric cyan (#00d4ff) and Wavelet blue (#0088cc) accents
- **Typography**: Space Grotesk (headings) and IBM Plex Mono (technical content)
- **Aesthetic**: Cyberpunk technical with clean geometric layouts and grid overlays

## 📊 Slide Overview

1. **Title Slide** - Wavelet Lab branding and dashboard introduction
2. **Overview** - Dashboard purpose and key capabilities
3. **Dual API Support** - libusdr CLI vs SoapySDR C++ comparison
4. **RF Path Configuration** - RX/TX/TRX modes with frequency spectrum (700 MHz - 6 GHz)
5. **Gain Control** - Multi-stage gain system with real-time calculation
6. **Command Templates** - 30+ pre-configured templates by category
7. **Validation Engine** - Real-time error checking with actionable suggestions
8. **Command Preview** - Syntax highlighting and export features
9. **Presets & History** - Configuration management with timestamps
10. **Import/Export** - Team collaboration workflow with version control
11. **OWASP Security Headers** - Detailed security header implementation
12. **OAuth Authentication** - Manus OAuth 2.0 flow and session security
13. **Database Backups** - Automated backup strategy with encryption
14. **Retention Comparison** - 7-day vs 30-day backup strategy analysis
15. **Production Security** - High-level security overview
16. **Closing** - 95% deployment readiness summary

## 🌐 Viewing the Presentation

### Option 1: GitHub Pages (Recommended)

If GitHub Pages is enabled for this repository, view the presentation at:
```
https://valentine-rf.github.io/Wavelet-Lab-uSDR-Board-Configurator/presentation/title.html
```

### Option 2: Local Viewing

1. Clone the repository:
```bash
git clone https://github.com/Valentine-RF/Wavelet-Lab-uSDR-Board-Configurator.git
cd Wavelet-Lab-uSDR-Board-Configurator/presentation
```

2. Open slides in your browser:
```bash
# Open the title slide
open title.html
# or on Linux
xdg-open title.html
```

3. Navigate through slides:
   - `title.html` → `overview.html` → `dual_api.html` → ... → `closing.html`

### Option 3: Simple HTTP Server

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx http-server

# Then open http://localhost:8000/title.html
```

## 📁 Slide Files

All slides are standalone HTML files with embedded CSS and use CDN-hosted fonts:
- Google Fonts: Space Grotesk, IBM Plex Mono
- Font Awesome 6.0 for icons

No build process required - slides work directly in any modern browser.

## 🎯 Presentation Highlights

- **Deployment Readiness**: 95%
- **Security Rating**: A+ (OWASP compliant)
- **Features Covered**: Dual API support, 30+ templates, real-time validation
- **Technical Depth**: Security headers, OAuth flow, backup strategies

## 📝 Slide Navigation Order

```
title.html
  ↓
overview.html
  ↓
dual_api.html
  ↓
rf_config.html
  ↓
gain_control.html
  ↓
templates.html
  ↓
validation.html
  ↓
command_preview.html
  ↓
presets.html
  ↓
import_export.html
  ↓
security_headers.html
  ↓
oauth_auth.html
  ↓
database_backups.html
  ↓
retention_comparison.html
  ↓
security.html
  ↓
closing.html
```

## 🖼️ Assets

Dashboard screenshots and hardware images are located in the `assets/` directory.

---

**Created for Wavelet Lab uSDR Development Board Dashboard**
