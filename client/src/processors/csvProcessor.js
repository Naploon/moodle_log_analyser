import Papa from 'papaparse';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);


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


export function processCSVData(data) {
  const eventCounts = {};
  let validCount = 0;
  let invalidCount = 0;

  data.forEach(row => {
    let timestamp = row['Aeg']; 

    
    if (timestamp) {
      timestamp = timestamp.trim();
    }

    
    if (!timestamp) {
      invalidCount++;
      return;
    }

    
    let date = dayjs(timestamp, 'D/M/YY, HH:mm:ss'); 
    if (!date.isValid()) {
      date = dayjs(timestamp, 'YYYY-MM-DD HH:mm:ss');
    }

    if (date.isValid()) {
      validCount++;
      const hour = date.format('HH:00'); 
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


export function countDistinctUsers(data) {
  
  const userSet = new Set(data
    .map(row => row['Kasutaja täisnimi'])
    .filter(user => user) 
  );
  return userSet.size;
}


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

export function filterDataByTimeframe(data, startDate, endDate) {
 
  if (!startDate && !endDate) {
    return data;
  }

  return data.filter(row => {
    const date = dayjs(row['Aeg'], 'D/M/YY, HH:mm:ss');
    if (!date.isValid()) {
      return false;
    }
    
    if (startDate && date.isBefore(startDate, 'day')) {
      return false;
    }
   
    if (endDate && date.isAfter(endDate, 'day')) {
      return false;
    }
    return true;
  });
}
