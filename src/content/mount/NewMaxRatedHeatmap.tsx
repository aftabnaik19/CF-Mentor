import React, { useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { createPortal } from 'react-dom';

// --- Types & Constants ---

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

type FooterStats = {
  allTime: { value: string; desc: string };
  lastYear: { value: string; desc: string };
  lastMonth: { value: string; desc: string };
  maxStreak: { value: string; desc: string };
  lastYearStreak: { value: string; desc: string };
  lastMonthStreak: { value: string; desc: string };
};

type YearOption = {
  value: string;
  label: string;
};

const getColorForRating = (rating: number): string => {
  if (rating < 1200) return RATING_COLORS[0];
  if (rating < 1400) return RATING_COLORS[1200];
  if (rating < 1600) return RATING_COLORS[1400];
  if (rating < 1900) return RATING_COLORS[1600];
  if (rating < 2100) return RATING_COLORS[1900];
  if (rating < 2300) return RATING_COLORS[2100];
  if (rating < 2400) return RATING_COLORS[2300];
  if (rating < 2600) return RATING_COLORS[2400];
  if (rating < 3000) return RATING_COLORS[2600];
  return RATING_COLORS[3000];
};

const getHandleFromUrl = (): string | null => {
  const path = window.location.pathname;
  const parts = path.split("/");
  const idx = parts.indexOf("profile");
  if (idx >= 0 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);
  return null;
};

// --- Helper Functions ---

const formatDate = (date: Date): string => {
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
};

const getMonthName = (monthIndex: number): string => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[monthIndex];
};

// --- Component ---

const NewMaxRatedHeatmap: React.FC<{ 
  initialStats: FooterStats | null;
  initialYear: string;
  availableYears: YearOption[];
}> = ({ initialStats, initialYear, availableYears }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(initialYear);
  const [loading, setLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      const handle = getHandleFromUrl();
      if (!handle) return;

      try {
        const response = await new Promise<{ success: boolean; submissions?: Submission[]; error?: string } | undefined>((resolve) => {
          chrome.runtime.sendMessage({ type: "fetch-user-data", handle }, resolve);
        });

        if (response && response.success && response.submissions) {
          setSubmissions(response.submissions);
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sync selected year with original Codeforces dropdown
  useEffect(() => {
    const originalSelect = document.querySelector('select[name="yearSelect"]') as HTMLSelectElement;
    if (originalSelect && originalSelect.value !== selectedYear) {
      originalSelect.value = selectedYear;
      // Dispatch change event so Codeforces updates its internal state/UI (even if hidden)
      originalSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, [selectedYear]);

  // Process data for heatmap
  const { heatmapData } = useMemo(() => {
    const dateMap = new Map<string, { 
      maxRating: number; 
      count: number;
      attempted: number;
      accepted: number;
      ratingBreakdown: Record<number, number>;
      unratedAc: number;
      unratedAttempts: number;
    }>();

    // Filter and process submissions
    submissions.forEach(sub => {
      const date = new Date(sub.creationTimeSeconds * 1000);
      const dateKey = formatDate(date);
      
      const current = dateMap.get(dateKey) || { 
        maxRating: 0, 
        count: 0,
        attempted: 0,
        accepted: 0,
        ratingBreakdown: {},
        unratedAc: 0,
        unratedAttempts: 0
      };

      current.attempted++;
      current.count++; // Total items (submissions)

      if (sub.verdict === 'OK') {
        current.accepted++;
        if (sub.problem.rating) {
          if (sub.problem.rating > current.maxRating) {
            current.maxRating = sub.problem.rating;
          }
          current.ratingBreakdown[sub.problem.rating] = (current.ratingBreakdown[sub.problem.rating] || 0) + 1;
        } else {
          current.unratedAc++;
        }
      } else {
        if (!sub.problem.rating) {
          current.unratedAttempts++;
        }
      }
      
      dateMap.set(dateKey, current);
    });

    // Determine date range
    let startDate: Date;
    let endDate: Date;

    const year = parseInt(selectedYear);
    if (isNaN(year)) {
      // Last 365 days ending today
      endDate = new Date();
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 365);
    } else {
      // Specific year
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    // We generate enough weeks to cover endDate
    const gridStartDate = new Date(startDate);
    gridStartDate.setDate(gridStartDate.getDate() - gridStartDate.getDay()); // Go back to Sunday

    const gridData: { 
      date: Date; 
      dateKey: string; 
      maxRating: number; 
      count: number;
      attempted: number;
      accepted: number;
      ratingBreakdown: Record<number, number>;
      unratedAc: number;
      unratedAttempts: number;
    }[][] = [];
    
    let currentWeek: typeof gridData[0] = [];
    
    const iterDate = new Date(gridStartDate);
    let loopCount = 0;
    while (iterDate <= endDate || currentWeek.length > 0) {
      if (loopCount++ > 1000) break;

      const dateKey = formatDate(iterDate);
      const data = dateMap.get(dateKey) || { 
        maxRating: 0, 
        count: 0,
        attempted: 0,
        accepted: 0,
        ratingBreakdown: {},
        unratedAc: 0,
        unratedAttempts: 0
      };
      
      currentWeek.push({
        date: new Date(iterDate),
        dateKey,
        ...data
      });

      if (currentWeek.length === 7) {
        gridData.push(currentWeek);
        currentWeek = [];
      }

      iterDate.setDate(iterDate.getDate() + 1);
      
      if (iterDate > endDate && currentWeek.length === 0) break;
    }

    return {
      heatmapData: gridData,
    };

  }, [submissions, selectedYear]);

  const getCellColor = (day: typeof heatmapData[0][0]) => {
    if (day.maxRating > 0) {
      return getColorForRating(day.maxRating);
    }
    // Fallback for unrated activity
    if (day.unratedAc > 0) {
      // Gradient from dark gray to black based on AC count (1 to 5+)
      // Distinct from standard 'gray' (Newbie) which is lighter.
      if (day.unratedAc >= 5) return '#000000';
      
      const intensity = day.unratedAc; // 1 to 4
      // 1 -> #666666, 4 -> #1A1A1A
      if (intensity === 1) return '#666666';
      if (intensity === 2) return '#4D4D4D';
      if (intensity === 3) return '#333333';
      if (intensity === 4) return '#1A1A1A';
    }
    if (day.unratedAttempts > 0 || (day.attempted > 0 && day.maxRating === 0)) {
      // 0 AC but >0 attempts (unrated or rated failures)
      return '#e0e0e0'; // Faint gray
    }
    return '#EBEDF0'; // Empty
  };

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: React.ReactNode;
  }>({ visible: false, x: 0, y: 0, content: null });

  const getTooltipContent = (day: typeof heatmapData[0][0]) => {
    // Sort ratings descending
    const ratings = Object.keys(day.ratingBreakdown).map(Number).sort((a, b) => b - a);
    
    return (
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{day.dateKey}</div>
        <div>Attempted: {day.attempted}</div>
        <div>Accepted: {day.accepted}</div>
        {ratings.length > 0 && (
          <div style={{ marginTop: '4px', borderTop: '1px solid #eee', paddingTop: '2px' }}>
            {ratings.map(r => (
              <div key={r}>{r}: {day.ratingBreakdown[r]}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleMouseEnter = (e: React.MouseEvent, day: typeof heatmapData[0][0]) => {
    setTooltip({
      visible: true,
      x: e.clientX + 10,
      y: e.clientY + 10,
      content: getTooltipContent(day)
    });
  };

  const handleHeaderMouseEnter = (e: React.MouseEvent) => {
    setTooltip({
      visible: true,
      x: e.clientX + 10,
      y: e.clientY + 10,
      content: (
        <div style={{ maxWidth: '250px', textAlign: 'left' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Max Rated Activity</div>
          <div>Shows the highest rating of a problem solved on each day.</div>
          <div style={{ marginTop: '4px' }}>Days with only unrated/gym problems are shown in a dark gray-to-black gradient based on solve count.</div>
        </div>
      )
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltip(prev => ({
      ...prev,
      x: e.clientX + 10,
      y: e.clientY + 10
    }));
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };


  // Render
  if (loading) return null;

  return (
    <>
      {tooltip.visible && createPortal(
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y,
          background: 'white',
          border: '1px solid #ccc',
          padding: '6px 10px',
          fontFamily: 'verdana, arial, sans-serif',
          fontSize: '11px',
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '2px 2px 3px rgba(0,0,0,0.2)',
          color: '#333',
          lineHeight: '1.3'
        }}>
          {tooltip.content}
        </div>,
        document.body
      )}
      <div className="_UserActivityFrame_frame">
        <div className="roundbox userActivityRoundBox borderTopRound borderBottomRound" style={{ padding: '10px' }}>
          
          {/* Header */}
          <div className="_UserActivityFrame_header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span 
              className="_UserActivityFrame_caption" 
              style={{ fontWeight: 'bold', color: '#444', cursor: 'help' }}
              onMouseEnter={handleHeaderMouseEnter}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              Max Rated Activity
            </span>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="_UserActivityFrame_selector weeks52">
                <label>
                  <select 
                    name="yearSelect" 
                    style={{ fontSize: '1em' }}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {availableYears.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="_UserActivityFrame_selector weeks52">
                <label htmlFor="showPrivateActivity" style={{ marginRight: '5px' }}>Mode:</label>
                <select name="showPrivateActivity" id="showPrivateActivity" style={{ fontSize: '1em' }} disabled>
                  <option value="true">Max Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Graph */}
          <div id="userActivityGraph" style={{ overflowX: 'auto' }}>
            <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 721 110" style={{ width: '100%', height: 'auto' }}>
              <g transform="translate(25, 20)">
                {heatmapData.map((week, weekIndex) => (
                  <g key={weekIndex} transform={`translate(${weekIndex * 13}, 0)`}>
                    {week.map((day, dayIndex) => (
                      <rect
                        key={day.dateKey}
                        className="day"
                        width="11"
                        height="11"
                        y={dayIndex * 13}
                        fill={getCellColor(day)}
                        data-date={day.dateKey}
                        data-items={day.count}
                        onMouseEnter={(e) => handleMouseEnter(e, day)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                      />
                    ))}
                  </g>
                ))}

                {/* Month Labels */}
                {heatmapData.map((week, i) => {
                  const firstDay = week[0].date;
                  if (firstDay.getDate() <= 7 && (i === 0 || heatmapData[i-1][0].date.getMonth() !== firstDay.getMonth())) {
                     return (
                       <text key={`month-${i}`} x={i * 13} y="-5" className="month" style={{ fontSize: '10px', fill: '#767676' }}>
                         {getMonthName(firstDay.getMonth())}
                       </text>
                     );
                  }
                  return null;
                })}

                {/* Day Labels */}
                <text textAnchor="middle" className="wday" dx="-13" dy="22" style={{ fontSize: '9px', fill: '#767676' }}>Mon</text>
                <text textAnchor="middle" className="wday" dx="-13" dy="48" style={{ fontSize: '9px', fill: '#767676' }}>Wed</text>
                <text textAnchor="middle" className="wday" dx="-13" dy="74" style={{ fontSize: '9px', fill: '#767676' }}>Fri</text>
              </g>
            </svg>
          </div>

          {/* Footer */}
          {initialStats && (
          <div className="_UserActivityFrame_footer">
              <div className="_UserActivityFrame_countersRow">
                  <div className="_UserActivityFrame_counter">
                      <div className="_UserActivityFrame_counterValue">{initialStats.allTime.value}</div>
                      <div className="_UserActivityFrame_counterDescription">
                          {initialStats.allTime.desc}
                      </div>
                  </div>

                  <div className="_UserActivityFrame_counter">
                      <div className="_UserActivityFrame_counterValue">{initialStats.lastYear.value}</div>
                      <div className="_UserActivityFrame_counterDescription">
                          {initialStats.lastYear.desc}
                      </div>
                  </div>

                  <div className="_UserActivityFrame_counter">
                      <div className="_UserActivityFrame_counterValue">{initialStats.lastMonth.value}</div>
                      <div className="_UserActivityFrame_counterDescription">
                          {initialStats.lastMonth.desc}
                      </div>
                  </div>
              </div>

              <div className="_UserActivityFrame_countersRow">
                  <div className="_UserActivityFrame_counter">
                      <div className="_UserActivityFrame_counterValue">{initialStats.maxStreak.value}</div>
                      <div className="_UserActivityFrame_counterDescription">
                          {initialStats.maxStreak.desc}
                      </div>
                  </div>

                  <div className="_UserActivityFrame_counter">
                      <div className="_UserActivityFrame_counterValue">{initialStats.lastYearStreak.value}</div>
                      <div className="_UserActivityFrame_counterDescription">
                          {initialStats.lastYearStreak.desc}
                      </div>
                  </div>

                  <div className="_UserActivityFrame_counter">
                      <div className="_UserActivityFrame_counterValue">{initialStats.lastMonthStreak.value}</div>
                      <div className="_UserActivityFrame_counterDescription">
                          {initialStats.lastMonthStreak.desc}
                      </div>
                  </div>
              </div>
          </div>
          )}

        </div>
      </div>
    </>
  );
};

// --- Mount/Unmount Logic ---

let heatmapRoot: ReactDOM.Root | null = null;
let originalDisplay: string = '';
let scrapedStats: FooterStats | null = null;

const scrapeStats = (container: Element): FooterStats | null => {
  const counters = container.querySelectorAll('._UserActivityFrame_counter');
  if (counters.length < 6) return null;

  const getValue = (idx: number) => counters[idx].querySelector('._UserActivityFrame_counterValue')?.textContent || '';
  const getDesc = (idx: number) => counters[idx].querySelector('._UserActivityFrame_counterDescription')?.textContent?.trim() || '';

  return {
    allTime: { value: getValue(0), desc: getDesc(0) },
    lastYear: { value: getValue(1), desc: getDesc(1) },
    lastMonth: { value: getValue(2), desc: getDesc(2) },
    maxStreak: { value: getValue(3), desc: getDesc(3) },
    lastYearStreak: { value: getValue(4), desc: getDesc(4) },
    lastMonthStreak: { value: getValue(5), desc: getDesc(5) },
  };
};

export const mountNewMaxRatedHeatmap = () => {
  if (heatmapRoot) return;

  // Hide the original heatmap
  const originalContainer = document.querySelector('.roundbox.userActivityRoundBox');
  if (originalContainer) {
    // Scrape stats if not already scraped
    if (!scrapedStats) {
      scrapedStats = scrapeStats(originalContainer);
    }

    // Scrape year info
    const yearSelect = originalContainer.querySelector('select[name="yearSelect"]') as HTMLSelectElement;
    let initialYear = "last";
    let availableYears: YearOption[] = [{ value: "last", label: "Last Year" }];
    
    if (yearSelect) {
      initialYear = yearSelect.value;
      availableYears = Array.from(yearSelect.options).map(opt => ({
        value: opt.value,
        label: opt.text
      }));
    }

    originalDisplay = (originalContainer as HTMLElement).style.display;
    (originalContainer as HTMLElement).style.display = 'none';
    
    // Create container for our heatmap immediately after the original
    const container = document.createElement('div');
    container.id = 'cf-mentor-max-rated-heatmap-container';
    originalContainer.parentNode?.insertBefore(container, originalContainer.nextSibling);

    heatmapRoot = ReactDOM.createRoot(container);
    heatmapRoot.render(
      <NewMaxRatedHeatmap 
        initialStats={scrapedStats} 
        initialYear={initialYear}
        availableYears={availableYears}
      />
    );
  } else {
    console.log("Original heatmap container not found, cannot mount new heatmap.");
  }
};

export const unmountNewMaxRatedHeatmap = () => {
  if (heatmapRoot) {
    heatmapRoot.unmount();
    heatmapRoot = null;
  }

  const container = document.getElementById('cf-mentor-max-rated-heatmap-container');
  if (container) {
    container.remove();
  }

  // Restore original heatmap
  const originalContainer = document.querySelector('.roundbox.userActivityRoundBox');
  if (originalContainer) {
    (originalContainer as HTMLElement).style.display = originalDisplay;
  }
};
