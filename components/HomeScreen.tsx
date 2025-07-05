
import React from 'react';
import { View } from '../types';
import { StethoscopeIcon, PillIcon, AppLogo, HistoryIcon } from './common/Icons';

interface HomeScreenProps {
  setView: (view: View) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ setView }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white rounded-2xl shadow-lg">
      <AppLogo className="w-20 h-24 mb-4" />
      <h1 className="text-4xl font-bold text-slate-800 mb-2">
        स्वस्थ्य होम्यो
      </h1>
      <h2 className="text-2xl font-semibold text-blue-600 mb-10">
        Voice Assistant
      </h2>
      <div className="w-full space-y-6">
        <button
          onClick={() => setView(View.DIAGNOSIS)}
          className="w-full flex items-center justify-center gap-4 bg-blue-600 text-white text-xl font-bold py-6 px-8 rounded-xl shadow-md hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-transform transform hover:scale-105"
        >
          <StethoscopeIcon className="w-8 h-8" />
          <span>Start Diagnosis</span>
        </button>
        <button
          onClick={() => setView(View.MEDICINE_LOOKUP)}
          className="w-full flex items-center justify-center gap-4 bg-green-600 text-white text-xl font-bold py-6 px-8 rounded-xl shadow-md hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-transform transform hover:scale-105"
        >
          <PillIcon className="w-8 h-8" />
          <span>Look Up Medicine</span>
        </button>
        <button
          onClick={() => setView(View.HISTORY)}
          className="w-full flex items-center justify-center gap-4 bg-slate-600 text-white text-xl font-bold py-6 px-8 rounded-xl shadow-md hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300 transition-transform transform hover:scale-105"
        >
          <HistoryIcon className="w-8 h-8" />
          <span>Query History</span>
        </button>
      </div>
       <p className="text-sm text-slate-500 mt-12">
        Press a button and speak your query in Hindi or English.
      </p>
    </div>
  );
};

export default HomeScreen;
