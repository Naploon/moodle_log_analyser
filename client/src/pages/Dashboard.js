import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './Dashboard.css';
import { useCsv } from '../context/CsvContext';
import { useCsvData } from '../context/CsvDataContext';
import Navbar from '../components/Navbar';

// Register the necessary components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

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
  const [topUsersData, setTopUsersData] = useState({});
  const [bottomUsersData, setBottomUsersData] = useState({});

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

    // Calculate user activity from the original CSV data
    if (csvData.originalData && csvData.originalData.length > 0) {
      const userActivity = {};
      csvData.originalData.forEach(row => {
        const user = row['Kasutaja täisnimi'];
        if (!userActivity[user]) {
          userActivity[user] = 0;
        }
        userActivity[user]++;
      });

      // Sort users by activity
      const sortedUsers = Object.entries(userActivity).sort((a, b) => b[1] - a[1]);

      // Top 5 users
      const topUsers = sortedUsers.slice(0, 5);
      setTopUsersData({
        labels: topUsers.map(([user]) => user),
        datasets: [
          {
            label: 'Top 5 Users by Activity',
            data: topUsers.map(([, count]) => count),
            backgroundColor: '#4caf50',
          },
        ],
      });

      // Bottom 5 users
      const bottomUsers = sortedUsers.slice(-5);
      setBottomUsersData({
        labels: bottomUsers.map(([user]) => user),
        datasets: [
          {
            label: 'Bottom 5 Users by Activity',
            data: bottomUsers.map(([, count]) => count),
            backgroundColor: '#f44336',
          },
        ],
      });
    }
  }, [csvData.originalData]);

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
        {topUsersData.labels && topUsersData.labels.length > 0 && (
          <div className="chart-container unified-box">
            <h2 className="chart-title">Top 5 Users by Activity</h2>
            <Bar data={topUsersData} />
          </div>
        )}
        {bottomUsersData.labels && bottomUsersData.labels.length > 0 && (
          <div className="chart-container unified-box">
            <h2 className="chart-title">Bottom 5 Users by Activity</h2>
            <Bar data={bottomUsersData} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;