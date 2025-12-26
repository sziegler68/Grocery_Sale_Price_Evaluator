/**
 * Help Content for Luna
 * 
 * Extracted FAQ content for Luna to answer help questions.
 */

export interface HelpTopic {
    keywords: string[];
    question: string;
    answer: string;
}

// Luna's capabilities - used both in help topics and when Luna responds to "what can you do"
export const LUNA_CAPABILITIES = "I can help you with: Adding items to lists (say 'add milk and eggs'), Creating new lists ('create a new list'), Opening lists ('open my Costco list'), Checking prices ('is $5/lb good for chicken?'), Comparing prices ('$4/lb vs $0.30/oz'), and Navigating ('go to settings'). What would you like to do?";

export const HELP_TOPICS: HelpTopic[] = [
    // Price Checker
    {
        keywords: ['price', 'check', 'checker', 'compare', 'deal', 'good price'],
        question: 'How does the Price Checker work?',
        answer: 'Open Price Checker, type an item name, enter the price you see, and I\'ll tell you if it\'s a good deal compared to your history. Red means expensive, green means great deal!'
    },
    {
        keywords: ['target', 'target price', 'set target'],
        question: 'What is a target price?',
        answer: 'A target price is what you\'re willing to pay for an item. Set it once and I\'ll remember it. When you check prices, I\'ll compare against this target.'
    },
    {
        keywords: ['color', 'colors', 'red', 'green', 'cyan'],
        question: 'What do the colors mean?',
        answer: 'Red means above target price (expensive). Cyan means below target (good deal). Green means it\'s the best price you\'ve ever recorded!'
    },

    // Shopping Lists
    {
        keywords: ['create', 'new list', 'make list', 'start list'],
        question: 'How do I create a shopping list?',
        answer: 'Go to Shopping Lists and tap "Create New List". Give it a name even and you\'ll get a share code. Or just say "create a list called [name]"!'
    },
    {
        keywords: ['share', 'code', 'share code', 'share list', 'family', 'friend'],
        question: 'How do I share a list?',
        answer: 'Each list has a share code like SHOP-K7P2M9. Tap the code to copy it, then send it to family or friends. They can join by entering the code in "Join Existing List".'
    },
    {
        keywords: ['join', 'join list', 'enter code'],
        question: 'How do I join someone else\'s list?',
        answer: 'Get their share code, go to Shopping Lists, tap "Join Existing List", and enter the code. You\'ll see their list and can add or check off items!'
    },
    {
        keywords: ['add item', 'add to list', 'put on list'],
        question: 'How do I add items to a list?',
        answer: 'Open your list and tap "Add Item", or just ask me! Say something like "add 2 apples and milk" and I\'ll add them for you.'
    },
    {
        keywords: ['check', 'check off', 'mark', 'bought', 'got it'],
        question: 'How do I check off items?',
        answer: 'Tap the checkbox next to any item. Checked items move to the bottom so you can focus on what\'s left.'
    },

    // Shopping Trip
    {
        keywords: ['trip', 'shopping trip', 'budget', 'start trip'],
        question: 'What is a Shopping Trip?',
        answer: 'A Shopping Trip tracks your spending in real-time. Set a budget, and as you add items to your cart, I\'ll show you how much you\'ve spent. The meter turns yellow at 90% and red when you go over.'
    },
    {
        keywords: ['budget meter', 'over budget', 'spending'],
        question: 'How does the budget meter work?',
        answer: 'Green means under budget, yellow means 90-99% (slow down!), red means over budget. Remove items or increase your budget if you go over.'
    },
    {
        keywords: ['crv', 'deposit', 'bottle deposit', 'can deposit'],
        question: 'What about CRV/bottle deposits?',
        answer: 'When adding items to your cart, check "Item has CRV" and enter the deposit amount. CRV is added after tax, just like at checkout.'
    },
    {
        keywords: ['tax', 'sales tax', 'tax rate'],
        question: 'How does sales tax work?',
        answer: 'Set your default sales tax rate in Settings. The Shopping Trip uses this to calculate your real total. You can override it per-trip if shopping in a different area.'
    },

    // General
    {
        keywords: ['settings', 'preferences', 'options'],
        question: 'Where are the settings?',
        answer: 'Tap Settings in the bottom navigation. You can set unit preferences, sales tax rate, notifications, and your Gemini API key.'
    },
    {
        keywords: ['unit', 'units', 'pound', 'ounce', 'gallon', 'convert'],
        question: 'How do unit conversions work?',
        answer: 'Set your preferred units in Settings (like pounds for meat, gallons for milk). All prices get normalized so you can compare apples to apples!'
    },
    {
        keywords: ['notification', 'notifications', 'alert', 'alerts'],
        question: 'How do notifications work?',
        answer: 'Enable notifications in Settings. You\'ll get alerts when someone updates your shared list. Notifications are throttled so you don\'t get spammed.'
    },
    {
        keywords: ['gemini', 'api', 'api key', 'ai'],
        question: 'What is the Gemini API key for?',
        answer: 'The Gemini API key powers me (Luna) and the smart scanning features. Get a free key from Google AI Studio, then enter it in Settings.'
    },
    {
        keywords: ['scan', 'camera', 'photo', 'receipt', 'price tag'],
        question: 'How do I scan prices?',
        answer: 'Use the camera icon to scan price tags. I\'ll read the item name, price, and unit automatically using AI vision!'
    },

    // Luna
    {
        keywords: ['luna', 'assistant', 'voice', 'what can you do', 'help me with', 'capabilities'],
        question: 'What can Luna help me with?',
        answer: LUNA_CAPABILITIES
    }
];

export function findHelpAnswer(topic: string): string {
    const searchLower = topic.toLowerCase();

    // Find best matching topic
    let bestMatch: HelpTopic | null = null;
    let bestScore = 0;

    for (const help of HELP_TOPICS) {
        let score = 0;
        for (const keyword of help.keywords) {
            if (searchLower.includes(keyword)) {
                score += keyword.length; // Longer matches are better
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = help;
        }
    }

    if (bestMatch && bestScore > 0) {
        return bestMatch.answer;
    }

    return "I'm not sure about that. Try asking about price checking, shopping lists, shopping trips, or settings. Or tap Help in the menu for the full guide!";
}
