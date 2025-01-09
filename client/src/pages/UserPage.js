import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCsvData } from '../context/CsvDataContext';
import { useCsv } from '../context/CsvContext';
import Navbar from '../components/Navbar';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import './UserPage.css';

dayjs.extend(customParseFormat);

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

  useEffect(() => {
    if (!isCsvUploaded) {
      navigate('/'); // Redirect to landing page if no CSV is uploaded
    }
  }, [isCsvUploaded, navigate]);

  useEffect(() => {
    if (csvData.originalData && csvData.originalData.length > 0) {
      const users = Array.from(new Set(csvData.originalData.map(row => row['Kasutaja täisnimi'] || '')));
      setUniqueUsers(users.filter(user => user));
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
        )}
      </div>
    </div>
  );
}

export default UserPage;