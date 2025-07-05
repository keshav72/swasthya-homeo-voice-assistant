import React, { useState, useCallback, useEffect } from 'react';
import { Language, View, QueryResult } from '../types';
import { useVoiceProcessor } from '../hooks/useVoiceProcessor';
import { getSuggestions } from '../services/geminiService';
import { MicrophoneIcon, StopIcon, SpeakerIcon, LanguageIcon, BackIcon, InfoIcon } from './common/Icons';

interface AssistantScreenProps {
  mode: View.DIAGNOSIS | View.MEDICINE_LOOKUP;
  onBack: () => void;
}

const Spinner: React.FC = () => (
  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
);

const AssistantScreen: React.FC<AssistantScreenProps> = ({ mode, onBack }) => {
  const [language, setLanguage] = useState<Language>(Language.HINDI);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');

  const handleTranscriptReady = useCallback(async (newTranscript: string) => {
    if (newTranscript) {
      setTranscript(newTranscript);
      setIsLoading(true);
      setError(null);
      setResult(null);
      try {
        const aiResult = await getSuggestions(newTranscript, mode, language);
        setResult(aiResult);
      } catch (e: any) {
        setError(e.message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [mode, language]);

  const { isRecording, error: voiceError, startRecording, stopRecording, isSupported } = useVoiceProcessor(handleTranscriptReady);

  useEffect(() => {
    if (voiceError) {
      setError(`Voice Error: ${voiceError}`);
    }
  }, [voiceError]);

  // Stop speech synthesis when the component unmounts (e.g., when navigating back)
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleLanguage = () => {
    setLanguage(prev => prev === Language.HINDI ? Language.ENGLISH : Language.HINDI);
    setResult(null);
    setTranscript('');
    setError(null);
  };

  const handleRecord = () => {
    setResult(null);
    setTranscript('');
    setError(null);
    startRecording(language);
  };
  
  const speakText = (text: string, lang: Language) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang === lang);
      if (voice) {
          utterance.voice = voice;
      }
      window.speechSynthesis.speak(utterance);
    } else {
      setError("Text-to-speech is not supported in this browser.");
    }
  };

  const handleSpeakResult = () => {
    if (!result) return;
    let textToSpeak = "";
    const isHindi = language === Language.HINDI;

    if (result.medicines) {
        const intro = isHindi ? "सुझाई गई दवाइयाँ हैं:" : "The suggested medicines are:";
        textToSpeak = `${intro} ` + result.medicines.map(m => 
            `${m.name}. ${isHindi ? 'मुख्य लक्षण' : 'Key symptoms'}: ${m.symptoms}. ${m.potency ? `${isHindi ? 'पोटेंसी' : 'Potency'}: ${m.potency}.` : ''} ${m.dosage ? `${isHindi ? 'खुराक' : 'Dosage'}: ${m.dosage}.` : ''}`
        ).join(' ');
    } else if (result.symptoms && result.medicineName) {
        const intro = isHindi ? `${result.medicineName} के लिए मुख्य लक्षण हैं:` : `The key symptoms for ${result.medicineName} are:`;
        textToSpeak = `${intro} ` + result.symptoms.join(', ');
    }
    
    if(textToSpeak) {
        speakText(textToSpeak, language);
    }
  };
  
  const pageTitle = mode === View.DIAGNOSIS ? (language === Language.HINDI ? 'लक्षण बताएं' : 'Describe Symptoms') : (language === Language.HINDI ? 'दवा खोजें' : 'Find Medicine');
  
  return (
    <div className="p-4 bg-white rounded-2xl shadow-lg w-full min-h-[70vh] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 transition-colors"><BackIcon className="w-6 h-6 text-slate-600" /></button>
        <h1 className="text-2xl font-bold text-slate-800">{pageTitle}</h1>
        <button onClick={toggleLanguage} className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-100 py-2 px-4 rounded-full hover:bg-blue-200 transition-colors">
          <LanguageIcon className="w-5 h-5" />
          <span>{language === Language.HINDI ? 'English' : 'हिंदी'}</span>
        </button>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center">
        {!isSupported && <div className="text-red-600 bg-red-100 p-4 rounded-lg text-center">Voice recognition is not supported in your browser.</div>}
        
        {isLoading ? (
          <div className="text-center">
            <Spinner />
            <p className="mt-4 text-slate-600 text-lg">
              {language === Language.HINDI ? 'विश्लेषण हो रहा है...' : 'Analyzing...'}
            </p>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg">
            <p className="font-bold">{language === Language.HINDI ? 'एक त्रुटि हुई' : 'An Error Occurred'}</p>
            <p>{error}</p>
          </div>
        ) : result ? (
          <div className="w-full text-left overflow-y-auto max-h-[50vh] p-1">
            {transcript && <p className="text-slate-500 italic mb-4 text-center">"{transcript}"</p>}
            {result.medicines && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold text-slate-700">{language === Language.HINDI ? 'सुझाव' : 'Suggestions'}</h2>
                  <button onClick={handleSpeakResult} className="p-2 rounded-full hover:bg-slate-200 transition-colors"><SpeakerIcon className="w-6 h-6 text-blue-600" /></button>
                </div>
                <ul className="space-y-4">
                  {result.medicines.map((med, index) => (
                    <li key={index} className="bg-slate-100 p-4 rounded-lg">
                      <h3 className="font-bold text-lg text-blue-700">{med.name}</h3>
                      <p className="text-slate-800"><strong className="font-semibold">{language === Language.HINDI ? 'लक्षण: ' : 'Symptoms: '}</strong>{med.symptoms}</p>
                      {med.potency && <p className="text-slate-600"><strong className="font-semibold">{language === Language.HINDI ? 'पोटेंसी: ' : 'Potency: '}</strong>{med.potency}</p>}
                      {med.dosage && <p className="text-slate-600"><strong className="font-semibold">{language === Language.HINDI ? 'खुराक: ' : 'Dosage: '}</strong>{med.dosage}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.symptoms && result.medicineName && (
              <div>
                 <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold text-slate-700">{language === Language.HINDI ? `लक्षण: ${result.medicineName}` : `Symptoms for ${result.medicineName}`}</h2>
                  <button onClick={handleSpeakResult} className="p-2 rounded-full hover:bg-slate-200 transition-colors"><SpeakerIcon className="w-6 h-6 text-blue-600" /></button>
                </div>
                <ul className="space-y-2 list-disc list-inside bg-slate-100 p-4 rounded-lg">
                  {result.symptoms.map((symptom, index) => (
                    <li key={index} className="text-slate-800">{symptom}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
           <div className="text-center text-slate-500 flex flex-col items-center">
              <InfoIcon className="w-12 h-12 text-slate-400 mb-4"/>
              <p className="text-lg">
                {language === Language.HINDI 
                  ? "रिकॉर्डिंग शुरू करने के लिए माइक बटन दबाएं।" 
                  : "Press the mic button to start recording."}
              </p>
           </div>
        )}
      </div>

      <div className="mt-8 flex justify-center items-center">
        {isRecording ? (
          <button onClick={stopRecording} className="bg-red-600 text-white rounded-full p-8 shadow-lg animate-pulse">
            <StopIcon className="w-12 h-12" />
          </button>
        ) : (
          <button onClick={handleRecord} disabled={!isSupported || isLoading} className="bg-blue-600 text-white rounded-full p-8 shadow-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors">
            <MicrophoneIcon className="w-12 h-12" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AssistantScreen;