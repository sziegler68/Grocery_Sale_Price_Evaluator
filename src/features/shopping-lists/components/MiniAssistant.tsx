/**
 * MiniAssistant Component
 * 
 * A conversational interface for adding items to shopping lists
 * via voice or text input. Supports both text and audio responses.
 */

import { useState, useEffect } from 'react';
import { Mic, MicOff, Send, X, MessageCircle, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useVoiceInput } from '@shared/hooks/useVoiceInput';
import { useTextToSpeech } from '@shared/hooks/useTextToSpeech';
import { parseShoppingInput, getGeminiApiKey, type ParsedShoppingItem } from '@shared/lib/ai/geminiChat';

interface Message {
    id: string;
    type: 'user' | 'assistant';
    text: string;
    items?: ParsedShoppingItem[];
}

type AssistantState = 'idle' | 'listening' | 'processing' | 'confirming' | 'saving';

interface MiniAssistantProps {
    listId: string;
    onAddItems: (items: ParsedShoppingItem[]) => Promise<void>;
}

export function MiniAssistant({ onAddItems }: MiniAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [state, setState] = useState<AssistantState>('idle');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [pendingItems, setPendingItems] = useState<ParsedShoppingItem[]>([]);

    const { isListening, isSupported: voiceSupported, transcript, error: voiceError, startListening, stopListening, resetTranscript } = useVoiceInput();
    const { speak, stop: stopSpeaking, isEnabled: ttsEnabled, setEnabled: setTtsEnabled } = useTextToSpeech();

    // Add welcome message when opened
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMsg = "Hi! I'm Luna. Tell me what to add to your list.";
            addMessage('assistant', welcomeMsg);
            speak(welcomeMsg);
        }
    }, [isOpen]);

    // Handle voice transcript changes
    useEffect(() => {
        if (transcript && !isListening) {
            handleInput(transcript);
            resetTranscript();
        }
    }, [transcript, isListening]);

    // Handle voice errors
    useEffect(() => {
        if (voiceError) {
            addMessage('assistant', voiceError);
            speak(voiceError);
            setState('idle');
        }
    }, [voiceError]);

    const addMessage = (type: 'user' | 'assistant', text: string, items?: ParsedShoppingItem[]) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type,
            text,
            items
        }]);
    };

    const handleInput = async (text: string) => {
        if (!text.trim()) return;

        addMessage('user', text);
        setInputText('');
        setState('processing');

        const apiKey = getGeminiApiKey();
        const result = await parseShoppingInput(text, apiKey || '');

        addMessage('assistant', result.message, result.items);
        speak(result.message);

        if (result.success && result.items.length > 0) {
            setPendingItems(result.items);
            setState('confirming');
        } else {
            setState('idle');
        }
    };

    const handleConfirm = async () => {
        if (pendingItems.length === 0) return;

        setState('saving');

        try {
            await onAddItems(pendingItems);

            const successMsg = `Added ${pendingItems.length} item${pendingItems.length > 1 ? 's' : ''}! Anything else?`;
            addMessage('assistant', successMsg);
            speak(successMsg);

            setPendingItems([]);
            setState('idle');
        } catch {
            const errorMsg = "Sorry, couldn't add those items. Try again?";
            addMessage('assistant', errorMsg);
            speak(errorMsg);
            setState('idle');
        }
    };

    const handleCancel = () => {
        setPendingItems([]);
        const cancelMsg = "Okay, cancelled. What would you like to add?";
        addMessage('assistant', cancelMsg);
        speak(cancelMsg);
        setState('idle');
    };

    const handleVoiceToggle = () => {
        if (isListening) {
            stopListening();
        } else {
            stopSpeaking();
            setState('listening');
            startListening();
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        stopListening();
        stopSpeaking();
        setState('idle');
        setPendingItems([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleInput(inputText);
        }
    };

    // FAB Button (closed state)
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
                aria-label="Open shopping assistant"
            >
                <MessageCircle className="w-6 h-6" />
            </button>
        );
    }

    // Chat Panel (open state)
    return (
        <div className="fixed bottom-20 right-4 z-50 w-80 max-h-[70vh] bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-violet-600 text-white">
                <span className="font-semibold">Luna</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTtsEnabled(!ttsEnabled)}
                        className="p-1 hover:bg-violet-500 rounded"
                        title={ttsEnabled ? 'Mute voice' : 'Enable voice'}
                        aria-label={ttsEnabled ? 'Mute voice' : 'Enable voice'}
                    >
                        {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-violet-500 rounded"
                        aria-label="Close Luna"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[300px]">
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${msg.type === 'user'
                                ? 'bg-violet-600 text-white'
                                : 'bg-slate-700 text-slate-100'
                                }`}
                        >
                            {msg.text}
                            {msg.items && msg.items.length > 0 && (
                                <ul className="mt-2 space-y-1 text-xs opacity-90">
                                    {msg.items.map((item, i) => (
                                        <li key={i}>
                                            • {item.quantity} {item.unit || ''} {item.name} ({item.category})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                ))}

                {/* Processing indicator */}
                {state === 'processing' && (
                    <div className="flex justify-start">
                        <div className="bg-slate-700 text-slate-100 px-3 py-2 rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation buttons */}
            {state === 'confirming' && pendingItems.length > 0 && (
                <div className="flex gap-2 px-3 pb-2">
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Add {pendingItems.length} item{pendingItems.length > 1 ? 's' : ''}
                    </button>
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Input area */}
            <div className="p-3 border-t border-slate-700">
                <div className="flex gap-2">
                    {/* Voice button */}
                    {voiceSupported && (
                        <button
                            onClick={handleVoiceToggle}
                            disabled={state === 'processing' || state === 'saving'}
                            className={`p-3 rounded-full transition-all ${isListening
                                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                                : 'bg-slate-600 hover:bg-slate-500'
                                } text-white disabled:opacity-50`}
                            title={isListening ? 'Stop listening' : 'Start voice input'}
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                    )}

                    {/* Text input */}
                    <input
                        type="text"
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? 'Listening...' : 'Type or tap mic...'}
                        disabled={state === 'processing' || state === 'saving' || isListening}
                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:border-violet-500 disabled:opacity-50"
                    />

                    {/* Send button */}
                    <button
                        onClick={() => handleInput(inputText)}
                        disabled={!inputText.trim() || state === 'processing' || state === 'saving'}
                        className="p-3 bg-violet-600 hover:bg-violet-700 text-white rounded-full transition-colors disabled:opacity-50"
                        aria-label="Send message"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>

                {/* Listening indicator */}
                {isListening && (
                    <p className="text-xs text-violet-400 mt-2 text-center animate-pulse">
                        🎤 Listening... Tap stop when done. {transcript && `"${transcript}"`}
                    </p>
                )}
            </div>
        </div>
    );
}
