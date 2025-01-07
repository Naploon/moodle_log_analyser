import Papa from 'papaparse';

// Function to parse CSV file and execute a callback when done
export function parseCSV(file, onComplete, onError) {
  Papa.parse(file, {
    header: true, // CSV has headers
    complete: (results) => {
      const requiredHeaders = [
        "Aeg", "Kasutaja täisnimi", "Sündmuse kontekst", 
        "Komponent", "Sündmuse nimi", "Kirjeldus", 
        "Päritolu", "IP-aadress"
      ];

      const headers = results.meta.fields;
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

      if (missingHeaders.length > 0) {
        onError(`Missing headers: ${missingHeaders.join(', ')}`);
      } else {
        onComplete(results.data);
      }
    },
    error: (error) => {
      console.error('Error parsing CSV:', error);
      onError('Error parsing CSV file.');
    },
  });
}

// Function to process parsed data
export function processCSVData(data) {
  console.log('Processing CSV data:', data);
  // Example: Add a new field to each row
  return data.map(row => ({
    ...row,
    processed: true,
  }));
}

// Function to count distinct users
export function countDistinctUsers(data) {
  const userSet = new Set(data.map(row => row['Kasutaja täisnimi']));
  return userSet.size;
}

// Function to count distinct "Sündmuse kontekst" for a given "Komponent"
function countDistinctContextsForComponent(data, component) {
  const contextSet = new Set(
    data
      .filter(row => row['Komponent'] === component)
      .map(row => row['Sündmuse kontekst'])
  );
  return contextSet.size;
}

// Function to calculate all necessary metrics
export function calculateMetrics(data) {
  const distinctUserCount = countDistinctUsers(data);
  const distinctContextCounts = {
    Ülesanne: countDistinctContextsForComponent(data, 'Ülesanne'),
    Test: countDistinctContextsForComponent(data, 'Test'),
    Viki: countDistinctContextsForComponent(data, 'Viki'),
    Fail: countDistinctContextsForComponent(data, 'Fail'),
    URL: countDistinctContextsForComponent(data, 'URL'),
    Leht: countDistinctContextsForComponent(data, 'Leht'),
  };
  return { distinctUserCount, distinctContextCounts };
}
