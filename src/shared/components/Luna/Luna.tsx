/**
 * Luna - Global AI Shopping Assistant
 * 
 * Available on all pages. Supports voice/text input with navigation,
 * price checks, list management, and help capabilities.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Send, X, MessageCircle, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useVoiceInput } from '@shared/hooks/useVoiceInput';
import { useTextToSpeech } from '@shared/hooks/useTextToSpeech';
import { getGeminiApiKey } from '@shared/lib/ai/geminiChat';
import { classifyIntent, type IntentResult, type ParsedItem } from '@shared/lib/ai/geminiIntent';
import { matchIntent, SUGGESTED_PROMPTS } from '@shared/lib/keywordMatcher';
import { findHelpAnswer } from '@shared/lib/helpContent';
import { getLunaSuggestionsEnabled } from '@shared/utils/settings';
import { useLuna } from './LunaContext';

interface Message {
    id: string;
    type: 'user' | 'assistant';
    text: string;
    items?: ParsedItem[];
}

type AssistantState = 'idle' | 'listening' | 'processing' | 'confirming' | 'saving';

export function Luna() {
    const [isOpen, setIsOpen] = useState(false);
    const [state, setState] = useState<AssistantState>('idle');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [pendingItems, setPendingItems] = useState<ParsedItem[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(true);

    // Multi-turn conversation state
    type PendingAction =
        | { type: 'awaiting_list_name' }
        | { type: 'awaiting_user_name'; listShareCode: string }
        | null;
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);

    // Ref for auto-scrolling to latest message
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { isListening, isSupported: voiceSupported, transcript, error: voiceError, startListening, stopListening, resetTranscript } = useVoiceInput();
    const { speak, stop: stopSpeaking, isEnabled: ttsEnabled, setEnabled: setTtsEnabled } = useTextToSpeech();
    const luna = useLuna();

    // Add welcome message when opened and load settings
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMsg = "Hi! I'm Luna. How can I help?";
            addMessage('assistant', welcomeMsg);
            speak(welcomeMsg);
        }
        if (isOpen) {
            // Reload suggestions preference when opened
            setShowSuggestions(getLunaSuggestionsEnabled());
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

    // Auto-scroll to latest message
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const addMessage = useCallback((type: 'user' | 'assistant', text: string, items?: ParsedItem[]) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type,
            text,
            items
        }]);
    }, []);

    const handleInput = useCallback(async (text: string) => {
        if (!text.trim()) return;

        addMessage('user', text);
        setInputText('');
        setState('processing');

        // Check if we're awaiting follow-up input
        if (pendingAction) {
            await handlePendingAction(text);
            return;
        }

        // Try keyword matching first (fast, free)
        const keywordResult = matchIntent(text);
        if (keywordResult.matched && keywordResult.result) {
            console.log('[Luna] Keyword match:', keywordResult.result.intent);
            await processIntent(keywordResult.result);
            return;
        }

        // Fall back to AI for complex queries
        console.log('[Luna] No keyword match, trying AI...');
        const apiKey = getGeminiApiKey();
        if (!apiKey) {
            const msg = "I didn't understand that. Try a simpler command like 'add milk' or 'create list'.";
            addMessage('assistant', msg);
            speak(msg);
            setState('idle');
            return;
        }

        const result = await classifyIntent(text, apiKey);
        await processIntent(result);
    }, [addMessage, pendingAction, speak]);

    // Handle responses to pending prompts
    const handlePendingAction = useCallback(async (text: string) => {
        const action = pendingAction;
        setPendingAction(null);

        if (action?.type === 'awaiting_list_name') {
            const listName = text.trim() || 'My List';
            const createResult = await luna.createList(listName);

            if (createResult.success && createResult.shareCode) {
                // Ask for user name
                const response = `${createResult.message}. What's your name so we know who added items?`;
                addMessage('assistant', response);
                speak(response);
                setPendingAction({ type: 'awaiting_user_name', listShareCode: createResult.shareCode });
                setState('idle');
            } else {
                addMessage('assistant', createResult.message);
                speak(createResult.message);
                setState('idle');
            }
            return;
        }

        if (action?.type === 'awaiting_user_name') {
            const userName = text.trim();
            if (userName) {
                // Set user name for this list
                const { setUserNameForList } = await import('../../../shared/utils/listUserNames');
                setUserNameForList(action.listShareCode, userName);
                const response = `Got it, ${userName}! Your list is ready. Say 'add' followed by items to get started.`;
                addMessage('assistant', response);
                speak(response);
            } else {
                const response = "No problem! You can set your name later in the list. Say 'add' followed by items to get started.";
                addMessage('assistant', response);
                speak(response);
            }
            setState('idle');
            return;
        }
    }, [pendingAction, luna, addMessage, speak]);

    const processIntent = useCallback(async (result: IntentResult) => {
        const { intent, params } = result;
        let response = result.message;

        switch (intent) {
            case 'add_items':
                if (params.items && params.items.length > 0) {
                    // Check if we have a current list
                    if (luna.currentListId) {
                        const lunaResult = await luna.addItemsToCurrentList(params.items.map(item => ({
                            name: item.name,
                            quantity: item.quantity,
                            unit: item.unit,
                            category: item.category
                        })));
                        response = lunaResult.message;
                    } else {
                        setPendingItems(params.items);
                        response = `I found ${params.items.length} item${params.items.length > 1 ? 's' : ''}. Open a list first, then I can add them.`;
                        setState('confirming');
                        addMessage('assistant', response, params.items);
                        speak(response);
                        return;
                    }
                } else {
                    // No items extracted - ask for clarification
                    response = "I couldn't identify the items. Try saying something like 'add 2 ribeye steaks' or 'add milk and eggs'.";
                }
                break;

            case 'navigation':
                const routes: Record<string, string> = {
                    'home': '/',
                    'settings': '/settings',
                    'help': '/help',
                    'lists': '/shopping-lists',
                    'price-checker': '/add-item',
                    'items': '/items'
                };
                if (params.target && routes[params.target]) {
                    luna.navigateTo(routes[params.target]);
                    response = `Going to ${params.target}`;
                }
                break;

            case 'create_list': {
                const listName = params.listName;
                if (!listName || listName.toLowerCase() === 'new list') {
                    // Ask what to name the list
                    response = "Sure! What would you like to call this list?";
                    setPendingAction({ type: 'awaiting_list_name' });
                    addMessage('assistant', response);
                    speak(response);
                    setState('idle');
                    return;
                }

                const createResult = await luna.createList(listName);
                if (createResult.success && createResult.shareCode) {
                    // Ask for user name
                    response = `${createResult.message}. What's your name so we know who added items?`;
                    setPendingAction({ type: 'awaiting_user_name', listShareCode: createResult.shareCode });
                    addMessage('assistant', response);
                    speak(response);
                    setState('idle');
                    return;
                } else {
                    response = createResult.message;
                }
                break;
            }

            case 'open_list':
                if (params.listName) {
                    const openResult = await luna.openList(params.listName);
                    response = openResult.message;
                }
                break;

            case 'price_check':
                if (params.item && params.price && params.unit) {
                    const priceResult = await luna.checkPrice(params.item, params.price, params.unit);
                    response = priceResult.message;
                }
                break;

            case 'compare_prices':
                if (params.priceA && params.unitA && params.priceB && params.unitB) {
                    const compareResult = luna.comparePrices(params.priceA, params.unitA, params.priceB, params.unitB);
                    response = compareResult.message;
                }
                break;

            case 'help':
                if (params.topic) {
                    response = findHelpAnswer(params.topic);
                } else {
                    response = "What would you like help with? Ask about price checking, shopping lists, trips, or settings.";
                }
                break;

            default:
                response = result.message || "I didn't quite catch that. Try asking me to add items, open a list, check a price, or get help.";
        }

        addMessage('assistant', response);
        speak(response);
        setState('idle');
    }, [luna, addMessage, speak]);

    const handleConfirm = useCallback(async () => {
        if (pendingItems.length === 0) return;

        setState('saving');

        if (!luna.currentListId) {
            const msg = "Open a list first, then try again.";
            addMessage('assistant', msg);
            speak(msg);
            setState('idle');
            return;
        }

        const result = await luna.addItemsToCurrentList(pendingItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category
        })));

        addMessage('assistant', result.message);
        speak(result.message);
        setPendingItems([]);
        setState('idle');
    }, [pendingItems, luna, addMessage, speak]);

    const handleCancel = useCallback(() => {
        setPendingItems([]);
        const cancelMsg = "Okay, cancelled. What else can I help with?";
        addMessage('assistant', cancelMsg);
        speak(cancelMsg);
        setState('idle');
    }, [addMessage, speak]);

    const handleVoiceToggle = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            stopSpeaking();
            setState('listening');
            startListening();
        }
    }, [isListening, stopListening, stopSpeaking, startListening]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        stopListening();
        stopSpeaking();
        setState('idle');
        setPendingItems([]);
        setPendingAction(null); // Clear any pending conversation
    }, [stopListening, stopSpeaking]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleInput(inputText);
        }
    }, [handleInput, inputText]);

    // FAB Button (closed state)
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
                aria-label="Open Luna assistant"
            >
                <MessageCircle className="w-6 h-6" />
            </button>
        );
    }

    // Chat Panel (open state)
    return (
        <div className="fixed bottom-20 right-2 left-2 sm:left-auto sm:right-4 z-50 sm:w-80 max-h-[70vh] bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
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

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts - show when few messages and enabled */}
            {showSuggestions && messages.length <= 2 && state === 'idle' && (
                <div className="px-3 pb-2">
                    <p className="text-xs text-slate-400 mb-2">Try saying:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {SUGGESTED_PROMPTS.map((prompt, i) => (
                            <button
                                key={i}
                                onClick={() => handleInput(prompt.text)}
                                className="px-2.5 py-1 bg-slate-700 hover:bg-violet-600 text-slate-200 text-xs rounded-full transition-colors"
                            >
                                {prompt.icon} {prompt.text}
                            </button>
                        ))}
                    </div>
                </div>
            )}

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
                            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
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
                        placeholder={isListening ? 'Listening...' : 'Ask Luna...'}
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
