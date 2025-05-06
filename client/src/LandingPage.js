import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import { parseCSV, processCSVData, calculateMetrics, filterDataByTimeframe } from './processors/csvProcessor';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useCsv } from './context/CsvContext';
import { useCsvData } from './context/CsvDataContext';
import dayjs from 'dayjs';

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
          originalData: filteredData,
          processedData,
          distinctUserCount,
          distinctContextCounts,
          fileName: file.name
        });
        setTimeframe({ startDate, endDate });
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
              <li>In the administration block, click on "Reports"</li>
              <li>Select "Logs" from the dropdown menu</li>
              <li>Set your desired filters (users, activities, time period, etc.)</li>
              <li>At the bottom of the page, click "Download" and select "CSV format"</li>
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
      <button onClick={handleProcessStart}>Start Processing</button>
    </div>
  );
}

export default LandingPage;