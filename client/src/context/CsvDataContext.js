import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { processCSVData, calculateMetrics, filterDataByTimeframe } from '../processors/csvProcessor';
import dayjs from 'dayjs';

const CsvDataContext = createContext();
export const useCsvData = () => useContext(CsvDataContext);

export const CsvDataProvider = ({ children }) => {
  // 1) store only the raw upload + filename
  const [rawData, setRawData]     = useState([]);
  const [fileName, setFileName]   = useState('');

  // timeframe as before
  const [timeframe, setTimeframe] = useState({ startDate: null, endDate: null });

  // 2) includeTeachers toggle
  const [includeTeachers, setIncludeTeachers] = useState(true);

  // 3) derive teacherNames per your spreadsheet FILTER/UNIQUE
  const teacherNames = useMemo(() => {
    return Array.from(new Set(
      rawData
        .filter(r =>
          r['Kasutaja täisnimi'] &&
          r['Kasutaja täisnimi'] !== r['Mõjutatud kasutaja'] &&
          r['Sündmuse nimi'] !== 'Kasutajaprofiili on vaadatud' &&
          r['Mõjutatud kasutaja'] !== '-'
        )
        .map(r => r['Kasutaja täisnimi'])
    ));
  }, [rawData]);

  // 3.a) whenever we turn OFF includeTeachers, print out who gets excluded
  useEffect(() => {
    if (!includeTeachers) {
      console.log('Excluded teacher names:', teacherNames);
    }
  }, [includeTeachers, teacherNames]);

  // 4) apply the toggle to remove teachers
  const filteredOriginalData = useMemo(() => {
    if (includeTeachers) return rawData;
    return rawData.filter(r => !teacherNames.includes(r['Kasutaja täisnimi']));
  }, [rawData, includeTeachers, teacherNames]);

  // 5) apply timeframe filter to the teacher-filtered data
  const timeframeFilteredData = useMemo(() => {
    if (filteredOriginalData && timeframe) {
      return filterDataByTimeframe(
        filteredOriginalData,
        timeframe.startDate ? dayjs(timeframe.startDate) : null,
        timeframe.endDate ? dayjs(timeframe.endDate) : null
      );
    }
    return filteredOriginalData;
  }, [filteredOriginalData, timeframe]);

  // 6) process the data after both filters have been applied
  const processedData = useMemo(() => 
    processCSVData(timeframeFilteredData), 
    [timeframeFilteredData]
  );
  
  const { distinctUserCount, distinctContextCounts } = useMemo(
    () => calculateMetrics(timeframeFilteredData),
    [timeframeFilteredData]
  );

  return (
    <CsvDataContext.Provider value={{
      // Now csvData contains the data filtered by BOTH teachers AND timeframe
      csvData: {
        originalData: timeframeFilteredData,  // Changed from filteredOriginalData
        processedData,
        distinctUserCount,
        distinctContextCounts,
        fileName,
        teacherNames
      },
      // override to accept only raw rows + fileName
      setCsvData: ({ originalData, fileName }) => {
        setRawData(originalData || []);
        setFileName(fileName || '');
      },
      timeframe,
      setTimeframe,
      includeTeachers,
      setIncludeTeachers,
    }}>
      {children}
    </CsvDataContext.Provider>
  );
};
