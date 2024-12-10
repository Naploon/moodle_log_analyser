import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import UserView from './views/UserView';
import EventAnalysisView from './views/EventAnalysisView';
import MaterialAnalysisView from './views/MaterialAnalysisView';
import './Dashboard.css';

function Dashboard() {
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
        <Routes>
          <Route path="/" element={<h1>Dashboard Overview</h1>} />
          <Route path="user-view" element={<UserView />} />
          <Route path="event-analysis" element={<EventAnalysisView />} />
          <Route path="material-analysis" element={<MaterialAnalysisView />} />
        </Routes>
      </div>
    </div>
  );
}

export default Dashboard;