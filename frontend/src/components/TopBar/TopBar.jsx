import React from 'react';
import { Navigation, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function TopBar({
  plannerOpen,
  onTogglePlanner,
  sidebarOpen,
  onToggleSidebar
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark"><span></span><i></i></div>
        <div>
          <div className="brand-name">Mission Mars <span>1.0</span></div>
          <div className="brand-sub">PLANETARY EXPLORER</div>
        </div>
      </div>
      <div className="top-divider" />
      <div className="header-label">
        <span className="live-dot" /> MARS TREK <span className="muted">/</span> SURFACE EXPLORER
      </div>
      <div className="top-right">
        <button
          type="button"
          className="mobile-drawer-toggle"
          onClick={onToggleSidebar}
          aria-expanded={sidebarOpen}
          aria-label={sidebarOpen ? 'Hide drawer' : 'Open drawer'}
          title={sidebarOpen ? 'Hide drawer' : 'Open drawer'}
        >
          {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
        </button>

        <button
          type="button"
          className={'planner-toggle ' + (plannerOpen ? 'active' : '')}
          onClick={onTogglePlanner}
          aria-expanded={plannerOpen}
          aria-controls="path-planner"
        >
          <Navigation size={13} /> <span>PLAN A PATH</span>
        </button>
        <span className="header-data">A PROJECT BY <b>CURIOUS MINDS</b></span>
      </div>
    </header>
  );
}
