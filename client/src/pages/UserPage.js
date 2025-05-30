import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCsvData } from '../context/CsvDataContext';
import { useCsv } from '../context/CsvContext';
import Navbar from '../components/Navbar';
import { Line, Pie, Bar } from 'react-chartjs-2';
import ChartWithMenu from '../components/ChartWithMenu';
import './UserPage.css';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

function UserPage() {
  const navigate = useNavigate();
  const { isCsvUploaded } = useCsv();
  const { csvData, timeframe } = useCsvData();
  const [uniqueUsers, setUniqueUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [userActivity, setUserActivity] = useState(0);
  const [averageDailyActivities, setAverageDailyActivities] = useState(0);
  const [lastActivityTimestamp, setLastActivityTimestamp] = useState('');
  const [submissionEngagementScore, setSubmissionEngagementScore] = useState(0);
  const [materialEngagementScore, setMaterialEngagementScore] = useState(0);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [userChartData, setUserChartData] = useState({});
  const [componentDistributionData, setComponentDistributionData] = useState({});
  const [userDayOfWeekData, setUserDayOfWeekData] = useState({});
  const [userTimeframeData, setUserTimeframeData] = useState({});
  const [contextBarData, setContextBarData] = useState([]);

  const COMPONENT_COLORS = [
    '#FF6384', '#36A2EB', '#FFCE56',
    '#4BC0C0', '#9966FF', '#FF9F40'
  ];

  useEffect(() => {
    if (!isCsvUploaded) {
      navigate('/');
    }
  }, [isCsvUploaded, navigate]);

  useEffect(() => {
    if (csvData.originalData && csvData.originalData.length > 0) {
      const users = Array.from(new Set(csvData.originalData.map(row => row['Kasutaja täisnimi'] || '')));
      setUniqueUsers(users.filter(user => user));

      const lastSelectedUser = localStorage.getItem('lastSelectedUser');
      if (lastSelectedUser && users.includes(lastSelectedUser)) {
        handleUserSelect(lastSelectedUser);
      }
    }
  }, [csvData.originalData]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setIsDropdownVisible(true);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchTerm(user);
    setIsDropdownVisible(false);

    localStorage.setItem('lastSelectedUser', user);

    const userEntries = csvData.originalData.filter(row => row['Kasutaja täisnimi'] === user);
    setUserActivity(userEntries.length);

    const submissionEvents = userEntries.filter(entry =>
      entry['Komponent'] === 'Faili esitamine' || entry['Komponent'] === 'Test'
    );

    const distinctSubmissionContexts = new Set(
      submissionEvents.map(entry => entry['Sündmuse kontekst'])
    ).size;

    const totalPossibleContexts = Array.from(new Set(
      csvData.originalData
        .filter(entry =>
          entry['Komponent'] === 'Faili esitamine' ||
          entry['Komponent'] === 'Test'
        )
        .map(entry => entry['Sündmuse kontekst'])
    )).length;

    const normalizedScore = totalPossibleContexts > 0
      ? (distinctSubmissionContexts / totalPossibleContexts) * 100
      : 0;
    setSubmissionEngagementScore(normalizedScore);

    const dates = userEntries.map(row => dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss').format('YYYY-MM-DD'));
    const uniqueDates = new Set(dates);
    setAverageDailyActivities(userEntries.length / uniqueDates.size);

    const lastActivity = userEntries.reduce((latest, entry) => {
      const entryDate = dayjs(entry['Aeg'], 'D/M/YY, HH:mm:ss');
      return entryDate.isValid() && entryDate.isAfter(latest) ? entryDate : latest;
    }, dayjs(0));

    if (lastActivity.isValid()) {
      setLastActivityTimestamp(lastActivity.format('D/M/YYYY HH:mm:ss'));
    } else {
      setLastActivityTimestamp('Invalid Date');
    }

    const activityByHour = {};
    userEntries.forEach(entry => {
      const hour = dayjs(entry['Aeg'], 'D/M/YY, HH:mm:ss').format('HH:00');
      if (!activityByHour[hour]) {
        activityByHour[hour] = 0;
      }
      activityByHour[hour]++;
    });

    const labels = Object.keys(activityByHour).sort();
    const data = labels.map(label => activityByHour[label]);

    setUserChartData({
      labels,
      datasets: [
        {
          label: 'User Activity per Hour',
          data,
          fill: false,
          backgroundColor: '#4caf50',
          borderColor: '#4caf50',
        },
      ],
    });

    const componentCounts = {};
    userEntries.forEach(entry => {
      const component = entry['Komponent'];
      if (!componentCounts[component]) {
        componentCounts[component] = 0;
      }
      componentCounts[component]++;
    });

    const componentLabels = Object.keys(componentCounts);
    const componentData = componentLabels.map(label => componentCounts[label]);

    setComponentDistributionData({
      labels: componentLabels,
      datasets: [
        {
          data: componentData,
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
        },
      ],
    });

    const userData = csvData.originalData.filter(row => row['Kasutaja täisnimi'] === user);

    const dayOfWeekCounts = Array(7).fill(0); 

    userData.forEach(row => {
      const date = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
      if (date.isValid()) {
        const dayOfWeek = date.day(); 
        dayOfWeekCounts[dayOfWeek]++;
      }
    });

    setUserDayOfWeekData({
      labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      datasets: [
        {
          label: `Activity for ${user}`,
          data: dayOfWeekCounts,
          backgroundColor: '#4caf50',
        },
      ],
    });

    
    const timeframeCounts = {};
    const distinctContextsPerDay = {}; 

  
    let startDateObj, endDateObj;
    
    
    if (timeframe.startDate && timeframe.endDate) {
      
      startDateObj = dayjs(timeframe.startDate);
      endDateObj = dayjs(timeframe.endDate);
    } else {

      const userEntryDates = userEntries.map(entry => 
        dayjs(entry['Aeg'], 'D/M/YY, HH:mm:ss')
      ).filter(date => date.isValid());
      
      userEntryDates.sort((a, b) => a - b);
      
      if (userEntryDates.length > 0) {
        startDateObj = timeframe.startDate ? dayjs(timeframe.startDate) : userEntryDates[0];
        
        endDateObj = timeframe.endDate ? dayjs(timeframe.endDate) : userEntryDates[userEntryDates.length - 1];
      } else {
        // Fallback if no valid dates (rare case)
        startDateObj = dayjs().subtract(7, 'days');
        endDateObj = dayjs();
      }
    }

    let currentDate = startDateObj;
    while (currentDate.isSameOrBefore(endDateObj, 'day')) {
      const dateString = currentDate.format('YYYY-MM-DD');
      timeframeCounts[dateString] = 0;
      distinctContextsPerDay[dateString] = new Set();
      currentDate = currentDate.add(1, 'day');
    }

    
    userData.forEach(row => {
      const date = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
      const context = row['Sündmuse kontekst']; 

      if (date.isValid()) {
        const dateString = date.format('YYYY-MM-DD');
        
        if (date.isSameOrAfter(startDateObj, 'day') && date.isSameOrBefore(endDateObj, 'day')) {
          timeframeCounts[dateString]++;

          if (context) {
            distinctContextsPerDay[dateString].add(context);
          }
        }
      }
    });

    const timeframeLabels = Object.keys(timeframeCounts).sort();
    const activityDataPoints = timeframeLabels.map(label => timeframeCounts[label]);
    const distinctContextsDataPoints = timeframeLabels.map(label =>
      distinctContextsPerDay[label] ? distinctContextsPerDay[label].size : 0
    );

    setUserTimeframeData({
      labels: timeframeLabels,
      datasets: [
        {
          label: 'User Activity Over Time',
          data: activityDataPoints,
          fill: false,
          backgroundColor: '#3e95cd',
          borderColor: '#3e95cd',
          yAxisID: 'yActivity',
          type: 'line',
        },
        {
          label: 'Distinct Contexts per Day',
          data: distinctContextsDataPoints,
          backgroundColor: '#FF9F40', 
          borderColor: '#FF9F40',
          yAxisID: 'yContexts',
          type: 'bar',
        },
      ],
    });

    const createContextBarData = (componentName, idx) => {
      const allContexts = Array.from(
        new Set(
          csvData.originalData
            .filter(row => row['Komponent'] === componentName)
            .map(row => row['Sündmuse kontekst'])
        )
      );

      const contextCounts = allContexts.reduce((acc, ctx) => {
        acc[ctx] = 0;
        return acc;
      }, {});

      userData.forEach(entry => {
        if (entry['Komponent'] === componentName) {
          contextCounts[entry['Sündmuse kontekst']]++;
        }
      });

      return {
        labels: allContexts,
        datasets: [
          {
            label: `Sündmuse kontekst for ${componentName}`,
            data: allContexts.map(ctx => contextCounts[ctx]),
            backgroundColor: COMPONENT_COLORS[idx % COMPONENT_COLORS.length],
          },
        ],
      };
    };

    const uniqueComponents = [...new Set(userData.map(e => e['Komponent']))]
      .filter(component => component !== 'Süsteem');
    const allContextBarData = uniqueComponents
      .map((comp, idx) => createContextBarData(comp, idx));

    setContextBarData(allContextBarData);

 
    const materialEvents = userEntries.filter(entry =>
      ['Fail', 'Viki', 'URL', 'Leht'].includes(entry['Komponent'])
    );

    const distinctMaterialContexts = new Set(
      materialEvents.map(entry => entry['Sündmuse kontekst'])
    ).size;

    const totalPossibleMaterialContexts = Array.from(new Set(
      csvData.originalData
        .filter(entry => ['Fail', 'Viki', 'URL', 'Leht'].includes(entry['Komponent']))
        .map(entry => entry['Sündmuse kontekst'])
    )).length;
    
   
    const normalizedMaterial = totalPossibleMaterialContexts > 0
      ? (distinctMaterialContexts / totalPossibleMaterialContexts) * 100
      : 0;
    setMaterialEngagementScore(normalizedMaterial);
  };

  const handleBlur = () => {
    setTimeout(() => setIsDropdownVisible(false), 100); 
  };

  const filteredUsers = uniqueUsers.filter(user => user.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="user-page">
      <Navbar />
      <div className="main-content">
        <h1 className="page-title">User Page</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search for a user..."
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsDropdownVisible(true)} 
            onBlur={handleBlur}
            className="user-search-input"
          />
          {isDropdownVisible && (
            <div className="user-dropdown">
              {filteredUsers.sort().map(user => (
                <div
                  key={user}
                  className={`user-option ${user === selectedUser ? 'selected' : ''}`}
                  onMouseDown={() => handleUserSelect(user)} 
                >
                  {user}
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedUser && (
          <>
            <div className="metrics-container">
              <div className="metric-box unified-box">
                <div className="metric-label">Number of Events</div>
                <div className="metric-number">{userActivity}</div>
              </div>
              <div className="metric-box unified-box">
                <div className="metric-label">Average Daily Activities</div>
                <div className="metric-number">{averageDailyActivities.toFixed(2)}</div>
              </div>
              <div className="metric-box unified-box">
                <div className="metric-label">Last Activity Timestamp</div>
                <div className="metric-number">{lastActivityTimestamp}</div>
              </div>
              <div className="metric-box unified-box">
                <div className="metric-label">Submission Engagement (%)</div>
                <div className="metric-number">{submissionEngagementScore.toFixed(2)}%</div>
              </div>
              <div className="metric-box unified-box">
                <div className="metric-label">Material Engagement (%)</div>
                <div className="metric-number">{materialEngagementScore.toFixed(2)}%</div>
              </div>
            </div>
            <div className="chart-row">
              {userChartData.labels?.length > 0 && (
                <ChartWithMenu
                  ChartComponent={Line}
                  data={userChartData}
                  filename="user-activity-hour"
                  title="Activity Over Time of Day"
                />
              )}
              {userDayOfWeekData.labels?.length > 0 && (
                <ChartWithMenu
                  ChartComponent={Bar}
                  data={userDayOfWeekData}
                  filename="user-activity-dayofweek"
                  title="Activity Over Day of Week"
                />
              )}
            </div>
            {userTimeframeData.labels?.length > 0 && (
              <div className="timeframe-chart-wrapper">
                <ChartWithMenu
                  ChartComponent={Line}
                  data={userTimeframeData}
                  filename="user-activity-contexts-timeframe"
                  title="User Activity and Distinct Contexts Over Time"
                  options={{
                    scales: {
                      yActivity: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                          display: true,
                          text: 'Number of Activities'
                        }
                      },
                      yContexts: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                          display: true,
                          text: 'Number of Distinct Contexts'
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
            {componentDistributionData.labels?.length > 0 && (
              <ChartWithMenu
                ChartComponent={Pie}
                data={componentDistributionData}
                filename="user-component-distribution"
                title="Component Distribution"
                options={{
                  plugins: {
                    legend: {
                      position: 'right'
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.label || '';
                          const value = context.parsed;
                          
                          const data = context.dataset && Array.isArray(context.dataset.data) ? context.dataset.data : [];
                          const total = data.reduce((a, b) => {
                            const numA = Number(a);
                            const numB = Number(b);
                            return (isNaN(numA) ? 0 : numA) + (isNaN(numB) ? 0 : numB);
                          }, 0);
                          const percentage = total > 0 ? ((value / total) * 100).toFixed(2) + '%' : '0.00%';
                          return `${label}: ${percentage}`;
                        }
                      }
                    }
                  }
                }}
              />
            )}
            {contextBarData.length > 0 && <h2 className="page-title">Context Distribution by Component</h2>}
            {contextBarData.reduce((rows, chartConfig, index) => {
              if (index % 2 === 0) {
                rows.push([]);
              }

              rows[rows.length - 1].push(chartConfig);
              return rows;
            }, []).map((rowItems, rowIndex) => (
              <div key={rowIndex} className="chart-row">
                {rowItems.map((cfg, itemIndex) => (
                  <ChartWithMenu
                    key={`${rowIndex}-${itemIndex}`}
                    ChartComponent={Bar}
                    data={cfg}
                    filename={`user-context-${cfg.datasets[0].label}`}
                    title={cfg.datasets[0].label}
                    options={{ indexAxis: 'y', scales: { x: { beginAtZero: true } } }}
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

export default UserPage;