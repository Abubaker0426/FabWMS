import React, { createContext, useContext, useState, useMemo } from 'react';

// Define allowed scanner types for better type safety
const SCANNER_TYPES = {
  CAMERA: 'Camera Scanner',
  EXTERNAL: 'External Scanner',
  DOCUMENT: 'Document Scanner',
  FILE: 'File Scanner',
};

const ScannerContext = createContext(null); // Add explicit null default value

export const ScannerProvider = ({ children }) => {
  const [scannerType, setScannerType] = useState(SCANNER_TYPES.CAMERA);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    scannerType,
    setScannerType,
    SCANNER_TYPES // Expose types for validation
  }), [scannerType]);

  return (
    <ScannerContext.Provider value={value}>
      {children}
    </ScannerContext.Provider>
  );
};

export const useScanner = () => {
  const context = useContext(ScannerContext);
  if (!context) {
    throw new Error('useScanner must be used within a ScannerProvider');
  }
  return context;
};