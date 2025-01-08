import React, { createContext, useState, useContext } from 'react';

const CsvContext = createContext();

export const useCsv = () => useContext(CsvContext);

export const CsvProvider = ({ children }) => {
  const [isCsvUploaded, setIsCsvUploaded] = useState(false);

  return (
    <CsvContext.Provider value={{ isCsvUploaded, setIsCsvUploaded }}>
      {children}
    </CsvContext.Provider>
  );
};
