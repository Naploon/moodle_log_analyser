import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './Dashboard.css';
import { useCsv } from '../context/CsvContext';
import { useCsvData } from '../context/CsvDataContext';
import Navbar from '../components/Navbar';

// Register the necessary components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Dashboard() {
  const navigate = useNavigate();
  const { isCsvUploaded } = useCsv();
  const { csvData } = useCsvData();

  useEffect(() => {
    if (!isCsvUploaded) {
      navigate('/'); // Redirect to landing page if no CSV is uploaded
    }
  }, [isCsvUploaded, navigate]);

  const [chartData, setChartData] = useState({});

  useEffect(() => {
    if (csvData.processedData && Object.keys(csvData.processedData).length > 0) {
      const labels = Object.keys(csvData.processedData).sort(); // Sort hours for proper order
      const data = labels.map(label => csvData.processedData[label]);

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
  }, [csvData.processedData]);

  return (
    <div className="dashboard">
      <Navbar />
      <div className="main-content">
        <h1 className="dashboard-title">Data Dashboard</h1>
        <div className="metrics-container">
          <div className="metric-box unified-box">
            <div className="metric-label">Distinct User Count</div>
            <div className="metric-number">{csvData.distinctUserCount}</div>
          </div>
          {Object.entries(csvData.distinctContextCounts).map(([component, count]) => (
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