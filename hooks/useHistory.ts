
import { useState, useEffect, useCallback } from 'react';
import { HistoryItem, View, QueryResult, Language } from '../types';

const HISTORY_STORAGE_KEY = 'swasthya-homeo-history';

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
      setHistory([]);
    }
  }, []);

  const saveHistory = (newHistory: HistoryItem[]) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.error("Failed to save history to localStorage", error);
    }
  };

  const addHistoryItem = useCallback((item: {
    type: View.DIAGNOSIS | View.MEDICINE_LOOKUP;
    transcript: string;
    result: QueryResult;
    language: Language;
  }) => {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    
    setHistory(prevHistory => {
        const updatedHistory = [newItem, ...prevHistory];
        // Cap history at 50 items to prevent localStorage bloat
        if (updatedHistory.length > 50) {
            updatedHistory.splice(50);
        }
        saveHistory(updatedHistory);
        return updatedHistory;
    });

  }, []);

  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, []);

  return { history, addHistoryItem, clearHistory };
};
