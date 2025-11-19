import React, { useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// Define color mapping for Codeforces ratings
const RATING_COLORS = {
  0: 'gray',       // Gray (unrated)
  1200: 'lime',    // Green
  1400: 'cyan',    // Cyan
  1600: 'blue',    // Blue
  1900: 'purple',  // Purple
  2100: 'gold',    // Yellow (softer)
  2300: 'orange',  // Orange
  2400: 'red',     // Red
  2600: '#c10a0a', // Bright Red
  3000: 'maroon',  // Dark Red
} as const;

type Submission = {
  id: number;
  creationTimeSeconds: number;
  verdict: string;
  problem: {
    contestId: number;
    index: string;
    rating: number;
  };
};

const getColorForRating = (rating: number): string => {
  if (rating < 1200) return RATING_COLORS[0]; // Gray for < 1200
  if (rating < 1400) return RATING_COLORS[1200]; // Green
  if (rating < 1600) return RATING_COLORS[1400]; // Cyan
  if (rating < 1900) return RATING_COLORS[1600]; // Blue
  if (rating < 2100) return RATING_COLORS[1900]; // Purple
  if (rating < 2300) return RATING_COLORS[2100]; // Yellow
  if (rating < 2400) return RATING_COLORS[2300]; // Orange
  if (rating < 2600) return RATING_COLORS[2400]; // Red
  if (rating < 3000) return RATING_COLORS[2600]; // Bright Red
  return RATING_COLORS[3000]; // Dark Red for 3000+
};

const processSubmissionsForHeatmap = (submissions: Submission[]) => {
  const dateMaxRating = new Map<string, number>();

  // Group submissions by date and find max rating for successful submissions
  submissions.forEach(sub => {
    if (sub.verdict === 'OK') {
      const date = new Date(sub.creationTimeSeconds * 1000);
      const dateKey = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;

      const currentMax = dateMaxRating.get(dateKey) || 0;
      if (sub.problem.rating > currentMax) {
        dateMaxRating.set(dateKey, sub.problem.rating);
      }
    }
  });

  return dateMaxRating;
};

const getHandleFromUrl = (): string | null => {
  const path = window.location.pathname;
  const parts = path.split("/");
  const idx = parts.indexOf("profile");
  if (idx >= 0 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);
  return null;
};



const resetHeatmapColors = () => {
  // Find the heatmap SVG and restore original colors
  const heatmapContainer = document.querySelector('#userActivityGraph');
  if (!heatmapContainer) {
    console.log('Heatmap container not found for reset');
    return;
  }

  const rects = heatmapContainer.querySelectorAll('rect.day');
  let resetCount = 0;
  rects.forEach(rect => {
    const originalColor = rect.getAttribute('data-original-fill');
    if (originalColor) {
      const currentColor = rect.getAttribute('fill');
      if (currentColor !== originalColor) {
        rect.setAttribute('fill', originalColor);
        resetCount++;
      }
    }
  });

  if (resetCount > 0) {
    console.log(`Reset ${resetCount} rectangles to original colors`);
  }
};

const MaxRatedHeatmap: React.FC = () => {
  const applyMaxRatedHeatmap = useCallback(async () => {
    try {
      const handle = getHandleFromUrl();
      if (!handle) {
        console.log('Could not determine handle from URL');
        return;
      }

      // Fetch user data via background script (which handles caching in IndexedDB)
      const response = await new Promise<{ success: boolean; submissions?: Submission[]; error?: string } | undefined>((resolve) => {
        chrome.runtime.sendMessage({ type: "fetch-user-data", handle }, (res) => {
          resolve(res);
        });
      });

      if (!response || !response.success || !response.submissions) {
        throw new Error(response?.error || "Failed to fetch user data (empty response)");
      }

      const submissions = response.submissions;

      const dateMaxRating = processSubmissionsForHeatmap(submissions);

      // Find the heatmap SVG
      const heatmapContainer = document.querySelector('#userActivityGraph');
      if (!heatmapContainer) {
        console.log('Heatmap container not found');
        return;
      }

      // Store original colors if not already stored
      const rects = heatmapContainer.querySelectorAll('rect.day');
      rects.forEach(rect => {
        if (!rect.hasAttribute('data-original-fill')) {
          const fill = rect.getAttribute('fill');
          if (fill) {
            rect.setAttribute('data-original-fill', fill);
          }
        }
      });

      // Update each day's color based on max rating
      rects.forEach(rect => {
        const date = rect.getAttribute('data-date');
        if (date) {
          const maxRating = dateMaxRating.get(date);
          if (maxRating && maxRating > 0) {
            const color = getColorForRating(maxRating);
            rect.setAttribute('fill', color);
          } else {
            // No solved problems that day or no valid rating, set to gray
            rect.setAttribute('fill', '#EBEDF0');
          }
        }
      });


    } catch (error) {
      console.error('Failed to apply max rated heatmap:', error);
    }
  }, []);

  // Watch for heatmap content changes using MutationObserver for instant detection
  useEffect(() => {
    const heatmapParent = document.querySelector('.roundbox.userActivityRoundBox');
    if (!heatmapParent) return;

    const observer = new MutationObserver((mutations) => {
      // Check if the heatmap container was added or its content changed
      const hasRelevantChange = mutations.some(mutation => {
        if (mutation.type === 'childList') {
          // Check if userActivityGraph was added or removed
          const addedNodes = Array.from(mutation.addedNodes);
          const removedNodes = Array.from(mutation.removedNodes);
          return addedNodes.some(node => (node as Element).id === 'userActivityGraph' || (node as Element).querySelector?.('#userActivityGraph')) ||
                 removedNodes.some(node => (node as Element).id === 'userActivityGraph' || (node as Element).querySelector?.('#userActivityGraph'));
        }
        return false;
      });

      if (hasRelevantChange) {
        setTimeout(() => {
          // Apply max-rated colors immediately
          applyMaxRatedHeatmap();
        }, 50); // Small delay to ensure DOM is fully updated
      }
    });

    observer.observe(heatmapParent, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [applyMaxRatedHeatmap]);

  // Also watch for fill attribute changes on individual rects
  useEffect(() => {
    const heatmapContainer = document.querySelector('#userActivityGraph');
    if (!heatmapContainer) return;

    const rectObserver = new MutationObserver((mutations) => {
      const hasFillChange = mutations.some(mutation =>
        mutation.type === 'attributes' &&
        mutation.attributeName === 'fill' &&
        (mutation.target as Element).classList.contains('day')
      );

      if (hasFillChange) {
        // Check if we need to reapply colors
        const rects = heatmapContainer.querySelectorAll('rect.day');
        const hasDefaultColors = Array.from(rects).some(rect => {
          const fill = rect.getAttribute('fill');
          return fill === '#EBEDF0' || fill === '#ebedf0';
        });

        if (hasDefaultColors) {
          applyMaxRatedHeatmap();
        }
      }
    });

    rectObserver.observe(heatmapContainer, {
      attributes: true,
      attributeFilter: ['fill'],
      subtree: true
    });

    return () => rectObserver.disconnect();
  }, [applyMaxRatedHeatmap]);

  useEffect(() => {
    // Apply max-rated colors immediately when mounted
    applyMaxRatedHeatmap();

    // Reset to original colors when unmounted
    return () => {
      resetHeatmapColors();
    };
  }, [applyMaxRatedHeatmap]);

  // This component doesn't render anything visible
  return null;
};

// Store root for unmounting
let heatmapRoot: ReactDOM.Root | null = null;

// Mount function
export const mountMaxRatedHeatmap = () => {
  // Idempotency check: if already mounted, do nothing
  if (heatmapRoot) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'cf-mentor-max-rated-heatmap';
  document.body.appendChild(container);

  heatmapRoot = ReactDOM.createRoot(container);
  heatmapRoot.render(<MaxRatedHeatmap />);
};

// Unmount function
export const unmountMaxRatedHeatmap = () => {
  if (heatmapRoot) {
    heatmapRoot.unmount();
    heatmapRoot = null;
  }
  const container = document.getElementById('cf-mentor-max-rated-heatmap');
  if (container) {
    container.remove();
  }
  // Note: The cleanup in useEffect will handle resetting colors
};