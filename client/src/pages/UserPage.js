import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCsvData } from '../context/CsvDataContext';
import { useCsv } from '../context/CsvContext';
import Navbar from '../components/Navbar';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Line, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import './UserPage.css';

dayjs.extend(customParseFormat);

// Register the necessary components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

function UserPage() {
  const navigate = useNavigate();
  const { isCsvUploaded } = useCsv();
  const { csvData } = useCsvData();
  const [uniqueUsers, setUniqueUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [userActivity, setUserActivity] = useState(0);
  const [averageDailyActivities, setAverageDailyActivities] = useState(0);
  const [lastActivityTimestamp, setLastActivityTimestamp] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [userChartData, setUserChartData] = useState({});
  const [componentDistributionData, setComponentDistributionData] = useState({});

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
            </div>
            {userChartData.labels && userChartData.labels.length > 0 && (
              <div className="chart-container unified-box">
                <h2 className="chart-title">User Activity Over Time of Day</h2>
                <Line data={userChartData} />
              </div>
            )}
            {componentDistributionData.labels && componentDistributionData.labels.length > 0 && (
              <div className="chart-container unified-box">
                <h2 className="chart-title">Component Distribution</h2>
                <Pie data={componentDistributionData} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default UserPage;