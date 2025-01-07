import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const location = useLocation();
  const distinctUserCount = location.state?.distinctUserCount || 0;
  const distinctContextCounts = location.state?.distinctContextCounts || {};

  return (
    <div className="dashboard">
      <nav className="sidebar">
        <ul>
          <li><Link to="/dashboard">Dashboard Overview</Link></li>
          <li><Link to="/dashboard/user-view">User View</Link></li>
          <li><Link to="/dashboard/event-analysis">Event Analysis</Link></li>
          <li><Link to="/dashboard/material-analysis">Material Analysis</Link></li>
        </ul>
      </nav>
      <div className="main-content">
        <h1 className="dashboard-title">Data Dashboard</h1>
        <div className="metrics-container">
          <div className="metric-box">
            <div className="metric-label">Distinct User Count</div>
            <div className="metric-number">{distinctUserCount}</div>
          </div>
          {Object.entries(distinctContextCounts).map(([component, count]) => (
            <div key={component} className="metric-box">
              <div className="metric-label">Distinct Context Count ({component})</div>
              <div className="metric-number">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;