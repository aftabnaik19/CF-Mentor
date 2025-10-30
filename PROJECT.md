# CF-Mentor Chrome Extension

## Overview

CF-Mentor is a Chrome extension designed to enhance the Codeforces experience by providing personalized problem recommendations, advanced filtering, bookmarking, and performance tracking features. It helps users select problems best suited for their rating growth and track their progress.

## Architecture

The extension follows a standard Chrome extension architecture with Manifest V3:

- **Background Service Worker**: Handles data fetching, caching, and cross-context communication
- **Popup**: User interface for managing extension settings and features
- **Content Scripts**: Inject UI components into Codeforces pages
- **Shared Utilities**: Common types, stores, and utilities used across contexts

## Modules

### Background Worker (`src/background/`)

The background service worker manages data persistence, API communication, and extension lifecycle.

#### Key Components:

**`index.ts`** - Main service worker entry point
- Manages data fetching states (INITIAL, FETCHING, READY, ERROR)
- Handles bookmark storage operations (add, update, remove, query)
- Provides caching for API responses (24-hour TTL)
- Manages daily data fetch alarms
- Processes user rating and submission data

**`dataFetcher.ts`** - Data acquisition and processing
- Fetches problem, contest, and sheet data from CF-Mentor API
- Retrieves user submissions and integrates verdict information
- Stores data in IndexedDB for offline access
- Updates filter metadata (contest types, sheet names, problem tags)

#### Data Flow:
1. Extension installation triggers initial data fetch
2. Daily alarms refresh data automatically
3. User submissions are fetched and cached hourly
4. Problems are enriched with user verdict data

### Popup (`src/popup/`)

The popup provides a settings interface for toggling extension features.

#### Features:
- Toggle individual features (Problem Assistant, Stopwatch, Advanced Filtering, etc.)
- Manual data refresh trigger
- Persistent settings storage in chrome.storage.local

#### Components:
- **PopupApp.tsx**: Main React component with feature toggles
- **PopupMain.tsx**: React root renderer
- **index.html**: Basic HTML shell

### Content Scripts (`src/content/`)

Content scripts inject UI components into Codeforces pages based on URL patterns.

#### Core Features:

**Problem Assistant Panel** (`src/content/components/ProblemAssistantPanel.tsx`)
- Displays on individual problem pages (`/contest/*/problem/*`, `/problemset/problem/*/*`)
- Provides bookmarking functionality with difficulty rating and notes
- Integrates stopwatch for time tracking
- Uses shadow DOM for isolation

**Stopwatch** (`src/content/components/Stopwatch.tsx`)
- Tracks time spent on problems with pause/resume/reset functionality
- Persists state in localStorage per problem
- Handles inactivity detection (2-hour threshold)
- Displays time in HH:MM:SS format

**Advanced Filter Panel** (`src/content/components/AdvanceFilterPanel/`)
- Replaces default tag filter on problemset page
- Advanced filtering by difficulty, contest type, problem index, sheets, tags
- Supports AND/OR tag combination modes
- Auto-recommend feature for personalized problem selection

**Enhanced Data Table** (`src/content/components/datatable/DataTable.tsx`)
- Replaces default problemset table with PrimeReact DataTable
- Rich sorting, filtering, and pagination
- Color-coded rows based on user verdict (solved/wrong/TLE)
- Displays attempt %, acceptance %, CF/Clist ratings

**Contest History Summary** (`src/content/components/ContestHistorySummary/`)
- Shows on profile pages (`/profile/*`)
- Division-wise contest performance analysis
- Configurable time windows (by contest count or months)
- Per-problem letter statistics (A-G)
- Average metrics: attempts, solves, rating changes, ranks

#### Mounting System:
- **Health Check**: Monitors service worker connection
- **Feature Flags**: Dynamic component mounting based on user preferences
- **Shadow DOM**: Isolated styling and component encapsulation
- **URL Detection**: Context-aware component activation

### Shared Components

#### Stores (`src/shared/stores/`)
- **Feature Flags Store**: Manages enabled/disabled features
- **Filter Store**: Handles problem filtering state
- **Connection Store**: Tracks extension-service worker connectivity

#### Types (`src/shared/types/`)
- **Bookmark Types**: Problem bookmarking data structures
- **Filter Types**: Problem filtering interfaces
- **Mentor Data Types**: API response schemas

#### Utilities (`src/shared/utils/`)
- **IndexedDB**: Local data storage for problems/contests/sheets
- **Logger**: Structured logging with levels
- **Metadata Service**: Filter metadata management
- **Bookmark Storage**: Chrome storage API wrapper for bookmarks

## Configuration

### Manifest (`manifest.json`)
- Manifest V3 specification
- Content script injection on Codeforces domains
- Storage and alarm permissions
- Web accessible resources for assets

### Constants (`src/shared/constants/`)
- API endpoints and timeouts
- Storage keys
- Message types for inter-context communication

## Data Flow

1. **Installation/Startup**: Background worker fetches initial data
2. **Page Load**: Content scripts detect URL and mount appropriate components
3. **User Interaction**: Components communicate with background via messages
4. **Data Updates**: Background caches API responses and updates IndexedDB
5. **Settings Changes**: Popup updates feature flags, content scripts remount components

## Key Features

### Problem Recommendation
- Advanced filtering with multiple criteria
- Auto-recommend based on user performance
- Sheet-based problem collections

### Progress Tracking
- Bookmark problems with personal ratings and notes
- Stopwatch for time management
- Contest history analysis

### Performance Insights
- User verdict integration (solved/wrong/TLE status)
- Division-wise contest summaries
- Per-problem statistics

### User Experience
- Seamless integration with Codeforces UI
- Shadow DOM isolation prevents styling conflicts
- Responsive design with mobile support
- Persistent settings and data

## Development

### Build System
- Vite for bundling
- TypeScript for type safety
- React for UI components
- PrimeReact for data tables

### Storage Strategy
- IndexedDB for large datasets (problems, contests)
- Chrome storage for settings and bookmarks
- localStorage for component-specific state

### Communication
- Chrome runtime messaging for cross-context communication
- Ports for long-lived connections
- Storage change listeners for reactive updates

This extension enhances Codeforces by providing comprehensive tools for problem selection, progress tracking, and performance analysis, helping users optimize their competitive programming journey.