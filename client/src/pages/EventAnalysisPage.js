import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useCsvData } from '../context/CsvDataContext';
import { Line, Bar } from 'react-chartjs-2';
import ChartWithMenu from '../components/ChartWithMenu';
import dayjs from 'dayjs';
import './SharedStyles.css';
import './UserPage.css'; // Import styles for the search bar
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js and white-background plugin
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
Chart.register({
  id: 'whiteBackground',
  beforeDraw: chart => {
    const ctx = chart.ctx;
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
});

function EventAnalysisPage() {
  const { csvData } = useCsvData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventLogCount, setEventLogCount] = useState(0);
  const [eventTimeframeData, setEventTimeframeData] = useState({});
  const [distinctUsersForEvent, setDistinctUsersForEvent] = useState(0);
  const [avgEntriesPerUserForEvent, setAvgEntriesPerUserForEvent] = useState(0);
  const [eventTimeOfDayData, setEventTimeOfDayData] = useState({});
  const [eventDayOfWeekData, setEventDayOfWeekData] = useState({});
  const [topUsersForEventData, setTopUsersForEventData] = useState({});
  const [bottomUsersForEventData, setBottomUsersForEventData] = useState({});
  const [usersNotInteractingWithEvent, setUsersNotInteractingWithEvent] = useState(0);
  const [eventActivityIndex, setEventActivityIndex] = useState(0);

  useEffect(() => {
    if (csvData.originalData && csvData.originalData.length > 0) {
      const events = Array.from(new Set(
        csvData.originalData
          .filter(row => ['Test', 'Ülesanne'].includes(row['Komponent']))
          .map(row => row['Sündmuse kontekst'])
      ));
      setFilteredEvents(events);

      // Load the last selected event from localStorage
      const lastSelectedEvent = localStorage.getItem('lastSelectedEvent');
      if (lastSelectedEvent && events.includes(lastSelectedEvent)) {
        handleEventSelect(lastSelectedEvent);
      }
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

    localStorage.setItem('lastSelectedEvent', event);

    const eventEntries = csvData.originalData.filter(row => row['Sündmuse kontekst'] === event);
    setEventLogCount(eventEntries.length);

    const usersWhoInteractedWithEvent = new Set(eventEntries.map(row => row['Kasutaja täisnimi']).filter(Boolean));
    const distinctUserCountForEvent = usersWhoInteractedWithEvent.size;
    setDistinctUsersForEvent(distinctUserCountForEvent);

    if (distinctUserCountForEvent > 0) {
      setAvgEntriesPerUserForEvent(eventEntries.length / distinctUserCountForEvent);
    } else {
      setAvgEntriesPerUserForEvent(0);
    }

    // Get all unique users in the dataset
    const allUniqueUsersInDataset = Array.from(new Set(csvData.originalData.map(row => row['Kasutaja täisnimi']).filter(Boolean)));
    const totalUniqueUserCount = allUniqueUsersInDataset.length;
    
    // Calculate users not interacting with the event
    setUsersNotInteractingWithEvent(totalUniqueUserCount - distinctUserCountForEvent);

    // Calculate Activity Index
    if (totalUniqueUserCount > 0) {
      setEventActivityIndex((distinctUserCountForEvent / totalUniqueUserCount) * 100);
    } else {
      setEventActivityIndex(0);
    }

    // Prepare data for event activity by time of day
    const activityByHour = {};
    eventEntries.forEach(row => {
      const date = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
      if (date.isValid()) {
        const hour = date.format('HH:00');
        activityByHour[hour] = (activityByHour[hour] || 0) + 1;
      }
    });
    const hourlyLabels = Object.keys(activityByHour).sort();
    const hourlyDataPoints = hourlyLabels.map(label => activityByHour[label]);
    setEventTimeOfDayData({
      labels: hourlyLabels,
      datasets: [
        {
          label: 'Event Activity by Hour',
          data: hourlyDataPoints,
          fill: false,
          backgroundColor: '#FF6384',
          borderColor: '#FF6384',
        },
      ],
    });

    // Prepare data for event activity by day of the week
    const dayOfWeekCounts = Array(7).fill(0);
    eventEntries.forEach(row => {
      const date = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
      if (date.isValid()) {
        const dayOfWeek = date.day();
        dayOfWeekCounts[dayOfWeek]++;
      }
    });
    setEventDayOfWeekData({
      labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      datasets: [
        {
          label: 'Event Activity by Day of Week',
          data: dayOfWeekCounts,
          backgroundColor: '#36A2EB',
        },
      ],
    });

    // Prepare data for the event-specific activity and distinct users over timeframe chart
    const timeframeCounts = {};
    const distinctUsersPerDayForEvent = {};
    eventEntries.forEach(row => {
      const date = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
      const user = row['Kasutaja täisnimi'];
      if (date.isValid()) {
        const dateString = date.format('YYYY-MM-DD');
        timeframeCounts[dateString] = (timeframeCounts[dateString] || 0) + 1;

        if (user) {
          if (!distinctUsersPerDayForEvent[dateString]) {
            distinctUsersPerDayForEvent[dateString] = new Set();
          }
          distinctUsersPerDayForEvent[dateString].add(user);
        }
      }
    });

    const timeframeLabels = Object.keys(timeframeCounts).sort();
    const eventOccurrencesDataPoints = timeframeLabels.map(label => timeframeCounts[label]);
    const distinctUsersDataPoints = timeframeLabels.map(label =>
      distinctUsersPerDayForEvent[label] ? distinctUsersPerDayForEvent[label].size : 0
    );

    setEventTimeframeData({
      labels: timeframeLabels,
      datasets: [
        {
          label: 'Total Event Occurrences',
          data: eventOccurrencesDataPoints,
          fill: false,
          backgroundColor: '#4BC0C0',
          borderColor: '#4BC0C0',
          yAxisID: 'yEvents',
          type: 'line',
        },
        {
          label: 'Distinct Users for Event',
          data: distinctUsersDataPoints,
          fill: false,
          backgroundColor: '#FF9F40',
          borderColor: '#FF9F40',
          yAxisID: 'yUsers',
          type: 'bar',
        },
      ],
    });

    // Calculate user activity for the selected event (among those who interacted)
    const userActivityForEvent = {};
    eventEntries.forEach(row => {
      const user = row['Kasutaja täisnimi'];
      if (user) {
        userActivityForEvent[user] = (userActivityForEvent[user] || 0) + 1;
      }
    });

    // Top N users for this event (from interacting users)
    const sortedInteractingUsersByEventActivity = Object.entries(userActivityForEvent)
      .sort(([, countA], [, countB]) => countB - countA);

    const topN = 10;
    const topUsers = sortedInteractingUsersByEventActivity.slice(0, topN);
    setTopUsersForEventData({
      labels: topUsers.map(([user]) => user),
      datasets: [
        {
          label: `Top ${topN} Users for ${event}`,
          data: topUsers.map(([, count]) => count),
          backgroundColor: '#4caf50', // Green for top users
        },
      ],
    });

    // Bottom N users for this event (including users with zero activity for this event)
    const allUsersWithEventActivity = allUniqueUsersInDataset.map(user => ({
      name: user,
      count: userActivityForEvent[user] || 0, // Get count if exists, else 0
    }));

    // Sort all users by their activity for this event (ascending), then by name
    const sortedAllUsersByEventActivityAsc = allUsersWithEventActivity.sort((a, b) => {
      if (a.count !== b.count) {
        return a.count - b.count; // Sort by count ascending
      }
      return a.name.localeCompare(b.name); // Then by name ascending for tie-breaking
    });
    
    const bottomUsers = sortedAllUsersByEventActivityAsc.slice(0, topN);
    setBottomUsersForEventData({
      labels: bottomUsers.map(user => user.name),
      datasets: [
        {
          label: `Bottom ${topN} Users for ${event} (Incl. Zero)`,
          data: bottomUsers.map(user => user.count),
          backgroundColor: '#f44336', // Red for bottom users
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
              <div className="metric-box unified-box">
                <div className="metric-label">Distinct Users for Event</div>
                <div className="metric-number">{distinctUsersForEvent}</div>
              </div>
              <div className="metric-box unified-box">
                <div className="metric-label">Users Not Interacting</div>
                <div className="metric-number">{usersNotInteractingWithEvent}</div>
              </div>
              <div className="metric-box unified-box">
                <div className="metric-label">Avg. Entries per User</div>
                <div className="metric-number">{avgEntriesPerUserForEvent.toFixed(2)}</div>
              </div>
              <div className="metric-box unified-box">
                <div className="metric-label">Activity Index (%)</div>
                <div className="metric-number">{eventActivityIndex.toFixed(2)}%</div>
              </div>
            </div>
            
            {/* Row for Time of Day and Day of Week charts - RENDERED FIRST */}
            <div className="chart-row">
              {eventTimeOfDayData.labels && eventTimeOfDayData.labels.length > 0 && (
                <ChartWithMenu
                  ChartComponent={Line}
                  data={eventTimeOfDayData}
                  filename={`${selectedEvent.replace(/[\W_]+/g,"-")}-activity-by-hour`}
                  title="Event Activity by Time of Day"
                />
              )}
              {eventDayOfWeekData.labels && eventDayOfWeekData.labels.length > 0 && (
                <ChartWithMenu
                  ChartComponent={Bar}
                  data={eventDayOfWeekData}
                  filename={`${selectedEvent.replace(/[\W_]+/g,"-")}-activity-by-dayofweek`}
                  title="Event Activity by Day of Week"
                />
              )}
            </div>

            {/* Activity and Distinct Users Over Time chart - RENDERED SECOND and WRAPPED for full width */}
            {eventTimeframeData.labels && eventTimeframeData.labels.length > 0 && (
              <div className="timeframe-chart-wrapper"> {/* ADDED WRAPPER DIV */}
                <ChartWithMenu
                  ChartComponent={Line} 
                  data={eventTimeframeData}
                  filename={`${selectedEvent.replace(/[\W_]+/g,"-")}-activity-users-timeframe`}
                  title="Event Activity and Distinct Users Over Time"
                  options={{
                    scales: {
                      yEvents: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Number of Occurrences' }
                      },
                      yUsers: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Number of Distinct Users' },
                        grid: { drawOnChartArea: false },
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* Row for Top and Bottom Users for the event */}
            <div className="chart-row">
              {topUsersForEventData.labels && topUsersForEventData.labels.length > 0 && (
                <ChartWithMenu
                  ChartComponent={Bar}
                  data={topUsersForEventData}
                  filename={`${selectedEvent.replace(/[\W_]+/g,"-")}-top-users`}
                  title={`Top Users for "${selectedEvent}"`}
                  options={{ indexAxis: 'y', scales: { x: { beginAtZero: true } } }}
                />
              )}
              {bottomUsersForEventData.labels && bottomUsersForEventData.labels.length > 0 && (
                <ChartWithMenu
                  ChartComponent={Bar}
                  data={bottomUsersForEventData}
                  filename={`${selectedEvent.replace(/[\W_]+/g,"-")}-bottom-users`}
                  title={`Bottom Users for "${selectedEvent}"`}
                  options={{ indexAxis: 'y', scales: { x: { beginAtZero: true } } }}
                />
              )}
            </div>
          </>
        )}
        {/* Add more content here as needed */}
      </div>
    </div>
  );
}

export default EventAnalysisPage;