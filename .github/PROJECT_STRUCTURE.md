# CF Mentor Project Structure

This document outlines the structure and conventions of the CF Mentor project, intended to guide development and refactoring.

## Conventions

### File Naming

- **Components:** `PascalCase.tsx` (e.g., `ProblemAssistantPanel.tsx`)
- **Hooks:** `use-kebab-case.ts` (e.g., `use-advance-filter.ts`)
- **Utilities/Services:** `camelCase.ts` (e.g., `bookmarkStorage.ts`)
- **CSS:** `PascalCase.css` (e.g., `BookmarkPanel.css`)
- **Other Files:** `kebab-case.ts` (e.g., `filter-panel-data.ts`)
- **Folders:** `kebab-case` (e.g., `chat-panel`)

### Variable & Function Naming

- **Variables & Functions:** `camelCase`
- **React Components:** `PascalCase`
- **Constants:** `UPPER_CASE`

## Project Overview

- **Type:** React-based Chrome extension
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Plain CSS
- **Linting:** ESLint with TypeScript, React, and import sorting rules.
- **Key Libraries:**
    - `primereact`: UI components
    - `lucide-react`: Icons
    - `axios`: Data fetching
    - `zustand`: State management

## Directory Structure

- `src/background`: Background service worker for the extension.
- `src/content`: Scripts and components injected directly into Codeforces pages.
- `src/popup`: UI for the extension's popup window.
- `src/shared`: Reusable code, types, and utilities shared across different parts of the extension.
- `src/assets`: Static assets like icons and styles.

## Architecture: Internal Communication

The extension uses a robust, event-driven architecture to manage data and communication between the background service worker and content scripts. This pattern ensures a single source of truth and avoids race conditions.

### 1. Single Source of Truth

The **background script (`src/background/index.ts`) is the sole owner and manager of all data**. It is the only part of the extension that directly interacts with the IndexedDB database. Content scripts never access the database directly; they must request data from the background script.

### 2. Data Request Lifecycle

Communication between the background and content scripts follows a "one-shot" request model for data fetching.

1.  A content script (e.g., `Datatable.tsx`) needs data. It opens a new, temporary port to the background script.
2.  The background script immediately sends the current data state (`FETCHING`, `READY`, etc.).
3.  If the state is `READY`, the content script sends a `get-data` message.
4.  The background script retrieves the data from IndexedDB and sends it back in a `data-response` message.
5.  The content script receives the data, processes it, and then **disconnects the port**.

This model ensures that there are no stale or disconnected ports, which prevents race conditions and infinite loading states if the service worker goes dormant and restarts.

## Architecture: Content Script Communication

For features requiring communication between independent components injected into the same page (e.g., the `AdvanceFilterPanel` and the `Datatable`), we use a shared Zustand store.

### Rationale

A shared state management solution offers a direct, performant, and idiomatic pattern for React applications, avoiding the latency of brokering messages through the background script.

### Implementation: `useFilterStore`

1.  **Shared Store:** A Zustand store (`src/shared/stores/filter-store.ts`) holds the current `ProblemFilter` object.
2.  **"Writer" Component:** The `AdvanceFilterPanel` acts as the writer. A debounced `useEffect` in its controller hook (`useAdvancedFilter`) constructs a filter object from the UI state and calls `setFilters` only when the filter values have genuinely changed.
3.  **"Reader" Component:** The `Datatable` acts as the reader. It subscribes to the `filters` state in the store. Whenever the state changes, a `useEffect` hook in the `Datatable` re-fetches the problems with the new filters applied.

## Architecture: Data-Driven Filtering UI

To ensure the filter options are always accurate and consistent, the UI is populated dynamically from the dataset itself.

1.  **Metadata Generation:** After the background script fetches data from the API, it processes the entire dataset to extract all unique contest types, sheet names, and problem tags.
2.  **Metadata Storage:** This collection of unique values is stored as a single object in `chrome.storage.local` under the key `"filterMetadata"`.
3.  **Metadata Service:** A simple service (`src/shared/utils/metadataService.ts`) provides a clean async interface to retrieve this metadata object.
4.  **Dynamic UI:** The `AdvanceFilterPanel` calls the metadata service on mount and uses the retrieved data to populate its dropdowns and tag selectors. This makes the filtering system robust and self-maintaining.

---

## Development Log

### October 2025

#### **Architecture & Features**

-   **Advanced Problem Filtering:** Implemented a comprehensive, reactive filtering system.
    -   **Core Logic:** The `ProblemService` can now filter problems based on a complex `ProblemFilter` object.
    -   **State Management:** Integrated a shared Zustand store (`useFilterStore`) to manage the filter state.
    -   **UI Integration:** The `AdvanceFilterPanel` now dynamically updates the filter state, and the `Datatable` subscribes to these changes, re-fetching data automatically. The UI is debounced to prevent excessive API calls.
-   **Data-Driven UI:** Refactored the `AdvanceFilterPanel` to be fully data-driven.
    -   The background script now generates a "metadata" object (containing all unique tags, contest types, etc.) after fetching data.
    -   This metadata is stored in `chrome.storage.local` and consumed by the UI, ensuring filter options are always in sync with the actual data.
-   **Optimized Data Fetching:** Refactored the data fetching process to improve initial load performance.
    -   The background script no longer generates filter metadata (tags, contest types) on the client-side.
    -   This metadata is now provided directly by the API, reducing client-side processing.
    -   Removed the `snake_case` to `camelCase` data conversion logic from the client, simplifying the data fetcher. The API is now expected to serve `camelCase` keys.

#### **Bug Fixes & Refactoring**

-   **Infinite Loading State:** Fixed a critical bug where clearing filters would cause the datatable to get stuck loading. Refactored the `ProblemService` to use a "one-shot" communication pattern that prevents stale port errors.
-   **Infinite Re-render Loop:** Resolved a bug where the `Datatable` would refresh endlessly. The `useAdvancedFilter` hook now performs a deep comparison to ensure it only updates the global state when filter values have actually changed.
-   **Filter Inaccuracy:** Fixed a bug where the "Contest Type" filter failed due to data mismatches. This was resolved by the move to a fully data-driven filtering architecture.
-   **File Naming Conventions:** Enforced project file naming conventions, resolving multiple TypeScript build errors.
-   **Service Worker Dormancy:** Addressed an issue where data would not load if the service worker was dormant.
-   **Launch Preparation:** Corrected the `manifest.json` to use production-ready build paths and removed unnecessary permissions (`"scripting"`) to align with Chrome Web Store best practices.
-   **Consolidated Filter Logic:** Made the `AdvanceFilterPanel` fully data-driven by removing all hardcoded static data files and unused components, centralizing data management within the `useAdvancedFilter` hook.
-   **DataTable Mount Condition:** Fixed a bug where the `DataTable` would not mount on problemset URLs with a trailing slash (e.g., `/problemset/`).
