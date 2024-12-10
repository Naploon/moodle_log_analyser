import React, { useState, useRef } from 'react';
import './LandingPage.css';

function LandingPage() {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile);
      console.log('File dropped:', droppedFile);
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
      console.log('File selected:', selectedFile);
    } else {
      alert('Please select a valid CSV file.');
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current.click();
  };

  const handleProcessStart = () => {
    alert('Processing started!'); // Placeholder action
  };

  return (
    <div className="landing-page">
      <h1 className="title">Moodle Logfile Analyzer</h1>
      <p className="description">
        This application allows you to analyze Moodle log files. Drag and drop your CSV file below or click to select a file.
      </p>
      <div
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleDropZoneClick}
      >
        {file ? <p>File: {file.name}</p> : <p>Drag and drop your CSV file here or click to select</p>}
      </div>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
      <button onClick={handleProcessStart}>Start Processing</button>
    </div>
  );
}

export default LandingPage;