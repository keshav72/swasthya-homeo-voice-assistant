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
  const transcriptRef = useRef<string>('');

  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    // Accumulate the full transcript from all parts of the speech recognition result.
    const fullTranscript = Array.from(event.results)
      .map(result => result[0])
      .map(result => result.transcript)
      .join(' '); // Use a space to correctly join separate phrases
    
    transcriptRef.current = fullTranscript;
    // NOTE: We no longer call onTranscriptReady here to prevent auto-submission.
  }, []);

  const handleError = useCallback((event: SpeechRecognitionErrorEvent) => {
    // "no-speech" is a common event when the mic is open but no sound is detected. We can ignore it.
    if (event.error !== 'no-speech') {
        setError(`Voice recognition error: ${event.error}`);
    }
    setIsRecording(false);
  }, []);

  const handleEnd = useCallback(() => {
    // This just marks the recording as stopped. The submission logic is handled in stopRecording.
    setIsRecording(false);
  }, []);

  // Setup recognition instance on component mount.
  useEffect(() => {
    if (!isSupported) {
      setError("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Allows for pauses without stopping the session.
    recognition.interimResults = false; // Gets results only when they are final. This fixes repetition bugs on mobile.

    recognition.addEventListener('result', handleResult);
    recognition.addEventListener('error', handleError);
    recognition.addEventListener('end', handleEnd);
    
    recognitionRef.current = recognition;

    return () => {
      recognition.removeEventListener('result', handleResult);
      recognition.removeEventListener('error', handleError);
      recognition.removeEventListener('end', handleEnd);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [handleResult, handleError, handleEnd]);

  const startRecording = useCallback((lang: string) => {
    if (recognitionRef.current && !isRecording) {
      transcriptRef.current = ''; // Clear any previous transcript before starting.
      recognitionRef.current.lang = lang;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setError(null);
      } catch(e) {
        setError("Could not start voice recognition.");
      }
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      // This is the key change: The transcript is only processed when stopRecording is explicitly called.
      if (transcriptRef.current) {
        onTranscriptReady(transcriptRef.current.trim());
      }
    }
  }, [isRecording, onTranscriptReady]);

  return { isRecording, error, startRecording, stopRecording, isSupported };
};
