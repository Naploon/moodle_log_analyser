import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import { parseCSV, processCSVData, calculateMetrics } from './processors/csvProcessor';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function LandingPage() {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile);
      parseCSV(droppedFile, (data) => {
        const processedData = processCSVData(data);
        setCsvData(processedData);
      });
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
        const processedData = processCSVData(data);
        setCsvData(processedData);
      });
    } else {
      alert('Please select a valid CSV file.');
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current.click();
  };

  const handleProcessStart = () => {
    if (file) {
      parseCSV(file, 
        (data) => {
          const processedData = processCSVData(data);
          const { distinctUserCount, distinctContextCounts } = calculateMetrics(data);
          console.log('Processed data:', processedData);
          console.log('Distinct user count:', distinctUserCount);
          console.log('Distinct context counts:', distinctContextCounts);
          navigate('/dashboard', { state: { processedData, distinctUserCount, distinctContextCounts } });
        },
        (error) => {
          alert(error);
        }
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
        onClick={handleDropZoneClick}
      >
        {file ? <p>File: {file.name}</p> : <p>Lohistage soovitud CSV fail siia või klõpsake siia, et valida fail</p>}
      </div>
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
          minDate={startDate}
          placeholderText="Lõppkuupäev"
        />
      </div>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
      <button onClick={handleProcessStart}>Process CSV</button>
    </div>
  );
}

export default LandingPage;