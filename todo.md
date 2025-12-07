# uSDR Development Board Dashboard - TODO

## Design System & Theme
- [x] Integrate Devolution Detect design tokens
- [x] Configure dark theme with Space Grotesk and IBM Plex Mono fonts
- [x] Set up green accent colors and SDR-style UI patterns

## Core UI Components
- [x] RF path selection interface with visual categorization
- [x] Frequency and bandwidth control panel
- [x] Comprehensive gain control interface (RX LNA, PGA, VGA, TX gain)
- [x] Reference clock configuration panel
- [x] Sample rate and data format selector
- [x] Device parameter builder for -D command strings

## Advanced Features
- [x] Real-time device status monitor
- [x] Command preview panel with copy-to-clipboard
- [x] Configuration preset system (save/load/import/export)
- [x] Real-time validation and throughput estimation

## Backend & Database
- [x] Database schema for device configurations and presets
- [x] tRPC procedures for configuration management
- [x] Device status monitoring API endpoints

## Integration & Testing
- [x] Wire all components together in main dashboard
- [x] Test configuration workflows
- [x] Validate generated CLI commands
- [x] Test preset import/export functionality

## Design Updates
- [x] Replace logo with Wavelet logo in top left
- [x] Change color scheme from green accents to blue accents
- [x] Update all accent colors throughout the application
- [x] Update button styles and badges with blue theme

## Navigation Enhancement
- [x] Add Presets navigation link in Dashboard header

## Logo Improvements
- [x] Increase logo size in header
- [x] Add smooth rendering for logo (image-rendering CSS)

## Logo Styling
- [x] Add rounded corners to logo to match button styling

## Streaming Backend Infrastructure
- [x] Design streaming session schema and state management
- [x] Implement device control service with usdr_dm_create process spawning
- [x] Build binary WebSocket server for I/Q data streaming
- [x] Create stream lifecycle management (start/stop/pause)
- [x] Add process monitoring and error handling
- [x] Implement tRPC procedures for device control
- [x] Add streaming status API endpoints
- [x] Create UI controls for stream start/stop
- [x] Add real-time streaming metrics display
- [x] Implement session recording management

## usdr-lib Integration
- [x] Review usdr-lib repository structure and API
- [x] Verify command line tools and parameters match usdr-lib
- [x] Update device control service to use correct usdr-lib commands
- [x] Validate RF path names and parameters against usdr-lib
- [x] Ensure frequency ranges match hardware capabilities
- [x] Update gain control ranges to match usdr-lib specifications
- [x] Verify sample rate and data format options
- [x] Test command generation against usdr-lib examples

## Buffer Size Configuration
- [x] Create BufferSizeConfig component with RX/TX buffer controls
- [x] Add throughput impact warnings and calculations
- [x] Integrate buffer size into Dashboard state management
- [x] Update command generation to include -S and -O parameters
- [x] Add recommended buffer size suggestions based on sample rate

## Multi-Channel Configuration
- [x] Create ChannelConfig component with RX/TX channel selection
- [x] Support channel mask mode (numeric bitmask)
- [x] Support named channel list mode (comma-separated names)
- [x] Add channel visualization and selection UI
- [x] Integrate channel config into Dashboard state
- [x] Update command generation with -C and -R parameters

## Configuration Validation Engine
- [x] Create validation engine with rule-based system
- [x] Add RF path frequency range validation
- [x] Add sample rate vs bandwidth validation
- [x] Add gain saturation warnings
- [x] Add buffer size vs throughput validation
- [x] Add channel configuration validation
- [x] Create ValidationPanel component for displaying issues
- [x] Integrate real-time validation into Dashboard
- [x] Add severity levels (error, warning, info)
- [x] Provide suggested corrections for each issue

## Background Music Player
- [x] Create minimal YouTube player component with small controls
- [x] Add autoplay and loop functionality
- [x] Position player in unobtrusive location
- [x] Integrate into Dashboard layout

## Vite WebSocket Fix
- [x] Update Vite HMR configuration for proxied environment
- [x] Test WebSocket connection

## Quick-Start Configuration Templates
- [x] Create configuration templates library with common SDR use cases
- [x] Add templates for 2.4 GHz ISM monitoring
- [x] Add templates for LTE Band 7 analysis
- [x] Add templates for GPS L1 reception
- [x] Add templates for wideband spectrum scanning
- [x] Create QuickStartTemplates component
- [x] Integrate templates into Dashboard UI
- [x] Add one-click template application functionality

## Language Selector (English/Russian)
- [x] Create language context and provider
- [x] Add translation files for English and Russian
- [x] Create language selector dropdown component
- [x] Integrate language selector into Dashboard header
- [x] Add localStorage persistence for language preference

## Apply Translations to Components
- [x] Update Dashboard component to use translations
- [x] Update RFPathSelector to use translations
- [x] Update FrequencyControl to use translations
- [x] Update GainControl to use translations
- [x] Update ClockConfig to use translations
- [x] Update SampleRateConfig to use translations
- [x] Update BufferSizeConfig to use translations
- [x] Update ChannelConfig to use translations
- [x] Update QuickStartTemplates to use translations
- [x] Update ValidationPanel to use translations
- [x] Update CommandPreview to use translations
- [x] Update StreamingControl to use translations## Sync Type Configuration
- [x] Create SyncTypeConfig component with timing modes
- [x] Add sync type state to Dashboard
- [x] Integrate sync type into command generation
- [x] Add validation warnings for sync modestype compatibility
- [ ] Integrate sync type into configuration summary

## Russian Translations for Quick-Start Templates
- [x] Add Russian translations for template names
- [x] Add Russian translations for template descriptions
- [x] Add Russian translations for template use cases
- [x] Update configTemplates.ts with bilingual support

## Configuration Import/Export
- [x] Create configuration export functionality (JSON)
- [x] Create configuration import functionality with file picker
- [x] Add validation for imported configurations
- [x] Add version compatibility checks
- [x] Add import/export UI controls in Dashboard
- [x] Add error handling for invalid imports
- [x] Add success/error notifications

## gRPC Migration for Holoscan Backend Integration
- [x] Design Protocol Buffer schemas matching Holoscan control plane interface
- [x] Define RadioControl service with SetFrequency, SetGain, SetSampleRate, GetStatus RPCs
- [x] Define StreamControl service for starting/stopping data acquisition
- [x] Add message types for all device configuration parameters
- [x] Install gRPC dependencies (@grpc/grpc-js, @grpc/proto-loader for Node.js)
- [x] Install grpc-web and protobuf dependencies for frontend
- [x] Set up Protocol Buffer compilation pipeline
- [x] Implement gRPC server in Node.js backend
- [x] Create gRPC service implementations for device control
- [x] Add atomic state synchronization pattern for thread-safe parameter updates
- [x] Implement gRPC-Web proxy or Envoy configuration for browser compatibility
- [ ] Migrate frontend from tRPC client to gRPC-Web client
- [ ] Update all React components to use gRPC service calls
- [ ] Add gRPC error handling and status code mapping
- [ ] Test bidirectional streaming for real-time status updates
- [x] Document gRPC service API and integration with Holoscan C++ backend
- [x] Create example C++ client code showing how Holoscan backend connects

## Frontend gRPC-Web Migration Tasks
- [x] Create gRPC-Web client wrapper with React hooks
- [x] Add error handling and gRPC status code mapping
- [x] Add real-time device status monitor component using gRPC-Web
- [x] Integrate DeviceStatusMonitor into Dashboard
- [x] Create comprehensive migration guide documentation
- [x] Write and pass unit tests for gRPC error handling
- [ ] Migrate device configuration components to gRPC-Web (optional - hybrid approach)
- [ ] Migrate streaming control components to gRPC-Web (optional - hybrid approach)
- [ ] Migrate preset management components to gRPC-Web (optional - hybrid approach)
- [ ] Remove tRPC dependencies if full migration desired

## Server-Side Streaming Implementation
- [x] Implement StreamMetrics server-side streaming in gRPC server
- [x] Create React hook for consuming gRPC streaming responses
- [x] Add StreamMetricsMonitor component with real-time charts
- [x] Display throughput, dropped samples, CPU/GPU utilization
- [x] Add connection status and reconnection logic
- [x] Test streaming performance and latency

## Complete Component Migration to gRPC
- [x] Migrate FrequencyControl to use gRPC setFrequency
- [x] Migrate GainControl to use gRPC setGain
- [ ] Migrate SampleRateConfig to use gRPC setSampleRate
- [ ] Migrate ClockConfig to use gRPC setClockConfig
- [ ] Migrate BufferSizeConfig to use gRPC setBufferConfig
- [ ] Migrate ChannelConfig to use gRPC setChannelConfig
- [x] Migrate StreamingControl to use gRPC startStream/stopStream
- [x] Add optimistic updates for instant UI feedback
- [x] Add error recovery and retry logic
- [x] Integrate gRPC control components into Dashboard
- [x] Test all components with gRPC backend

## Holoscan Backend Connection
- [x] Create deployment guide for connecting to real Holoscan C++ backend
- [ ] Add environment variables for Holoscan gRPC endpoint configuration
- [ ] Create connection health check utilities
- [ ] Add gRPC client configuration for remote Holoscan server
- [ ] Document network requirements and firewall rules
- [ ] Create troubleshooting guide for connection issues

## Waterfall Chart Re-implementation
- [x] Re-add WaterfallChart component with canvas rendering
- [x] Re-add I/Q data streaming to gRPC proto
- [ ] Re-add server-side I/Q streaming handler
- [x] Integrate waterfall into Dashboard
- [x] Verify CSS issues are resolved
- [ ] Test waterfall rendering performance

## FFT Windowing Functions
- [x] Implement Hann window function
- [x] Implement Hamming window function
- [x] Implement Blackman window function
- [x] Implement Blackman-Harris window function
- [x] Implement Flat-top window function
- [x] Implement Rectangular window (no windowing)
- [x] Add windowing function selector to WaterfallChart UI
- [x] Display window characteristics (main lobe width, side lobe attenuation)
- [ ] Test windowing impact on spectrum visualization

## Validation & Visual Feedback Improvements
- [x] Analyze current validation in configValidator.ts
- [x] Add specific error messages with valid ranges
- [x] Add warning messages for suboptimal but valid values
- [x] Create visual feedback components (error/warning/success states)
- [x] Improve Configuration Validation panel UI with animations
- [x] Add enhanced suggestion boxes with better visual hierarchy
- [ ] Add inline validation feedback in input fields
- [ ] Add tooltips explaining parameter constraints
- [ ] Add real-time validation as user types
- [ ] Test all validation scenarios

## Terminal Execution Feature
- [x] Add "Open in Terminal" button to Command Preview section
- [x] Implement backend endpoint to spawn terminal with command
- [x] Test terminal execution with generated commands

## Vite HMR WebSocket Fix
- [x] Fix Vite HMR WebSocket configuration for proxy environment
- [x] Verify WebSocket connection works properly

## Command Execution History
- [x] Create database schema for command history
- [x] Implement tRPC procedures for saving and retrieving command history
- [x] Build CommandHistory UI component with timestamps
- [x] Add re-run functionality for previous commands
- [x] Integrate history tracking when commands are executed
- [x] Add history panel to dashboard

## Remove Streaming Control
- [x] Remove StreamingControl component from Dashboard
- [x] Remove streaming control widget from Configuration Summary
- [x] Clean up unused imports

## Swap Component Order
- [x] Move Command Preview above Configuration Validation panel
- [x] Test layout after reordering

## Sticky Command Preview Buttons
- [x] Make Command Preview action buttons sticky while scrolling
- [x] Test sticky behavior across different screen sizes

## Command Templates Library
- [x] Create command template data structure and types
- [x] Build searchable command templates library component
- [x] Add category filtering (monitoring, testing, analysis, communication)
- [x] Implement search functionality
- [x] Add quick-apply functionality to load template commands
- [x] Integrate library into dashboard

## User Custom Templates
- [x] Create database schema for user-saved templates
- [x] Implement backend API for saving, loading, and deleting custom templates
- [x] Build SaveTemplateDialog component with form fields
- [x] Add "Save as Template" button to dashboard
- [x] Merge custom templates with built-in templates in library
- [x] Add delete functionality for custom templates

## Template Favorites System
- [x] Create database schema for template favorites (user-template relationship)
- [x] Implement backend API for adding/removing favorites
- [x] Add star button to all template cards (built-in and custom)
- [x] Add "Favorites" filter/tab to Command Templates Library
- [x] Show favorites count and visual indicator on starred templates
- [x] Persist favorite state across sessions

## Vite HMR WebSocket Fix (Reappeared)
- [x] Check and fix vite.config.ts HMR configuration
- [x] Restart server and verify WebSocket connection

## Expand Command Templates Library
- [x] Add more monitoring templates (weather satellites, marine bands, aviation, ISM bands)
- [x] Add more communication templates (LoRa, Zigbee, amateur radio bands)
- [x] Add more testing templates (signal generators, calibration, interference detection)
- [x] Add more analysis templates (spectrum sweeps, signal characterization)

## Template Quick Actions
- [x] Add "Copy Command" button to template cards
- [x] Add "Run in Terminal" button with duration options (3s, 5s)
- [x] Generate command with duration parameter from template
- [x] Keep existing "Apply Template" button for full configuration

## API Selection Support (libusdr vs SoapySDR)
- [x] Add API selection toggle/dropdown in dashboard header
- [x] Implement SoapySDR command generation logic
- [x] Update command preview to show correct syntax based on API selection
- [ ] Update all templates to support both libusdr and SoapySDR formats (templates apply config, not direct commands)
- [ ] Add API indicator in command history
- [ ] Update validation rules for SoapySDR syntax (validation is config-based, API-agnostic)

## API Indicators and Theme Switching
- [x] Add API field to command history database schema
- [x] Update command history tracking to save API type
- [x] Add API badges (libusdr/SoapySDR) to command history entries
- [x] Implement dynamic theme switching (blue for libusdr, red for SoapySDR)
- [x] Update CSS variables when API changes
- [x] Add API-specific validation rules
- [x] Show validation suggestions based on selected API

## Command Syntax Highlighting
- [x] Create syntax highlighter utility for libusdr commands
- [x] Create syntax highlighter for SoapySDR C++ code
- [x] Add syntax highlighting to CommandPreview component
- [x] Add syntax highlighting to CommandHistory entries
- [x] Color-code flags, values, keywords, and strings

## UI Fixes
- [x] Fix API selector UI (currently broken/unusable)
- [x] Adjust "Open in Terminal" button width to match "Copy Command" button

## Command Export to Script File
- [x] Add export button to Command Preview
- [x] Generate .sh script with shebang (#!/bin/bash)
- [x] Include descriptive comments (configuration summary, timestamp, API type)
- [x] Add the command to the script
- [x] Trigger file download with proper filename

## Fix API Switch and Theme Change
- [x] Debug why API switch buttons aren't working
- [x] Fix theme change from blue (libusdr) to red (SoapySDR)
- [x] Ensure API state updates properly
- [x] Verify theme CSS variables are applied correctly

## Final Features and Refactoring
- [x] Add API indicator badge to Configuration Summary panel
- [x] Match badge color to current theme (blue for libusdr, red for SoapySDR)
- [ ] Code sanitization and cleanup
- [ ] Remove unused imports and dead code
- [ ] Verify all features are working correctly

## URGENT FIXES
- [x] Remove Export Script button from Command Preview
- [x] Convert API selector to dropdown (like language selector)
- [x] Fix theme switching to actually work when API changes

## Button Size Fix
- [x] Make Open in Terminal button same size as Copy Command button

## Component Reordering
- [x] Move Command Templates Library above Quick-Start Templates

## Remove Language Selector
- [x] Remove LanguageSelector component from Dashboard header
- [x] Remove Russian language support

## Remove Ready Status Box
- [x] Remove Ready status indicator from dashboard header

## Add Duration and SigMF Format to Captures
- [x] Add `-d 3` or `-d 5` duration flag to all timed capture commands
- [x] Add `-f sigmf` format flag to all 3s and 5s captures
- [x] Update CommandPreview component
- [x] Update CommandTemplateLibrary component

## Command Accuracy Audit
- [ ] Review CommandPreview command generation logic
- [ ] Verify command templates use correct syntax
- [ ] Check API documentation alignment (libusdr vs SoapySDR)
- [ ] Validate all flags and parameters
- [ ] Fix any identified issues

## Command Accuracy Audit
- [x] Review CommandPreview command generation logic
- [x] Verify command templates use correct syntax
- [x] Check API documentation alignment (libusdr vs SoapySDR)
- [x] Validate all flags and parameters
- [x] Fix any identified issues (removed duplicate -c flag)

## Security Hardening
- [x] Add security headers middleware (CSP, X-Frame-Options, etc.)
- [x] Configure database backup strategy
- [ ] Test security headers in production
- [ ] Verify backup automation

## Feature Showcase Presentation
- [ ] Prepare presentation content and outline
- [ ] Design slides in Wavelet Lab theme
- [ ] Generate final presentation
- [ ] Deliver to user
