import React, { createContext, useContext, useState, useEffect } from 'react';

const ConnectivityContext = createContext();

export const ConnectivityProvider = ({ children }) => {
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ConnectivityContext.Provider value={{ isOffline }}>
      {children}
    </ConnectivityContext.Provider>
  );
};

export const useConnectivity = () => useContext(ConnectivityContext);
