import React from "react";
import { useAdvancedFilter } from "./AdvanceFilterPanel/hooks/useAdvanceFilter";

export const SettingsPanel: React.FC = () => {
  const {
    hideTags,
    setHideTags,
    hideSolved,
    setHideSolved,
    hideStatusColors,
    setHideStatusColors,
  } = useAdvancedFilter();

  return (
    <>
      <div className="caption titled">
        → Settings
        <div className="top-links"></div>
      </div>
      <div className="smaller" style={{ margin: "1em" }}>
        <input
          id="cf-mentor-hide-tag-status"
          type="checkbox"
          checked={!hideTags}
          onChange={() => setHideTags(!hideTags)}
        />
        <label
          htmlFor="cf-mentor-hide-tag-status"
          style={{ verticalAlign: "top", marginLeft: "0.5em", cursor: "pointer" }}
        >
          Show tags for unsolved problems
        </label>
      </div>
      <div className="smaller" style={{ margin: "1em" }}>
        <input
          id="cf-mentor-hide-solved-status"
          type="checkbox"
          checked={hideSolved}
          onChange={() => setHideSolved(!hideSolved)}
        />
        <label
          htmlFor="cf-mentor-hide-solved-status"
          style={{ verticalAlign: "top", marginLeft: "0.5em", cursor: "pointer" }}
        >
          Hide solved problems
        </label>
      </div>
      <div className="smaller" style={{ margin: "1em" }}>
        <input
          id="cf-mentor-hide-status-colors"
          type="checkbox"
          checked={!hideStatusColors}
          onChange={() => setHideStatusColors(!hideStatusColors)}
        />
        <label
          htmlFor="cf-mentor-hide-status-colors"
          style={{ verticalAlign: "top", marginLeft: "0.5em", cursor: "pointer" }}
        >
          Show status colors
        </label>
      </div>
    </>
  );
};
