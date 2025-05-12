import React, { useState, useEffect } from 'react';
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
import './UserPage.css'; // For search bar styles

// Extend dayjs with plugins
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const MATERIAL_COMPONENTS = ['Fail', 'Viki', 'URL', 'Leht'];

function MaterialAnalysisPage() {
  const { csvData, timeframe } = useCsvData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMaterialContexts, setFilteredMaterialContexts] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedMaterialContext, setSelectedMaterialContext] = useState('');
  
  // Metrics states
  const [materialLogCount, setMaterialLogCount] = useState(0);
  const [distinctUsersForMaterial, setDistinctUsersForMaterial] = useState(0);
  const [usersNotInteractingWithMaterial, setUsersNotInteractingWithMaterial] = useState(0);
  const [avgEntriesPerUserForMaterial, setAvgEntriesPerUserForMaterial] = useState(0);
  const [materialActivityIndex, setMaterialActivityIndex] = useState(0);

  // Chart data states
  const [materialTimeframeData, setMaterialTimeframeData] = useState({});
  const [materialTimeOfDayData, setMaterialTimeOfDayData] = useState({});
  const [materialDayOfWeekData, setMaterialDayOfWeekData] = useState({});
  const [topUsersForMaterialData, setTopUsersForMaterialData] = useState({});
  const [zeroInteractionUsersData, setZeroInteractionUsersData] = useState([]);

  useEffect(() => {
    if (csvData.originalData && csvData.originalData.length > 0) {
      const materialContexts = Array.from(new Set(
        csvData.originalData
          .filter(row => MATERIAL_COMPONENTS.includes(row['Komponent']))
          .map(row => row['Sündmuse kontekst'])
          .filter(Boolean) // Ensure context is not null/empty
      ));
      setFilteredMaterialContexts(materialContexts);

      const lastSelected = localStorage.getItem('lastSelectedMaterialContext');
      if (lastSelected && materialContexts.includes(lastSelected)) {
        handleMaterialSelect(lastSelected);
      }
    }
  }, [csvData.originalData]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setIsDropdownVisible(true);
  };

  const handleBlur = () => {
    setTimeout(() => setIsDropdownVisible(false), 100); // Delay to allow click
  };

  const handleMaterialSelect = (materialContext) => {
    setSelectedMaterialContext(materialContext);
    setSearchTerm(materialContext);
    setIsDropdownVisible(false);
    localStorage.setItem('lastSelectedMaterialContext', materialContext);

    const materialEntries = csvData.originalData.filter(row => 
      row['Sündmuse kontekst'] === materialContext && MATERIAL_COMPONENTS.includes(row['Komponent'])
    );
    setMaterialLogCount(materialEntries.length);

    const usersWhoInteracted = new Set(materialEntries.map(row => row['Kasutaja täisnimi']).filter(Boolean));
    const distinctUserCountForMaterial = usersWhoInteracted.size;
    setDistinctUsersForMaterial(distinctUserCountForMaterial);

    setAvgEntriesPerUserForMaterial(
      distinctUserCountForMaterial > 0 ? materialEntries.length / distinctUserCountForMaterial : 0
    );

    // Get all unique users in the dataset and their last seen timestamp
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
    
    setUsersNotInteractingWithMaterial(totalUniqueUserCount - distinctUserCountForMaterial);
    setMaterialActivityIndex(
      totalUniqueUserCount > 0 ? (distinctUserCountForMaterial / totalUniqueUserCount) * 100 : 0
    );

    // Time of Day Chart Data
    const activityByHour = {};
    materialEntries.forEach(row => {
      const date = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
      if (date.isValid()) {
        const hour = date.format('HH:00');
        activityByHour[hour] = (activityByHour[hour] || 0) + 1;
      }
    });
    const hourlyLabels = Object.keys(activityByHour).sort();
    setMaterialTimeOfDayData({
      labels: hourlyLabels,
      datasets: [{
        label: 'Material Activity by Hour',
        data: hourlyLabels.map(label => activityByHour[label]),
        fill: false, backgroundColor: '#FF6384', borderColor: '#FF6384',
      }],
    });

    // Day of Week Chart Data
    const dayOfWeekCounts = Array(7).fill(0);
    materialEntries.forEach(row => {
      const date = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
      if (date.isValid()) dayOfWeekCounts[date.day()]++;
    });
    setMaterialDayOfWeekData({
      labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      datasets: [{
        label: 'Material Activity by Day of Week',
        data: dayOfWeekCounts, backgroundColor: '#36A2EB',
      }],
    });

    // Timeframe Chart Data (Activity & Distinct Users)
    const timeframeCounts = {};
    const distinctUsersPerDay = {};
    
    // First determine the date range to display
    let startDateObj, endDateObj;
    
    // Use the timeframe from context if available
    if (timeframe.startDate && timeframe.endDate) {
      // Both start and end dates are specified in the timeframe
      startDateObj = dayjs(timeframe.startDate);
      endDateObj = dayjs(timeframe.endDate);
    } else {
      // Find the first and last activity dates for this material
      const materialEntryDates = materialEntries.map(entry => 
        dayjs(entry['Aeg'], 'D/M/YY, HH:mm:ss')
      ).filter(date => date.isValid());
      
      // Sort dates chronologically
      materialEntryDates.sort((a, b) => a - b);
      
      if (materialEntryDates.length > 0) {
        // If timeframe.startDate is set, use it; otherwise use first entry date
        startDateObj = timeframe.startDate ? dayjs(timeframe.startDate) : materialEntryDates[0];
        
        // If timeframe.endDate is set, use it; otherwise use last entry date
        endDateObj = timeframe.endDate ? dayjs(timeframe.endDate) : materialEntryDates[materialEntryDates.length - 1];
      } else {
        // Fallback if no valid dates (rare case)
        startDateObj = dayjs().subtract(30, 'days');
        endDateObj = dayjs();
      }
    }

    // Initialize all days in the range with zero counts
    let currentDate = startDateObj;
    while (currentDate.isSameOrBefore(endDateObj, 'day')) {
      const dateString = currentDate.format('YYYY-MM-DD');
      timeframeCounts[dateString] = 0;
      distinctUsersPerDay[dateString] = new Set();
      currentDate = currentDate.add(1, 'day');
    }

    // Now populate the actual data
    materialEntries.forEach(row => {
      const date = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
      const user = row['Kasutaja täisnimi'];
      if (date.isValid()) {
        const dateString = date.format('YYYY-MM-DD');
        
        // Only count if the date is within our display range
        if (date.isSameOrAfter(startDateObj, 'day') && date.isSameOrBefore(endDateObj, 'day')) {
          // Count total material interactions
          timeframeCounts[dateString]++;
          
          if (user) {
            distinctUsersPerDay[dateString].add(user);
          }
        }
      }
    });

    const timeframeLabels = Object.keys(timeframeCounts).sort();
    
    setMaterialTimeframeData({
      labels: timeframeLabels,
      datasets: [
        {
          label: 'Total Material Interactions', 
          data: timeframeLabels.map(l => timeframeCounts[l]),
          fill: false, 
          backgroundColor: '#4BC0C0', 
          borderColor: '#4BC0C0',
          yAxisID: 'yInteractions', 
          type: 'line',
        },
        {
          label: 'Distinct Users for Material', 
          data: timeframeLabels.map(l => distinctUsersPerDay[l].size),
          fill: false, 
          backgroundColor: '#FF9F40', 
          borderColor: '#FF9F40',
          yAxisID: 'yUsers', 
          type: 'bar',
        },
      ],
    });

    // Top/Bottom Users Chart Data
    const userActivityForMaterial = {};
    materialEntries.forEach(row => {
      const user = row['Kasutaja täisnimi'];
      if (user) userActivityForMaterial[user] = (userActivityForMaterial[user] || 0) + 1;
    });

    const topN = 10;
    const sortedInteractingUsers = Object.entries(userActivityForMaterial)
      .sort(([, countA], [, countB]) => countB - countA);
    setTopUsersForMaterialData({
      labels: sortedInteractingUsers.slice(0, topN).map(([user]) => user),
      datasets: [{
        label: `Top ${topN} Users for ${materialContext}`,
        data: sortedInteractingUsers.slice(0, topN).map(([, count]) => count),
        backgroundColor: '#4caf50',
      }],
    });

    // NEW: Calculate users with zero interactions for the table
    const zeroInteractionUsers = allUniqueUsersArray
      .filter(user => !usersWhoInteracted.has(user)) // Use usersWhoInteracted calculated earlier
      .map(user => ({
        name: user,
        lastTimestamp: latestUserTimestamps[user] ? latestUserTimestamps[user].format('D/M/YY, HH:mm:ss') : 'N/A'
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

    setZeroInteractionUsersData(zeroInteractionUsers);
  };

  const displayableMaterialContexts = filteredMaterialContexts.filter(context =>
    context.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <Navbar />
      <div className="main-content">
        <h1 className="page-title">Material Analysis View</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search for a material context..."
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsDropdownVisible(true)}
            onBlur={handleBlur}
            className="user-search-input"
          />
          {isDropdownVisible && (
            <div className="user-dropdown">
              {displayableMaterialContexts.map((context, index) => (
                <div
                  key={index}
                  className="user-option"
                  onMouseDown={() => handleMaterialSelect(context)}
                >
                  {context}
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedMaterialContext && (
          <>
            <div className="metrics-container">
              <div className="metric-box unified-box">
                <div className="metric-label">Total Interactions</div>
                <div className="metric-number">{materialLogCount}</div>
              </div>
              <div className="metric-box unified-box">
                <div className="metric-label">Distinct Users for Material</div>
                <div className="metric-number">{distinctUsersForMaterial}</div>
              </div>
              <div className="metric-box unified-box">
                <div className="metric-label">Users Not Interacting</div>
                <div className="metric-number">{usersNotInteractingWithMaterial}</div>
              </div>
              <div className="metric-box unified-box">
                <div className="metric-label">Avg. Interactions per User</div>
                <div className="metric-number">{avgEntriesPerUserForMaterial.toFixed(2)}</div>
              </div>
              <div className="metric-box unified-box">
                <div className="metric-label">Material Activity Index (%)</div>
                <div className="metric-number">{materialActivityIndex.toFixed(2)}%</div>
              </div>
            </div>
            
            <div className="chart-row">
              {materialTimeOfDayData.labels?.length > 0 && (
                <ChartWithMenu
                  ChartComponent={Line}
                  data={materialTimeOfDayData}
                  filename={`${selectedMaterialContext.replace(/[\W_]+/g,"-")}-activity-by-hour`}
                  title="Material Activity by Time of Day"
                />
              )}
              {materialDayOfWeekData.labels?.length > 0 && (
                <ChartWithMenu
                  ChartComponent={Bar}
                  data={materialDayOfWeekData}
                  filename={`${selectedMaterialContext.replace(/[\W_]+/g,"-")}-activity-by-dayofweek`}
                  title="Material Activity by Day of Week"
                />
              )}
            </div>

            {materialTimeframeData.labels?.length > 0 && (
              <div className="timeframe-chart-wrapper">
                <ChartWithMenu
                  ChartComponent={Line} 
                  data={materialTimeframeData}
                  filename={`${selectedMaterialContext.replace(/[\W_]+/g,"-")}-activity-users-timeframe`}
                  title="Material Interactions and Distinct Users Over Time"
                  options={{
                    scales: {
                      yInteractions: {
                        type: 'linear', display: true, position: 'left',
                        title: { display: true, text: 'Number of Interactions' }
                      },
                      yUsers: {
                        type: 'linear', display: true, position: 'right',
                        title: { display: true, text: 'Number of Distinct Users' },
                        grid: { drawOnChartArea: false },
                      }
                    }
                  }}
                />
              </div>
            )}

            <div className="chart-row">
              {topUsersForMaterialData.labels?.length > 0 && (
                <ChartWithMenu
                  ChartComponent={Bar}
                  data={topUsersForMaterialData}
                  filename={`${selectedMaterialContext.replace(/[\W_]+/g,"-")}-top-users`}
                  title={`Top Users for "${selectedMaterialContext}"`}
                  options={{ indexAxis: 'y', scales: { x: { beginAtZero: true } } }}
                />
              )}
              {zeroInteractionUsersData.length > 0 && (
                <div className="metric-box unified-box zero-interaction-users-box">
                  <TableMenu
                    tableData={zeroInteractionUsersData}
                    filenameBase={selectedMaterialContext}
                  />
                  <div className="metric-label">Users with 0 Interactions for "{selectedMaterialContext}"</div>
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

export default MaterialAnalysisPage;