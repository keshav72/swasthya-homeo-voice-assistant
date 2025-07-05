
import React, { useState, useCallback } from 'react';
import { View } from './types';
import HomeScreen from './components/HomeScreen';
import AssistantScreen from './components/AssistantScreen';
import HistoryScreen from './components/HistoryScreen';

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.HOME);

  const handleBackToHome = useCallback(() => {
    setView(View.HOME);
  }, []);

  const renderView = () => {
    switch (view) {
      case View.DIAGNOSIS:
        return <AssistantScreen mode={View.DIAGNOSIS} onBack={handleBackToHome} />;
      case View.MEDICINE_LOOKUP:
        return <AssistantScreen mode={View.MEDICINE_LOOKUP} onBack={handleBackToHome} />;
      case View.HISTORY:
        return <HistoryScreen onBack={handleBackToHome} />;
      case View.HOME:
      default:
        return <HomeScreen setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl mx-auto">
        {renderView()}
      </div>
    </div>
  );
};

export default App;
