import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { processCSVData, calculateMetrics, filterDataByTimeframe } from '../processors/csvProcessor';
import dayjs from 'dayjs';

const CsvDataContext = createContext();
export const useCsvData = () => useContext(CsvDataContext);

export const CsvDataProvider = ({ children }) => {

  const [rawData, setRawData]     = useState([]);
  const [fileName, setFileName]   = useState('');


  const [timeframe, setTimeframe] = useState({ startDate: null, endDate: null });
  const [includeTeachers, setIncludeTeachers] = useState(true);

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

  useEffect(() => {
    if (!includeTeachers) {
      console.log('Excluded teacher names:', teacherNames);
    }
  }, [includeTeachers, teacherNames]);

  const filteredOriginalData = useMemo(() => {
    if (includeTeachers) return rawData;
    return rawData.filter(r => !teacherNames.includes(r['Kasutaja täisnimi']));
  }, [rawData, includeTeachers, teacherNames]);

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
        originalData: timeframeFilteredData,
        processedData,
        distinctUserCount,
        distinctContextCounts,
        fileName,
        teacherNames
      },
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
