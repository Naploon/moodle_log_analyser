import Papa from 'papaparse';

// functioon, mis võtab CSV faili vastu ja teeb callbacki, kui on protsess on lõpetatud
export function parseCSV(file, onComplete) {
  Papa.parse(file, {
    header: true, // CSV on headerid
    complete: (results) => {
      onComplete(results.data);
    },
    error: (error) => {
      console.error('Error parsing CSV:', error);
    },
  });
}

// Example function to process parsed data
export function processCSVData(data) {
  // TODO: loogika tuleb siia
  console.log('Processing CSV data:', data);
  // Example: return processed data
  return data.map(row => ({
    ...row,
    processed: true, // Add a new field to each row
  }));
}