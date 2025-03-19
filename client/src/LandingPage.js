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
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { setIsCsvUploaded } = useCsv();
  const { setCsvData } = useCsvData();

  const handleError = (error) => {
    alert(error);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile);
      parseCSV(droppedFile, (data) => {
        const processedData = processCSVData(data);
        const { distinctUserCount, distinctContextCounts } = calculateMetrics(data);
        setCsvData({ originalData: data, processedData, distinctUserCount, distinctContextCounts });
        setIsCsvUploaded(true);
      }, handleError);
    } else {
      alert('Please drop a valid CSV file.');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      parseCSV(selectedFile, (data) => {
        const filteredData = filterDataByTimeframe(data, startDate ? dayjs(startDate) : null, endDate ? dayjs(endDate) : null);
        const processedData = processCSVData(filteredData);
        const { distinctUserCount, distinctContextCounts } = calculateMetrics(filteredData);
        setCsvData({ originalData: filteredData, processedData, distinctUserCount, distinctContextCounts });
        setIsCsvUploaded(true);
      }, handleError);
    } else {
      alert('Please select a valid CSV file.');
    }
  };

  const handleProcessStart = () => {
    if (file) {
      parseCSV(file, 
        (data) => {
          const filteredData = filterDataByTimeframe(data, startDate ? dayjs(startDate) : null, endDate ? dayjs(endDate) : null);
          const processedData = processCSVData(filteredData);
          const { distinctUserCount, distinctContextCounts } = calculateMetrics(filteredData);
          setCsvData({ originalData: filteredData, processedData, distinctUserCount, distinctContextCounts });
          navigate('/dashboard');
        },
        handleError
      );
    } else {
      alert('No CSV file selected.');
    }
  };

  return (
    <div className="landing-page">
      <h1 className="title">Moodle'i logifailide analüsaator</h1>
      <p className="description">
        See rakendus võimaldab teil analüüsida Moodle'i logifaile.
      </p>
      <div
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current.click()}
      >
        {file ? <p>File: {file.name}</p> : <p>Lohistage soovitud CSV fail siia või klõpsake siia, et valida fail</p>}
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
          placeholderText="Alguskuupäev"
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          placeholderText="Lõppkuupäev"
        />
      </div>
      <button onClick={handleProcessStart}>Start Processing</button>
    </div>
  );
}

export default LandingPage;