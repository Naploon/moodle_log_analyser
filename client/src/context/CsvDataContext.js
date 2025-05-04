import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { processCSVData, calculateMetrics } from '../processors/csvProcessor';

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

  // 5) compute processedData & metrics on that filtered set
  const processedData = useMemo(() => processCSVData(filteredOriginalData), [filteredOriginalData]);
  const { distinctUserCount, distinctContextCounts } = useMemo(
    () => calculateMetrics(filteredOriginalData),
    [filteredOriginalData]
  );

  return (
    <CsvDataContext.Provider value={{
      // expose only filteredData & metrics
      csvData: {
        originalData: filteredOriginalData,
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
      setIncludeTeachers
    }}>
      {children}
    </CsvDataContext.Provider>
  );
};
