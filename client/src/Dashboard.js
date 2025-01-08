import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './Dashboard.css';
import { useCsv } from './context/CsvContext';

// Register the necessary components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCsvUploaded } = useCsv();
  const distinctUserCount = location.state?.distinctUserCount || 0;
  const distinctContextCounts = location.state?.distinctContextCounts || {};
  const processedData = location.state?.processedData || {};

  useEffect(() => {
    if (!isCsvUploaded) {
      navigate('/'); // Redirect to landing page if no CSV is uploaded
    }
  }, [isCsvUploaded, navigate]);

  const [chartData, setChartData] = useState({});

  useEffect(() => {
    if (processedData && Object.keys(processedData).length > 0) {
      const labels = Object.keys(processedData).sort(); // Sort hours for proper order
      const data = labels.map(label => processedData[label]);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Events per Hour',
            data,
            fill: false,
            backgroundColor: '#f04770',
            borderColor: '#f78c6a',
          },
        ],
      });
    }
  }, [processedData]);

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
          <div className="metric-box unified-box">
            <div className="metric-label">Distinct User Count</div>
            <div className="metric-number">{distinctUserCount}</div>
          </div>
          {Object.entries(distinctContextCounts).map(([component, count]) => (
            <div key={component} className="metric-box unified-box">
              <div className="metric-label">Distinct Context Count ({component})</div>
              <div className="metric-number">{count}</div>
            </div>
          ))}
        </div>
        {chartData.labels && chartData.labels.length > 0 && (
          <div className="chart-container unified-box">
            <h2 className="chart-title">Activity Over Time of Day</h2>
            <Line data={chartData} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;