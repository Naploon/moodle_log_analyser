import React, { createContext, useState, useContext } from 'react';

export const CsvDataContext = createContext();

export const useCsvData = () => useContext(CsvDataContext);

export const CsvDataProvider = ({ children }) => {
  const [csvData, setCsvData] = useState({
    processedData: {},
    distinctUserCount: 0,
    distinctContextCounts: {},
  });

  return (
    <CsvDataContext.Provider value={{ csvData, setCsvData }}>
      {children}
    </CsvDataContext.Provider>
  );
};
