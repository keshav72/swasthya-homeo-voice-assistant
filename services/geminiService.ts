// services/geminiService.ts

import { View, Language, QueryResult } from '../types';

export const getSuggestions = async (userInput: string, mode: View, language: Language): Promise<QueryResult> => {
  try {
    // This fetch call talks to your own secure backend function.
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userInput, mode, language }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Throw an error with the message from the backend
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const data: QueryResult = await response.json();
    return data;

  } catch (e: any) {
    console.error("Error fetching suggestions from backend:", e);
    const langError = language === Language.HINDI 
      ? "सुझाव प्राप्त करने में विफल। कृपया अपनी नेटवर्क जाँच करें।" 
      : "Failed to get suggestions. Please check your network connection.";
    throw new Error(e.message || langError);
  }
};
