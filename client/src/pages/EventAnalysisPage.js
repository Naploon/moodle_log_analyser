import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useCsvData } from '../context/CsvDataContext';
import { Line } from 'react-chartjs-2';
import dayjs from 'dayjs';
import './SharedStyles.css';
import './UserPage.css'; // Import styles for the search bar

function EventAnalysisPage() {
  const { csvData } = useCsvData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventLogCount, setEventLogCount] = useState(0);
  const [eventTimeframeData, setEventTimeframeData] = useState({});

  useEffect(() => {
    if (csvData.originalData && csvData.originalData.length > 0) {
      const events = csvData.originalData
        .filter(row => ['Test', 'Ülesanne'].includes(row['Komponent']))
        .map(row => row['Sündmuse kontekst']);
      setFilteredEvents(Array.from(new Set(events)));
    }
  }, [csvData.originalData]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setIsDropdownVisible(true);
  };

  const handleBlur = () => {
    setTimeout(() => setIsDropdownVisible(false), 100);
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setSearchTerm(event);
    setIsDropdownVisible(false);

    // Calculate the number of logs for the selected event
    const eventEntries = csvData.originalData.filter(row => row['Sündmuse kontekst'] === event);
    setEventLogCount(eventEntries.length);

    // Prepare data for the event-specific activity chart
    const timeframeCounts = {};
    eventEntries.forEach(row => {
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

    setEventTimeframeData({
      labels: timeframeLabels,
      datasets: [
        {
          label: 'Event Activity Over Time',
          data: timeframeDataPoints,
          fill: false,
          backgroundColor: '#3e95cd',
          borderColor: '#3e95cd',
        },
      ],
    });
  };

  const filteredEventContexts = filteredEvents.filter(event =>
    event.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <Navbar />
      <div className="main-content">
        <h1 className="page-title">Event Analysis View</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search for an event context..."
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsDropdownVisible(true)}
            onBlur={handleBlur}
            className="user-search-input"
          />
          {isDropdownVisible && (
            <div className="user-dropdown">
              {filteredEventContexts.map((event, index) => (
                <div
                  key={index}
                  className="user-option"
                  onMouseDown={() => handleEventSelect(event)}
                >
                  {event}
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedEvent && (
          <>
            <div className="metrics-container">
              <div className="metric-box unified-box">
                <div className="metric-label">Total Number of Logs</div>
                <div className="metric-number">{eventLogCount}</div>
              </div>
            </div>
            {eventTimeframeData.labels && eventTimeframeData.labels.length > 0 && (
              <div className="chart-container unified-box">
                <h2 className="chart-title">Activity Over Time</h2>
                <Line data={eventTimeframeData} />
              </div>
            )}
          </>
        )}
        {/* Add more content here as needed */}
      </div>
    </div>
  );
}

export default EventAnalysisPage;