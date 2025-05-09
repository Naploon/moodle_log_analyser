import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCsvData } from '../context/CsvDataContext';
import { useCsv } from '../context/CsvContext';
import Navbar from '../components/Navbar';
import { Line, Pie, Bar } from 'react-chartjs-2';
import ChartWithMenu from '../components/ChartWithMenu';
import './UserPage.css';

//introduce dayjs & the plugins
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

// Extend dayjs with the plugins
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

  // palette for each "komponent" chart
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
    if (csvData.originalData && csvData.originalData.length > 0) {
      const users = Array.from(new Set(csvData.originalData.map(row => row['Kasutaja täisnimi'] || '')));
      setUniqueUsers(users.filter(user => user));

      // Load the last selected user from localStorage
      const lastSelectedUser = localStorage.getItem('lastSelectedUser');
      if (lastSelectedUser && users.includes(lastSelectedUser)) {
        handleUserSelect(lastSelectedUser);
      }
    }
  }, [csvData.originalData]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setIsDropdownVisible(true); // Show dropdown when typing
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchTerm(user);
    setIsDropdownVisible(false); // Hide dropdown when a user is selected

    // Save the selected user to localStorage
    localStorage.setItem('lastSelectedUser', user);

    const userEntries = csvData.originalData.filter(row => row['Kasutaja täisnimi'] === user);
    setUserActivity(userEntries.length);

    // 1) Filter down to file‐submission & test events
    const submissionEvents = userEntries.filter(entry =>
      entry['Komponent'] === 'Faili esitamine' || entry['Komponent'] === 'Test'
    );
    // 2) Count distinct contexts for this user
    const distinctSubmissionContexts = new Set(
      submissionEvents.map(entry => entry['Sündmuse kontekst'])
    ).size;

    // 3) Compute total distinct contexts across all users
    const totalPossibleContexts = Array.from(new Set(
      csvData.originalData
        .filter(entry =>
          entry['Komponent'] === 'Faili esitamine' ||
          entry['Komponent'] === 'Test'
        )
        .map(entry => entry['Sündmuse kontekst'])
    )).length;

    // 4) Normalize and multiply by 100
    const normalizedScore = totalPossibleContexts > 0
      ? (distinctSubmissionContexts / totalPossibleContexts) * 100
      : 0;
    setSubmissionEngagementScore(normalizedScore);

    // Calculate average daily activities
    const dates = userEntries.map(row => dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss').format('YYYY-MM-DD'));
    const uniqueDates = new Set(dates);
    setAverageDailyActivities(userEntries.length / uniqueDates.size);

    // Find the last activity timestamp
    const lastActivity = userEntries.reduce((latest, entry) => {
      const entryDate = dayjs(entry['Aeg'], 'D/M/YY, HH:mm:ss');
      return entryDate.isValid() && entryDate.isAfter(latest) ? entryDate : latest;
    }, dayjs(0));

    // Check if the date is valid
    if (lastActivity.isValid()) {
      setLastActivityTimestamp(lastActivity.format('D/M/YYYY HH:mm:ss'));
    } else {
      setLastActivityTimestamp('Invalid Date');
    }

    // Prepare data for the user-specific activity chart
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

    // Prepare data for the component distribution pie chart
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

    // Filter data for the selected user
    const userData = csvData.originalData.filter(row => row['Kasutaja täisnimi'] === user);

    // Calculate activity by day of the week for the user
    const dayOfWeekCounts = Array(7).fill(0); // Initialize array for each day of the week

    userData.forEach(row => {
      const date = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
      if (date.isValid()) {
        const dayOfWeek = date.day(); // Get day of the week (0 = Sunday, 6 = Saturday)
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

    // Calculate activity over time (day interval) and distinct contexts per day
    const timeframeCounts = {};
    const distinctContextsPerDay = {}; // To store sets of contexts per day

    // First determine the date range to display
    let startDateObj, endDateObj;
    
    // Use the timeframe from the component's top level
    if (timeframe.startDate && timeframe.endDate) {
      // Both start and end dates are specified in the timeframe
      startDateObj = dayjs(timeframe.startDate);
      endDateObj = dayjs(timeframe.endDate);
    } else {
      // Find the first and last activity dates for this user
      const userEntryDates = userEntries.map(entry => 
        dayjs(entry['Aeg'], 'D/M/YY, HH:mm:ss')
      ).filter(date => date.isValid());
      
      // Sort dates chronologically
      userEntryDates.sort((a, b) => a - b);
      
      if (userEntryDates.length > 0) {
        // If timeframe.startDate is set, use it; otherwise use first entry date
        startDateObj = timeframe.startDate ? dayjs(timeframe.startDate) : userEntryDates[0];
        
        // If timeframe.endDate is set, use it; otherwise use last entry date
        endDateObj = timeframe.endDate ? dayjs(timeframe.endDate) : userEntryDates[userEntryDates.length - 1];
      } else {
        // Fallback if no valid dates (rare case)
        startDateObj = dayjs().subtract(7, 'days');
        endDateObj = dayjs();
      }
    }

    // Initialize all days in the range with zero counts
    let currentDate = startDateObj;
    while (currentDate.isSameOrBefore(endDateObj, 'day')) {
      const dateString = currentDate.format('YYYY-MM-DD');
      timeframeCounts[dateString] = 0;
      distinctContextsPerDay[dateString] = new Set();
      currentDate = currentDate.add(1, 'day');
    }

    // Now populate the actual data
    userData.forEach(row => {
      const date = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
      const context = row['Sündmuse kontekst']; // Get the event context

      if (date.isValid()) {
        const dateString = date.format('YYYY-MM-DD');
        
        // Only count if the date is within our display range
        if (date.isSameOrAfter(startDateObj, 'day') && date.isSameOrBefore(endDateObj, 'day')) {
          // Count total activity (increment the initialized zero)
          timeframeCounts[dateString]++;

          // Collect distinct contexts
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

    // Function to create context bar data for a given component
    const createContextBarData = (componentName, idx) => {
      // 1) Gather all possible contexts for this component from the full CSV
      const allContexts = Array.from(
        new Set(
          csvData.originalData
            .filter(row => row['Komponent'] === componentName)
            .map(row => row['Sündmuse kontekst'])
        )
      );

      // 2) Initialize every context's count to zero
      const contextCounts = allContexts.reduce((acc, ctx) => {
        acc[ctx] = 0;
        return acc;
      }, {});

      // 3) Tally up only the user's entries
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

    // Generate context bar data for each unique component
    const uniqueComponents = [...new Set(userData.map(e => e['Komponent']))]
      .filter(component => component !== 'Süsteem');
    const allContextBarData = uniqueComponents
      .map((comp, idx) => createContextBarData(comp, idx));

    setContextBarData(allContextBarData);

    // —— MATERIAL ENGAGEMENT ——
    // 1) Filter down to material components
    const materialEvents = userEntries.filter(entry =>
      ['Fail', 'Viki', 'URL', 'Leht'].includes(entry['Komponent'])
    );
    // 2) Count distinct material contexts for this user
    const distinctMaterialContexts = new Set(
      materialEvents.map(entry => entry['Sündmuse kontekst'])
    ).size;
    // 3) Compute total possible material contexts across all data
    const totalPossibleMaterialContexts = Array.from(new Set(
      csvData.originalData
        .filter(entry => ['Fail', 'Viki', 'URL', 'Leht'].includes(entry['Komponent']))
        .map(entry => entry['Sündmuse kontekst'])
    )).length;
    // 4) Normalize & store as percentage
    const normalizedMaterial = totalPossibleMaterialContexts > 0
      ? (distinctMaterialContexts / totalPossibleMaterialContexts) * 100
      : 0;
    setMaterialEngagementScore(normalizedMaterial);
  };

  const handleBlur = () => {
    setTimeout(() => setIsDropdownVisible(false), 100); // Delay to allow click event to register
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
            onFocus={() => setIsDropdownVisible(true)} // Show dropdown on focus
            onBlur={handleBlur}
            className="user-search-input"
          />
          {isDropdownVisible && (
            <div className="user-dropdown">
              {filteredUsers.map(user => (
                <div
                  key={user}
                  className={`user-option ${user === selectedUser ? 'selected' : ''}`}
                  onMouseDown={() => handleUserSelect(user)} // Use onMouseDown to handle selection
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
                    }
                  }
                }}
              />
            )}
            <div className="chart-row">
              {contextBarData.map((cfg, idx) => (
                <ChartWithMenu
                  key={idx}
                  ChartComponent={Bar}
                  data={cfg}
                  filename={`user-context-${cfg.datasets[0].label}`}
                  title={cfg.datasets[0].label}
                  options={{ indexAxis: 'y', scales: { x: { beginAtZero: true } } }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default UserPage;