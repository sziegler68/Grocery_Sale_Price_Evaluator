/**
 * useVoiceInput Hook
 * 
 * Wrapper for the Web Speech API's SpeechRecognition.
 * Provides voice-to-text input for the Mini-Assistant.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

export interface UseVoiceInputResult {
    isListening: boolean;
    isSupported: boolean;
    transcript: string;
    error: string | null;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
}

export function useVoiceInput(): UseVoiceInputResult {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Check if Speech Recognition is supported
    const isSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    // Initialize recognition instance
    useEffect(() => {
        if (!isSupported) return;

        const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionClass();

        recognition.continuous = true; // Keep listening until user stops
        recognition.interimResults = true; // Show partial results
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const results = Array.from(event.results);
            const latestResult = results[results.length - 1];

            if (latestResult) {
                const text = latestResult[0].transcript;
                setTranscript(text);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('[VoiceInput] Error:', event.error);

            switch (event.error) {
                case 'not-allowed':
                    setError('Microphone access denied. Please enable it in your browser settings.');
                    break;
                case 'no-speech':
                    setError('No speech detected. Try again?');
                    break;
                case 'network':
                    setError('Network error. Check your connection.');
                    break;
                default:
                    setError(`Voice input error: ${event.error}`);
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.abort();
        };
    }, [isSupported]);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) {
            setError('Voice input not supported in this browser.');
            return;
        }

        setTranscript('');
        setError(null);

        try {
            recognitionRef.current.start();
        } catch (err) {
            // Already started - ignore
            console.warn('[VoiceInput] Recognition already active');
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setError(null);
    }, []);

    return {
        isListening,
        isSupported,
        transcript,
        error,
        startListening,
        stopListening,
        resetTranscript
    };
}
