
import React, { useState } from 'react';
import { useHistory } from '../hooks/useHistory';
import { HistoryItem, Language, View } from '../types';
import { BackIcon, TrashIcon, StethoscopeIcon, PillIcon, ChevronDownIcon, ChevronUpIcon, HistoryIcon } from './common/Icons';

interface HistoryScreenProps {
  onBack: () => void;
}

const ResultDisplay: React.FC<{ item: HistoryItem }> = ({ item }) => {
    const { result, language } = item;
    const isHindi = language === Language.HINDI;

    return (
        <div className="w-full text-left p-4 bg-slate-50 rounded-b-lg">
            {result.medicines && (
                <div>
                    <h2 className="text-lg font-bold text-slate-700 mb-2">{isHindi ? 'सुझाव' : 'Suggestions'}</h2>
                    <ul className="space-y-3">
                        {result.medicines.map((med, index) => (
                            <li key={index} className="bg-white p-3 rounded-md shadow-sm">
                                <h3 className="font-bold text-md text-blue-700">{med.name}</h3>
                                <p className="text-slate-800 text-sm"><strong className="font-semibold">{isHindi ? 'लक्षण: ' : 'Symptoms: '}</strong>{med.symptoms}</p>
                                {med.potency && <p className="text-slate-600 text-sm"><strong className="font-semibold">{isHindi ? 'पोटेंसी: ' : 'Potency: '}</strong>{med.potency}</p>}
                                {med.dosage && <p className="text-slate-600 text-sm"><strong className="font-semibold">{isHindi ? 'खुराक: ' : 'Dosage: '}</strong>{med.dosage}</p>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {result.symptoms && result.medicineName && (
                <div>
                    <h2 className="text-lg font-bold text-slate-700 mb-2">{isHindi ? `लक्षण: ${result.medicineName}` : `Symptoms for ${result.medicineName}`}</h2>
                    <ul className="space-y-1 list-disc list-inside bg-white p-3 rounded-md shadow-sm">
                        {result.symptoms.map((symptom, index) => (
                            <li key={index} className="text-slate-800 text-sm">{symptom}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


const HistoryItemCard: React.FC<{ item: HistoryItem }> = ({ item }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { type, transcript, timestamp } = item;
    const isDiagnosis = type === View.DIAGNOSIS;

    const date = new Date(timestamp);
    const formattedDate = date.toLocaleString();

    return (
        <div className="bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 text-left"
                aria-expanded={isExpanded}
                aria-controls={`history-item-details-${item.id}`}
            >
                <div className="flex items-center gap-4 overflow-hidden">
                    {isDiagnosis ? (
                        <StethoscopeIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                    ) : (
                        <PillIcon className="w-8 h-8 text-green-500 flex-shrink-0" />
                    )}
                    <div className="flex-grow overflow-hidden">
                        <p className="font-semibold text-slate-800 truncate" title={transcript}>"{transcript}"</p>
                        <p className="text-xs text-slate-500">{formattedDate}</p>
                    </div>
                </div>
                {isExpanded ? <ChevronUpIcon className="w-6 h-6 text-slate-600 flex-shrink-0" /> : <ChevronDownIcon className="w-6 h-6 text-slate-600 flex-shrink-0" />}
            </button>
            {isExpanded && (
                <div id={`history-item-details-${item.id}`}>
                    <ResultDisplay item={item} />
                </div>
            )}
        </div>
    );
};

const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const { history, clearHistory } = useHistory();

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all query history? This action cannot be undone.")) {
      clearHistory();
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl shadow-lg w-full min-h-[70vh] flex flex-col">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
          <BackIcon className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Query History</h1>
        <button
          onClick={handleClear}
          disabled={history.length === 0}
          className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-100 py-2 px-4 rounded-full hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Clear all history"
        >
          <TrashIcon className="w-5 h-5" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map(item => (
              <HistoryItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
            <HistoryIcon className="w-16 h-16 text-slate-400 mb-4" />
            <p className="text-lg font-semibold">No query history found.</p>
            <p className="text-sm">Your past queries will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;
