import { useState, useEffect, useRef, useCallback } from 'react';

// Define interfaces for Web Speech API to resolve TypeScript errors
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  addEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void;
  addEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void;
  addEventListener(type: 'end', listener: () => void): void;
  removeEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void;
  removeEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void;
  removeEventListener(type: 'end', listener: () => void): void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}


// This is to make it work in browsers that still use the webkit prefix.
interface CustomWindow extends Window {
  SpeechRecognition?: SpeechRecognitionStatic;
  webkitSpeechRecognition?: SpeechRecognitionStatic;
}
declare var window: CustomWindow;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSupported = !!SpeechRecognition;

export const useVoiceProcessor = (onTranscriptReady: (transcript: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    const transcript = Array.from(event.results)
      .map(result => result[0])
      .map(result => result.transcript)
      .join('');
    
    if (event.results[0] && event.results[0].isFinal) {
        onTranscriptReady(transcript);
    }
  }, [onTranscriptReady]);

  const handleError = useCallback((event: SpeechRecognitionErrorEvent) => {
    setError(`Voice recognition error: ${event.error}`);
    setIsRecording(false);
  }, []);

  const handleEnd = useCallback(() => {
    setIsRecording(false);
  }, []);

  useEffect(() => {
    if (!isSupported || !SpeechRecognition) {
      setError("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.addEventListener('result', handleResult);
    recognition.addEventListener('error', handleError);
    recognition.addEventListener('end', handleEnd);
    
    recognitionRef.current = recognition;

    return () => {
      recognition.removeEventListener('result', handleResult);
      recognition.removeEventListener('error', handleError);
      recognition.removeEventListener('end', handleEnd);
      recognition.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty to run once

  const startRecording = useCallback((lang: string) => {
    if (recognitionRef.current && !isRecording) {
      recognitionRef.current.lang = lang;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setError(null);
      } catch(e) {
        setError("Could not start voice recognition. It may already be active.");
      }
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return { isRecording, error, startRecording, stopRecording, isSupported };
};
