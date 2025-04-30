import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import ChartWithMenu from '../components/ChartWithMenu';
import './Dashboard.css';
import { useCsv } from '../context/CsvContext';
import { useCsvData } from '../context/CsvDataContext';
import Navbar from '../components/Navbar';
import dayjs from 'dayjs';

function Dashboard() {
  const navigate = useNavigate();
  const { isCsvUploaded } = useCsv();
  const { csvData } = useCsvData();

  const [chartData, setChartData] = useState({});
  const [dayOfWeekData, setDayOfWeekData] = useState({});
  const [topUsersData, setTopUsersData] = useState({});
  const [bottomUsersData, setBottomUsersData] = useState({});
  const [timeframeData, setTimeframeData] = useState({});
  const [resourceContextData, setResourceContextData] = useState([]);
  const COMPONENT_COLORS = [
    '#FF6384', '#36A2EB', '#FFCE56',
    '#4BC0C0', '#9966FF', '#FF9F40'
  ];

  useEffect(() => {
    if (!isCsvUploaded) {
      navigate('/'); // Redirect to landing page if no CSV is uploaded
    }
  }, [isCsvUploaded, navigate]);

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

    // Calculate activity by day of the week
    if (csvData.originalData && csvData.originalData.length > 0) {
      const dayOfWeekCounts = Array(7).fill(0); // Initialize array for each day of the week

      csvData.originalData.forEach(row => {
        const date = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
        if (date.isValid()) {
          const dayOfWeek = date.day(); // Get day of the week (0 = Sunday, 6 = Saturday)
          dayOfWeekCounts[dayOfWeek]++;
        }
      });

      setDayOfWeekData({
        labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        datasets: [
          {
            label: 'Events per Day of the Week',
            data: dayOfWeekCounts,
            backgroundColor: '#4caf50',
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

      // Top 10 users
      const topUsers = sortedUsers.slice(0, 10);
      setTopUsersData({
        labels: topUsers.map(([user]) => user),
        datasets: [
          {
            label: 'Top 10 Users by Activity',
            data: topUsers.map(([, count]) => count),
            backgroundColor: '#4caf50',
          },
        ],
      });

      // Bottom 10 users
      const bottomUsers = sortedUsers.slice(-10);
      setBottomUsersData({
        labels: bottomUsers.map(([user]) => user),
        datasets: [
          {
            label: 'Bottom 10 Users by Activity',
            data: bottomUsers.map(([, count]) => count),
            backgroundColor: '#f44336',
          },
        ],
      });

      // Calculate activity over the entire timeframe by day
      const timeframeCounts = {};
      csvData.originalData.forEach(row => {
        const date = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
        if (date.isValid()) {
          const dateString = date.format('YYYY-MM-DD');
          if (!timeframeCounts[dateString]) {
            timeframeCounts[dateString] = 0;
          }
          timeframeCounts[dateString]++;
        }
      });

      const timeframeLabels = Object.keys(timeframeCounts).sort();
      const timeframeDataPoints = timeframeLabels.map(label => timeframeCounts[label]);

      setTimeframeData({
        labels: timeframeLabels,
        datasets: [
          {
            label: 'Events Over Timeframe',
            data: timeframeDataPoints,
            fill: false,
            backgroundColor: '#3e95cd',
            borderColor: '#3e95cd',
          },
        ],
      });
    }

    // 3) build "Sündmuse kontekst" distribution for EVERY Komponent
    if (csvData.originalData && csvData.originalData.length > 0) {
      const components = Array.from(
        new Set(csvData.originalData.map(r => r['Komponent']))
      );

      const resourceData = components.map((comp, idx) => {
        // tally up contexts
        const counts = {};
        csvData.originalData.forEach(row => {
          if (row['Komponent'] === comp) {
            const ctx = row['Sündmuse kontekst'];
            counts[ctx] = (counts[ctx] || 0) + 1;
          }
        });
        const labels = Object.keys(counts);
        const data   = labels.map(l => counts[l]);

        return {
          labels,
          datasets: [
            {
              label: `${comp} Context Distribution`,
              data,
              backgroundColor: COMPONENT_COLORS[idx % COMPONENT_COLORS.length],
            }
          ]
        };
      });

      setResourceContextData(resourceData);
    }
  }, [csvData.originalData]);

  return (
    <div className="dashboard">
      <Navbar />
      <div className="main-content">
        <h1 className="page-title">Data Dashboard</h1>
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
        <div className="chart-row">
          {/* 1) Hourly Line */}
          {chartData.labels?.length > 0 && (
            <ChartWithMenu
              ChartComponent={Line}
              data={chartData}
              filename="activity-hourly"
              title="Activity Over Time of Day"
            />
          )}
          {/* 2) Day-of-Week Bar */}
          {dayOfWeekData.labels?.length > 0 && (
            <ChartWithMenu
              ChartComponent={Bar}
              data={dayOfWeekData}
              filename="activity-dayofweek"
              title="Activity Over Day of Week"
            />
          )}
        </div>
        {/* 3) Timeframe Line */}
        {timeframeData.labels?.length > 0 && (
          <ChartWithMenu
            ChartComponent={Line}
            data={timeframeData}
            filename="activity-timeframe"
            title="Activity Over Timeframe"
          />
        )}
        <div className="chart-row">
          {/* 4) Top Users Bar */}
          {topUsersData.labels?.length > 0 && (
            <ChartWithMenu
              ChartComponent={Bar}
              data={topUsersData}
              filename="top-users"
              title="Top 10 Users by Activity"
            />
          )}
          {/* 5) Bottom Users Bar */}
          {bottomUsersData.labels?.length > 0 && (
            <ChartWithMenu
              ChartComponent={Bar}
              data={bottomUsersData}
              filename="bottom-users"
              title="Bottom 10 Users by Activity"
            />
          )}
        </div>
        {/* 4) render one Bar for each component */}
        {resourceContextData.length > 0 && (
          <>
            <h2 className="page-title">Context Distribution by Component</h2>
            <div className="chart-row">
              {resourceContextData.map((cfg, i) => (
                <ChartWithMenu
                  key={i}
                  ChartComponent={Bar}
                  data={cfg}
                  filename={`resource-${cfg.datasets[0].label}`}
                  title={cfg.datasets[0].label}
                  options={{
                    indexAxis: 'y',
                    scales: { x: { beginAtZero: true } }
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;