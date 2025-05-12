import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingPage from './LandingPage';
import Dashboard from './pages/Dashboard';
import UserPage from './pages/UserPage';
import EventAnalysisPage from './pages/EventAnalysisPage';
import MaterialAnalysisPage from './pages/MaterialAnalysisPage';
import './App.css';

// Calculate the basename based on the PUBLIC_URL env variable set by Create React App
// This will be "/moodle_log_analyser" in the production build, and "" locally
const basename = process.env.PUBLIC_URL || '';

function App() {
  return (
    <BrowserRouter basename={basename}>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/event-analysis" element={<EventAnalysisPage />} />
          <Route path="/material-analysis" element={<MaterialAnalysisPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
