/**
 * useTextToSpeech Hook
 * 
 * Wrapper for the Web Speech API's speechSynthesis.
 * Provides text-to-speech output for the Mini-Assistant.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseTextToSpeechResult {
    isSpeaking: boolean;
    isSupported: boolean;
    speak: (text: string) => void;
    stop: () => void;
    setEnabled: (enabled: boolean) => void;
    isEnabled: boolean;
}

export function useTextToSpeech(): UseTextToSpeechResult {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isEnabled, setIsEnabled] = useState(true);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Check if TTS is supported
    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    // Cancel any ongoing speech on unmount
    useEffect(() => {
        return () => {
            if (isSupported) {
                window.speechSynthesis.cancel();
            }
        };
    }, [isSupported]);

    const speak = useCallback((text: string) => {
        if (!isSupported || !isEnabled || !text.trim()) {
            return;
        }

        // Cancel any ongoing speech first
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Configure voice settings
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';

        // Try to use a natural-sounding voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v =>
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Alex') ||
            v.lang.startsWith('en')
        );
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
            console.error('[TTS] Error:', event.error);
            setIsSpeaking(false);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [isSupported, isEnabled]);

    const stop = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [isSupported]);

    const setEnabled = useCallback((enabled: boolean) => {
        setIsEnabled(enabled);
        if (!enabled && isSupported) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [isSupported]);

    return {
        isSpeaking,
        isSupported,
        speak,
        stop,
        setEnabled,
        isEnabled
    };
}
