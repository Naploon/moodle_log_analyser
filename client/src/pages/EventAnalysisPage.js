import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useCsvData } from '../context/CsvDataContext';
import { Line, Bar } from 'react-chartjs-2';
import ChartWithMenu from '../components/ChartWithMenu';
import TableMenu from '../components/TableMenu';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import './SharedStyles.css';
import './UserPage.css';
import './EventAnalysisPage.css';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

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

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

function EventAnalysisPage() {
  const { csvData, timeframe } = useCsvData();
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
  const [zeroInteractionUsersData, setZeroInteractionUsersData] = useState([]);

  useEffect(() => {
    if (csvData.originalData && csvData.originalData.length > 0) {
      const events = Array.from(new Set(
        csvData.originalData
          .filter(row => ['Test', 'Ülesanne'].includes(row['Komponent']))
          .map(row => row['Sündmuse kontekst'])
      ));
      setFilteredEvents(events);

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

    const allUniqueUsersInDataset = new Set();
    const latestUserTimestamps = {};
    csvData.originalData.forEach(row => {
      const user = row['Kasutaja täisnimi'];
      const timestampStr = row['Aeg'];
      if (user && timestampStr) {
        allUniqueUsersInDataset.add(user);
        const currentTimestamp = dayjs(timestampStr, 'D/M/YY, HH:mm:ss');
        if (currentTimestamp.isValid()) {
          if (!latestUserTimestamps[user] || currentTimestamp.isAfter(latestUserTimestamps[user])) {
            latestUserTimestamps[user] = currentTimestamp;
          }
        }
      }
    });
    const allUniqueUsersArray = Array.from(allUniqueUsersInDataset);
    const totalUniqueUserCount = allUniqueUsersArray.length;

    setUsersNotInteractingWithEvent(totalUniqueUserCount - distinctUserCountForEvent);

    if (totalUniqueUserCount > 0) {
      setEventActivityIndex((distinctUserCountForEvent / totalUniqueUserCount) * 100);
    } else {
      setEventActivityIndex(0);
    }

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

    const timeframeCounts = {};
    const distinctUsersPerDayForEvent = {};
    
    let startDateObj, endDateObj;
    
    if (timeframe.startDate && timeframe.endDate) {
      startDateObj = dayjs(timeframe.startDate);
      endDateObj = dayjs(timeframe.endDate);
    } else {
      const eventEntryDates = eventEntries.map(entry => 
        dayjs(entry['Aeg'], 'D/M/YY, HH:mm:ss')
      ).filter(date => date.isValid());
      
      eventEntryDates.sort((a, b) => a - b);
      
      if (eventEntryDates.length > 0) {
        startDateObj = timeframe.startDate ? dayjs(timeframe.startDate) : eventEntryDates[0];
        
        endDateObj = timeframe.endDate ? dayjs(timeframe.endDate) : eventEntryDates[eventEntryDates.length - 1];
      } else {
        startDateObj = dayjs().subtract(30, 'days');
        endDateObj = dayjs();
      }
    }

    let currentDate = startDateObj;
    while (currentDate.isSameOrBefore(endDateObj, 'day')) {
      const dateString = currentDate.format('YYYY-MM-DD');
      timeframeCounts[dateString] = 0;
      distinctUsersPerDayForEvent[dateString] = new Set();
      currentDate = currentDate.add(1, 'day');
    }

    eventEntries.forEach(row => {
      const date = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
      const user = row['Kasutaja täisnimi'];
      if (date.isValid()) {
        const dateString = date.format('YYYY-MM-DD');
        
        if (date.isSameOrAfter(startDateObj, 'day') && date.isSameOrBefore(endDateObj, 'day')) {
          timeframeCounts[dateString]++;

          if (user) {
            distinctUsersPerDayForEvent[dateString].add(user);
          }
        }
      }
    });

    const timeframeLabels = Object.keys(timeframeCounts).sort();
    const eventOccurrencesDataPoints = timeframeLabels.map(label => timeframeCounts[label]);
    const distinctUsersDataPoints = timeframeLabels.map(label =>
      distinctUsersPerDayForEvent[label].size
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

    const userActivityForEvent = {};
    eventEntries.forEach(row => {
      const user = row['Kasutaja täisnimi'];
      if (user) {
        userActivityForEvent[user] = (userActivityForEvent[user] || 0) + 1;
      }
    });

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
          backgroundColor: '#4caf50',
        },
      ],
    });

    const zeroInteractionUsers = allUniqueUsersArray
      .filter(user => !usersWhoInteractedWithEvent.has(user))
      .map(user => ({
        name: user,
        lastTimestamp: latestUserTimestamps[user] ? latestUserTimestamps[user].format('D/M/YY, HH:mm:ss') : 'N/A'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setZeroInteractionUsersData(zeroInteractionUsers);
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

            {eventTimeframeData.labels && eventTimeframeData.labels.length > 0 && (
              <div className="timeframe-chart-wrapper">
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
              {zeroInteractionUsersData.length > 0 && (
                <div className="metric-box unified-box zero-interaction-users-box">
                  <TableMenu 
                    tableData={zeroInteractionUsersData} 
                    filenameBase={selectedEvent}
                  />
                  <div className="metric-label">Users with 0 Interactions for "{selectedEvent}"</div>
                  <div className="user-table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>User Name</th>
                          <th>Last Activity Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {zeroInteractionUsersData.map((user, index) => (
                          <tr key={index}>
                            <td>{user.name}</td>
                            <td>{user.lastTimestamp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EventAnalysisPage;