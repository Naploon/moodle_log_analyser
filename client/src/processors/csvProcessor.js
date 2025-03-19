import Papa from 'papaparse';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

// Function to parse CSV file and execute a callback when done
export function parseCSV(file, onComplete, onError) {
  Papa.parse(file, {
    header: true,
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
  const eventCounts = {};
  let validCount = 0;
  let invalidCount = 0;

  data.forEach(row => {
    let timestamp = row['Aeg']; // Assuming 'Aeg' is the timestamp column

    // Trim whitespace
    if (timestamp) {
      timestamp = timestamp.trim();
    }

    // Check for null or empty values
    if (!timestamp) {
      invalidCount++;
      return;
    }

    // Try parsing with both formats
    let date = dayjs(timestamp, 'D/M/YY, HH:mm:ss'); // Adjust format to handle single-digit day/month
    if (!date.isValid()) {
      date = dayjs(timestamp, 'YYYY-MM-DD HH:mm:ss');
    }

    if (date.isValid()) {
      validCount++;
      const hour = date.format('HH:00'); // Group by hour
      if (!eventCounts[hour]) {
        eventCounts[hour] = 0;
      }
      eventCounts[hour]++;
    } else {
      invalidCount++;
    }
  });

  console.log(`Valid timestamps: ${validCount}`);
  console.log(`Invalid timestamps: ${invalidCount}`);

  return eventCounts;
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

export function filterDataByTimeframe(data, startTime, endTime) {
  return data.filter(row => {
    const timestamp = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
    if (!timestamp.isValid()) {
      return false;
    }
    
    const isAfterStart = startTime ? timestamp.isAfter(startTime) : true;
    const isBeforeEnd = endTime ? timestamp.isBefore(endTime) : true;
    
    return isAfterStart && isBeforeEnd;
  });
}
