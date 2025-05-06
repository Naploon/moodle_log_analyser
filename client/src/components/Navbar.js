import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import { useCsvData } from '../context/CsvDataContext';
import dayjs from 'dayjs';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function Navbar() {
  const { timeframe, csvData, includeTeachers, setIncludeTeachers, setTimeframe } = useCsvData();
  const originalData = csvData?.originalData || [];
  const courseContext = useMemo(() => {
    const hit = originalData.find(r => r['Sündmuse nimi'] === 'Kursust on vaadatud.');
    return hit?.['Sündmuse kontekst'] || '';
  }, [originalData]);

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

  const resetTimeframe = () => {
    setTimeframe({ startDate: null, endDate: null });
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
        {courseContext && (
          <div className="filename-display">
            <p>{courseContext}</p>
          </div>
        )}

        <div className="timeframe-display">
          {displayTimeframe()}
          <button 
            className="reset-timeframe-btn" 
            onClick={resetTimeframe}
          >
            Reset to All Time
          </button>
        </div>

        <div className="date-picker-container">
          <DatePicker
            selected={timeframe.startDate}
            onChange={(date) => setTimeframe({ ...timeframe, startDate: date })}
            selectsStart
            startDate={timeframe.startDate}
            endDate={timeframe.endDate}
            placeholderText="Start Date"
            dateFormat="dd/MM/yyyy"
            popperPlacement="top-end"
            popperProps={{
              positionFixed: true
            }}
          />
          <DatePicker
            selected={timeframe.endDate}
            onChange={(date) => setTimeframe({ ...timeframe, endDate: date })}
            selectsEnd
            startDate={timeframe.startDate}
            endDate={timeframe.endDate}
            minDate={timeframe.startDate}
            placeholderText="End Date"
            dateFormat="dd/MM/yyyy"
            popperPlacement="top-end"
            popperProps={{
              positionFixed: true
            }}
          />
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
