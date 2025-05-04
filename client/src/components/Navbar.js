import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import { useCsvData } from '../context/CsvDataContext';
import dayjs from 'dayjs';

function Navbar() {
  const { timeframe, csvData, includeTeachers, setIncludeTeachers } = useCsvData();
  const fileName = csvData?.fileName;

  const handleCheckboxChange = () => {
    setIncludeTeachers(!includeTeachers);
  };

  const formatDate = (date) => date ? dayjs(date).format('D/M/YYYY') : '...';

  const displayTimeframe = () => {
    const { startDate, endDate } = timeframe;
    if (!startDate && !endDate) {
      return 'Timeframe: All time';
    }
    return `Timeframe: ${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <div className="navbar">
      <ul>
        <li><Link to="/dashboard">Dashboard Overview</Link></li>
        <li><Link to="/user">User Page</Link></li>
        <li><Link to="/event-analysis">Event Analysis</Link></li>
        <li><Link to="/material-analysis">Material Analysis</Link></li>
      </ul>

      <div className="navbar-bottom">
        {fileName && (
          <div className="filename-display">
            <p>File: {fileName}</p>
          </div>
        )}

        <div className="timeframe-display">
          <p>{displayTimeframe()}</p>
        </div>

        <div className="checkbox-container">
          <label>
            <input
              type="checkbox"
              checked={includeTeachers}
              onChange={handleCheckboxChange}
            />
            Include Teachers
          </label>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
