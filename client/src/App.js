import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './LandingPage';
import Dashboard from './pages/Dashboard';
import UserPage from './pages/UserPage';
import EventAnalysisPage from './pages/EventAnalysisPage';
import MaterialAnalysisPage from './pages/MaterialAnalysisPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/event-analysis" element={<EventAnalysisPage />} />
          <Route path="/material-analysis" element={<MaterialAnalysisPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
