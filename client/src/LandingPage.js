import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import { parseCSV, processCSVData, calculateMetrics, filterDataByTimeframe } from './processors/csvProcessor';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useCsv } from './context/CsvContext';
import { useCsvData } from './context/CsvDataContext';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

function LandingPage() {
  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { setIsCsvUploaded } = useCsv();
  const { setCsvData, setTimeframe } = useCsvData();

  const toggleHelpInfo = () => {
    setShowHelpInfo(!showHelpInfo);
  };

  const handleError = (error) => {
    alert(error);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    const isCsv = droppedFile &&
      (droppedFile.type === 'text/csv' ||
       droppedFile.name.toLowerCase().endsWith('.csv'));
    if (!isCsv) {
      alert('Please drop a valid CSV file.');
      return;
    }

    setFile(droppedFile);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      alert('Please select a valid CSV file.');
    }
  };

  const handleSetTimeframe = (start, end) => {
    setStartDate(start ? start.toDate() : null);
    setEndDate(end ? end.toDate() : null);
  };

  const setThisWeek = () => {
    handleSetTimeframe(dayjs().startOf('isoWeek'), dayjs().endOf('day'));
  };

  const setLastWeek = () => {
    const lastWeekStart = dayjs().subtract(1, 'week').startOf('isoWeek');
    const lastWeekEnd = dayjs().subtract(1, 'week').endOf('isoWeek');
    handleSetTimeframe(lastWeekStart, lastWeekEnd);
  };

  const setThisMonth = () => {
    handleSetTimeframe(dayjs().startOf('month'), dayjs().endOf('day'));
  };

  const setLast30Days = () => {
    handleSetTimeframe(dayjs().subtract(30, 'days').startOf('day'), dayjs().endOf('day'));
  };

  const handleResetDates = () => {
    handleSetTimeframe(null, null);
  };

  const handleProcessStart = () => {
    if (file) {
      parseCSV(file, (data) => {
        const filteredData = filterDataByTimeframe(
          data,
          startDate ? dayjs(startDate) : null,
          endDate ? dayjs(endDate) : null
        );
        const processedData = processCSVData(filteredData);
        const { distinctUserCount, distinctContextCounts } = calculateMetrics(filteredData);
        setCsvData({
          originalData: data,
          processedData,
          fileName: file.name
        });
        setTimeframe({
          startDate: startDate ? dayjs(startDate).toDate() : null,
          endDate: endDate ? dayjs(endDate).toDate() : null
        });
        setIsCsvUploaded(true);
        navigate('/dashboard');
      }, handleError);
    } else {
      alert('No CSV file selected.');
    }
  };

  return (
    <div className="landing-page">
      <h1 className="title">Moodle Log File Analyzer</h1>
      
      <div className="explanation-box">
        <p className="description">
          This tool helps educators and administrators analyze student activity in Moodle courses. 
          Upload your Moodle log file to visualize user activity patterns, identify engagement trends, 
          and get insights on course resource usage.
        </p>
        
        <div className="help-toggle" onClick={toggleHelpInfo}>
          <h3>Where to find Moodle log files {showHelpInfo ? '▲' : '▼'}</h3>
        </div>
        
        {showHelpInfo && (
          <div className="help-content">
            <ol>
              <li>Log in to your Moodle course as an administrator or teacher</li>
              <li>Navigate to the course you want to analyze</li>
              <li>In the administration block, click on "Ülevaated"</li>
              <li>Select "Logid" from the dropdown menu</li>
              <li>Now you can do some prefiltering, but it's not required. Click "Too soovitud logid"</li>
              <li>At the bottom of the page, select "Komaeraldusega fail (.csv)" and click "Laadi alla"</li>
              <li>Upload the downloaded CSV file here for analysis</li>
            </ol>
          </div>
        )}
      </div>
      
      <div
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current.click()}
      >
        {file ? <p>File: {file.name}</p> : <p>Drag and drop a CSV file here or click to select a file</p>}
      </div>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <div className="date-selectors-container">
        <div className="quick-select-buttons">
          <button onClick={setThisWeek}>This Week</button>
          <button onClick={setLastWeek}>Last Week</button>
          <button onClick={setThisMonth}>This Month</button>
          <button onClick={setLast30Days}>Last 30 Days</button>
          <button onClick={handleResetDates} className="reset-dates-button">Clear Dates</button>
        </div>
        <div className="date-picker">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Start Date"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            placeholderText="End Date"
          />
        </div>
      </div>
      <button onClick={handleProcessStart} className="process-button">Start Processing</button>
    </div>
  );
}

export default LandingPage;