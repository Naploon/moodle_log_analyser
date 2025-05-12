import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import ChartWithMenu from '../components/ChartWithMenu';
import './Dashboard.css';
import { useCsv } from '../context/CsvContext';
import { useCsvData } from '../context/CsvDataContext';
import Navbar from '../components/Navbar';
import dayjs from 'dayjs';
import { filterDataByTimeframe } from '../processors/csvProcessor';

function Dashboard() {
  const navigate = useNavigate();
  const { isCsvUploaded } = useCsv();
  const { csvData, timeframe } = useCsvData();

  const COMPONENT_COLORS = [
    '#FF6384', '#36A2EB', '#FFCE56',
    '#4BC0C0', '#9966FF', '#FF9F40'
  ];

  useEffect(() => {
    if (!isCsvUploaded) {
      navigate('/'); 
    }
  }, [isCsvUploaded, navigate]);

  
  const chartData = useMemo(() => {
    if (!csvData.processedData || Object.keys(csvData.processedData).length === 0) return {};
    const labels = Object.keys(csvData.processedData).sort();
    const data = labels.map(label => csvData.processedData[label]);
    return {
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
    };
  }, [csvData.processedData]);

  const dayOfWeekData = useMemo(() => {
    if (!csvData.originalData || csvData.originalData.length === 0) return {};
    const dayOfWeekCounts = Array(7).fill(0); 

    csvData.originalData.forEach(row => {
      const date = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
      if (date.isValid()) {
        const dayOfWeek = date.day(); 
        dayOfWeekCounts[dayOfWeek]++;
      }
    });

    return {
      labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      datasets: [
        {
          label: 'Events per Day of the Week',
          data: dayOfWeekCounts,
          backgroundColor: '#4caf50',
        },
      ],
    };
  }, [csvData.originalData]);

  const { topUsersData, bottomUsersData } = useMemo(() => {
    if (!csvData.originalData || csvData.originalData.length === 0) return { topUsersData: {}, bottomUsersData: {} };

    const userActivity = {};
    csvData.originalData.forEach(row => {
      const user = row['Kasutaja täisnimi'];
      if (!userActivity[user]) {
        userActivity[user] = 0;
      }
      userActivity[user]++;
    });

    
    const sortedUsers = Object.entries(userActivity)
        .filter(([user]) => user && user !== 'undefined' && user !== 'null')
        .sort((a, b) => b[1] - a[1]);

    
    const topUsers = sortedUsers.slice(0, 10);
    const topData = {
      labels: topUsers.map(([user]) => user),
      datasets: [
        {
          label: 'Top 10 Users by Activity',
          data: topUsers.map(([, count]) => count),
          backgroundColor: '#4caf50',
        },
      ],
    };

    
    const bottomUsers = sortedUsers.length <= 10 ? sortedUsers : sortedUsers.slice(-10);
    const bottomData = {
      labels: bottomUsers.map(([user]) => user),
      datasets: [
        {
          label: 'Bottom 10 Users by Activity',
          data: bottomUsers.map(([, count]) => count),
          backgroundColor: '#f44336',
        },
      ],
    };

    return { topUsersData: topData, bottomUsersData: bottomData };
  }, [csvData.originalData]);

  const timeframeData = useMemo(() => {
    if (!csvData.originalData || csvData.originalData.length === 0) return {};

    const timeframeCounts = {};
    const distinctUsersPerDayCounts = {};

    
    let startDateObj, endDateObj;

   
    if (timeframe.startDate && timeframe.endDate) {
      
      startDateObj = dayjs(timeframe.startDate);
      endDateObj = dayjs(timeframe.endDate);
    } else {
     
      const allEntryDates = csvData.originalData
        .map(row => dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss'))
        .filter(date => date.isValid());
      
      
      allEntryDates.sort((a, b) => a - b);
      
      if (allEntryDates.length > 0) {
        
        startDateObj = timeframe.startDate ? dayjs(timeframe.startDate) : allEntryDates[0];
        
        
        endDateObj = timeframe.endDate ? dayjs(timeframe.endDate) : allEntryDates[allEntryDates.length - 1];
      } else {
        
        startDateObj = dayjs().subtract(30, 'days');
        endDateObj = dayjs();
      }
    }

    
    let currentDate = startDateObj;
    while (currentDate.isSameOrBefore(endDateObj, 'day')) {
      const dateString = currentDate.format('YYYY-MM-DD');
      timeframeCounts[dateString] = 0;
      distinctUsersPerDayCounts[dateString] = new Set();
      currentDate = currentDate.add(1, 'day');
    }

    
    csvData.originalData.forEach(row => {
      const date = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
      const user = row['Kasutaja täisnimi'];

      if (date.isValid()) {
        const dateString = date.format('YYYY-MM-DD');
        
        
        if (date.isSameOrAfter(startDateObj, 'day') && date.isSameOrBefore(endDateObj, 'day')) {
          timeframeCounts[dateString]++;

          if (user) {
            distinctUsersPerDayCounts[dateString].add(user);
          }
        }
      }
    });

    const timeframeLabels = Object.keys(timeframeCounts).sort();
    const eventDataPoints = timeframeLabels.map(label => timeframeCounts[label]);
    const distinctUsersDataPoints = timeframeLabels.map(label => 
      distinctUsersPerDayCounts[label].size
    );

    return {
      labels: timeframeLabels,
      datasets: [
        {
          label: 'Events Over Timeframe',
          data: eventDataPoints,
          fill: false,
          backgroundColor: '#4BC0C0',
          borderColor: '#4BC0C0',     
          yAxisID: 'yEvents',
          type: 'line',
        },
        {
          label: 'Distinct Users Over Timeframe',
          data: distinctUsersDataPoints,
          fill: false,
          backgroundColor: '#FF9F40',
          borderColor: '#FF9F40',
          yAxisID: 'yUsers',
          type: 'bar',
        },
      ],
    };
  }, [csvData.originalData, timeframe]);

  const resourceContextData = useMemo(() => {
    if (!csvData.originalData || csvData.originalData.length === 0) return [];

    const components = Array.from(
      new Set(csvData.originalData.map(r => r['Komponent']))
    )
    
    .filter(component => component !== 'Süsteem');

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

    return resourceData;
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
        {/* 3) Timeframe Line - Combined Activity and Distinct Users */}
        {timeframeData.labels?.length > 0 && (
          <div className="timeframe-chart-wrapper">
            <ChartWithMenu
              ChartComponent={Line}
              data={timeframeData}
              filename="activity-and-users-timeframe"
              title="Events and Distinct Users Over Timeframe"
              options={{
                scales: {
                  yEvents: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: true,
                      text: 'Number of Events'
                    }
                  },
                  yUsers: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                      display: true,
                      text: 'Number of Distinct Users'
                    },
                    grid: {
                      drawOnChartArea: false,
                    },
                  }
                }
              }}
            />
          </div>
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
        {/* 4) render one Bar for each component - Max 2 per row */}
        {resourceContextData.length > 0 && (
          <>
            <h2 className="page-title">Context Distribution by Component</h2>
            {/* Map data into chunks of 2 for separate rows */}
            {resourceContextData.reduce((rows, chartConfig, index) => {
              // Start a new row every 2 charts
              if (index % 2 === 0) {
                rows.push([]);
              }
              // Add the current chart config to the latest row
              rows[rows.length - 1].push(chartConfig);
              return rows;
            }, []).map((rowItems, rowIndex) => (
              // Render a chart-row div for each row chunk
              <div key={rowIndex} className="chart-row">
                {rowItems.map((cfg, itemIndex) => (
                  <ChartWithMenu
                    key={`${rowIndex}-${itemIndex}`}
                    ChartComponent={Bar}
                    data={cfg}
                    filename={`resource-${cfg.datasets[0].label}`}
                    title={cfg.datasets[0].label}
                    options={{
                      indexAxis: 'y',
                      scales: { x: { beginAtZero: true } },
                    }}
                  />
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;