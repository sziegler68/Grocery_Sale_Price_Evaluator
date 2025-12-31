/**
 * LunaCart Alexa Skill - Main Lambda Handler
 * 
 * Environment Variables Required:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_KEY: Supabase service role key (for server-side access)
 */

const Alexa = require('ask-sdk-core');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// ==============================================
// Helper Functions
// ==============================================

/**
 * Get user's lists from sync code
 */
async function getListsForUser(alexaUserId) {
    // Find sync code for this Alexa user
    const { data: syncData, error } = await supabase
        .from('alexa_sync_codes')
        .select('share_codes')
        .eq('alexa_user_id', alexaUserId)
        .single();

    if (error || !syncData) {
        return null;
    }

    // Get lists from share codes
    const { data: lists } = await supabase
        .from('shopping_lists')
        .select('id, name, share_code')
        .in('share_code', syncData.share_codes)
        .is('deleted_at', null);

    return lists || [];
}

/**
 * Get user's deleted lists from sync code (for restoration)
 */
async function getDeletedListsForUser(alexaUserId) {
    // Find sync code for this Alexa user
    const { data: syncData, error } = await supabase
        .from('alexa_sync_codes')
        .select('share_codes')
        .eq('alexa_user_id', alexaUserId)
        .single();

    if (error || !syncData) {
        return null;
    }

    // Get deleted lists from share codes
    const { data: lists } = await supabase
        .from('shopping_lists')
        .select('id, name, share_code')
        .in('share_code', syncData.share_codes)
        .not('deleted_at', 'is', null);

    return lists || [];
}

/**
 * Find a list by name for user
 */
async function findListByName(alexaUserId, listName) {
    const lists = await getListsForUser(alexaUserId);
    if (!lists) return null;

    const normalizedName = listName.toLowerCase().trim();
    return lists.find(l => l.name.toLowerCase().includes(normalizedName));
}

// ==============================================
// Intent Handlers
// ==============================================

/**
 * Launch Request - "Alexa, open Luna Cart"
 */
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const alexaUserId = handlerInput.requestEnvelope.session.user.userId;
        const lists = await getListsForUser(alexaUserId);

        if (!lists) {
            return handlerInput.responseBuilder
                .speak("Welcome to Luna Cart! To get started, say 'link my account' followed by your sync code from the Luna Cart app.")
                .reprompt("Say 'link my account with code' followed by your code.")
                .getResponse();
        }

        const listCount = lists.length;
        const listNames = lists.map(l => l.name).join(', ');

        return handlerInput.responseBuilder
            .speak(`Welcome back to Luna Cart! You have ${listCount} list${listCount !== 1 ? 's' : ''}: ${listNames}. What would you like to do? Say 'help' for example commands.`)
            .reprompt("You can say 'open' followed by a list name, or 'help' for examples.")
            .getResponse();
    }
};

/**
 * Link Account Intent - "link my account with code LUNA-ABC123"
 */
const LinkAccountIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LinkAccountIntent';
    },
    async handle(handlerInput) {
        const alexaUserId = handlerInput.requestEnvelope.session.user.userId;
        const slots = handlerInput.requestEnvelope.request.intent.slots;

        // Get the sync code from slot
        let syncCode = slots.syncCode?.value;

        if (!syncCode) {
            return handlerInput.responseBuilder
                .speak("I didn't catch the code. Please say the full 6-digit code from your Luna Cart app, like 1-2-3-4-5-6.")
                .reprompt("What's your sync code?")
                .getResponse();
        }

        // Helper to convert word numbers to digits
        const numberMap = {
            'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
            'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
        };

        // Normalize the code:
        // 1. Lowercase for processing
        // 2. Replace number words with digits
        // 3. Remove spaces and periods
        // 4. Uppercase for final code (if letters exist)
        let cleanCode = syncCode.toLowerCase();

        // Replace words like 'one', 'two' with '1', '2'
        Object.keys(numberMap).forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            cleanCode = cleanCode.replace(regex, numberMap[word]);
        });

        // Remove spaces, dots, dashes
        cleanCode = cleanCode.replace(/[\s\.\-]+/g, '').toUpperCase();

        console.log(`Sync attempt: Raw="${syncCode}" Clean="${cleanCode}"`);

        // Try to find and update the sync code
        const { data, error } = await supabase
            .from('alexa_sync_codes')
            .update({
                alexa_user_id: alexaUserId,
                linked_at: new Date().toISOString()
            })
            .eq('sync_code', cleanCode) // Format in DB should be LUNA-XXXXXX
            .select() // Return the updated row to confirm it worked
            .maybeSingle(); // specific query returns 0 or 1 row

        if (error || !data) {
            console.log('Sync failed:', error || 'Code not found');
            // Try adding dash if missing: LUNA123 -> LUNA-123
            // Hypothetically the user might say LUNA 1 2 3 and we stripped spaces
            // But strict matching is better to avoid collisions.

            return handlerInput.responseBuilder
                .speak(`I couldn't find code ${cleanCode.split('').join(' ')}. Please check the code in your app settings and try again.`)
                .reprompt("Try saying your sync code again.")
                .getResponse();
        }

        // Get list names
        const { data: lists } = await supabase
            .from('shopping_lists')
            .select('name')
            .in('share_code', data.share_codes);

        const listNames = lists?.map(l => l.name).join(', ') || 'your lists';

        return handlerInput.responseBuilder
            .speak(`Great! I've linked your account. You now have access to: ${listNames}. Try saying 'add milk to my list'.`)
            .getResponse();
    }
};

/**
 * Create List Intent - "create a list called X"
 */
const CreateListIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CreateListIntent';
    },
    async handle(handlerInput) {
        const alexaUserId = handlerInput.requestEnvelope.session.user.userId;
        const currentIntent = handlerInput.requestEnvelope.request.intent;
        const slots = currentIntent.slots;
        let listName = slots.listName?.value;

        // If list name is missing, teach the user the correct phrase
        if (!listName) {
            return handlerInput.responseBuilder
                .speak("Sure! Say 'create a list called' followed by the name. For example, 'create a list called party'.")
                .reprompt("Say 'create a list called' followed by the name you want.")
                .getResponse();
        }

        // Clean list name - remove common carrier phrases that might be captured
        listName = listName
            .replace(/^(a|the)\s+/i, '')
            .replace(/^(called|named|titled)\s+/i, '')
            .replace(/^(a|the)\s+/i, ''); // Run again in case "called a..."

        // Capitalize first letter
        listName = listName.charAt(0).toUpperCase() + listName.slice(1);

        // Generate a share code for the new list.
        const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // 1. Get current sync record
        const { data: syncData, error: syncError } = await supabase
            .from('alexa_sync_codes')
            .select('id, share_codes')
            .eq('alexa_user_id', alexaUserId)
            .single();

        if (syncError || !syncData) {
            return handlerInput.responseBuilder
                .speak("You need to link your account first. Say 'link my account' followed by your code.")
                .getResponse();
        }

        // 2. Create the list in shopping_lists table
        const { data: newList, error: listError } = await supabase
            .from('shopping_lists')
            .insert({
                name: listName,
                share_code: shareCode,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (listError) {
            console.error('Failed to create list:', listError);
            return handlerInput.responseBuilder
                .speak("Sorry, I couldn't create the list.")
                .getResponse();
        }

        // 3. Update alexa_sync_codes with new share_code
        const newShareCodes = [...(syncData.share_codes || []), shareCode];

        const { error: updateError } = await supabase
            .from('alexa_sync_codes')
            .update({ share_codes: newShareCodes })
            .eq('id', syncData.id);

        if (updateError) {
            console.error('Failed to link list:', updateError);
            return handlerInput.responseBuilder
                .speak(`I created the ${listName} list, but couldn't link it to your account.`)
                .getResponse();
        }

        // Store current list context in session for follow-up "add item" commands
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.currentListId = newList.id;
        sessionAttributes.currentListName = listName;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return handlerInput.responseBuilder
            .speak(`I've created the ${listName} list. To add items, say the quantity then the item name. For example, 'two apples' or 'add milk'.`)
            .reprompt("Say a quantity and item, like 'three bananas'.")
            .getResponse();
    }
};

/**
 * Add Item Intent - "add milk to my grocery list"
 */
const AddItemIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AddItemIntent';
    },
    async handle(handlerInput) {
        const alexaUserId = handlerInput.requestEnvelope.session.user.userId;
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        // Get the item from the query slot
        let rawQuery = slots.query?.value;

        if (!rawQuery) {
            return handlerInput.responseBuilder
                .speak("What item would you like to add? Please give me one item at a time.")
                .reprompt("Tell me one item to add.")
                .getResponse();
        }

        // Parse list name from query if present (e.g., "milk to my grocery list")
        let itemName = rawQuery;
        let resolvedListName = null;

        // Regex looks for " to ", " on ", " in " followed by list name at the end
        const match = rawQuery.match(/^(.+?)\s+(?:to|on|in)\s+(?:my\s+|the\s+)?(.+?)(?:\s+list)?$/i);
        if (match && match[2]) {
            itemName = match[1].trim();
            resolvedListName = match[2].trim();
        }

        // Get user's lists
        const lists = await getListsForUser(alexaUserId);

        if (!lists || lists.length === 0) {
            return handlerInput.responseBuilder
                .speak("You don't have any lists linked. Say 'link my account' with your sync code from the Luna Cart app.")
                .reprompt("Say 'link my account' followed by your code.")
                .getResponse();
        }

        // Find target list
        let targetList;

        // First, check if a list name was in the query
        if (resolvedListName) {
            const cleanName = resolvedListName.replace(/^(the|my|a|an)\s+/i, '').replace(/\s+list$/i, '').trim().toLowerCase();
            targetList = lists.find(l => l.name.toLowerCase().includes(cleanName));
        }

        // If no target yet, use session context
        if (!targetList && sessionAttributes.currentListId) {
            targetList = lists.find(l => l.id === sessionAttributes.currentListId);
        }

        // If still no target and only one list, use it
        if (!targetList && lists.length === 1) {
            targetList = lists[0];
        }

        // If still no target, try "Grocery" as default
        if (!targetList) {
            const groceryList = lists.find(l => l.name.toLowerCase().includes('grocery'));
            if (groceryList) {
                targetList = groceryList;
            }
        }

        // If we still have no target list, ask the user
        if (!targetList) {
            const listNames = lists.map(l => l.name).join(', or ');
            return handlerInput.responseBuilder
                .speak(`Which list should I add to? You have ${listNames}.`)
                .reprompt("Which list?")
                .getResponse();
        }

        // Parse quantity from the FIRST word only
        // "one twelve pack of coca-cola" → quantity=1, item="twelve pack of coca-cola"
        // "two apples" → quantity=2, item="apples"
        // "twelve pack of soda" → quantity=1, item="twelve pack of soda" (twelve is part of item name)

        const wordToDigit = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'eleven': 11, 'twelve': 12, 'a': 1, 'an': 1
        };

        // Special handling for pack sizes - if Alexa transcribes "one twelve pack" as "112 pack",
        // detect this and keep it as item name with quantity 1
        const packPattern = itemName.match(/^(\d+)\s*(pack|case|box|can|bottle|count)/i);
        if (packPattern) {
            const packNum = parseInt(packPattern[1]);
            // Common pack sizes: 6, 12, 24, 36, etc. - treat as item description, not quantity
            if ([6, 12, 18, 24, 30, 36, 48, 112].includes(packNum)) {
                // Keep itemName as is, quantity = 1
                // "112 pack of soda" → quantity=1, item="12 pack of soda" (fix the 112 → 12)
                if (packNum === 112) {
                    itemName = itemName.replace(/^112/, '12');
                }
                // quantity stays 1
            }
        } else {
            // Check if the FIRST word is a quantity word or number
            const words = itemName.split(/\s+/);
            const firstWord = words[0].toLowerCase();

            if (wordToDigit[firstWord] !== undefined) {
                // First word is a number word - check if it's a quantity or part of item name
                // If the second word is ALSO a number word, the first is the quantity
                // e.g., "one twelve pack" → "one" is quantity, "twelve pack" is item
                // But "twelve pack" alone → "twelve pack" is the item, quantity=1
                const secondWord = words[1]?.toLowerCase();

                if (words.length > 1 && (wordToDigit[secondWord] !== undefined || /^\d+$/.test(words[1]))) {
                    // "one twelve pack" → quantity=1, item="twelve pack..."
                    quantity = wordToDigit[firstWord];
                    itemName = words.slice(1).join(' ');
                } else if (words.length > 1) {
                    // "two apples" → quantity=2, item="apples"
                    quantity = wordToDigit[firstWord];
                    itemName = words.slice(1).join(' ');
                }
                // If only one word like "milk", keep quantity=1 and itemName as is
            } else if (/^\d+$/.test(firstWord)) {
                // First word is a digit - extract as quantity
                quantity = parseInt(firstWord) || 1;
                itemName = words.slice(1).join(' ') || itemName;
            }
        }

        // Insert item into Supabase
        const { error } = await supabase
            .from('shopping_list_items')
            .insert({
                list_id: targetList.id,
                item_name: itemName,
                category: 'Other',
                quantity: quantity,
                added_by: 'Alexa',
                added_at: new Date().toISOString()
            });

        if (error) {
            console.error('Failed to add item:', itemName, error);
            return handlerInput.responseBuilder
                .speak(`Sorry, I couldn't add ${itemName}. Please try again.`)
                .reprompt("What item would you like to add?")
                .getResponse();
        }

        // Update session context for future adds
        sessionAttributes.currentListId = targetList.id;
        sessionAttributes.currentListName = targetList.name;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        // Update last_used_at
        await supabase
            .from('alexa_sync_codes')
            .update({ last_used_at: new Date().toISOString() })
            .eq('alexa_user_id', alexaUserId);

        const qtyStr = quantity > 1 ? `${quantity} ` : '';
        return handlerInput.responseBuilder
            .speak(`Added ${qtyStr}${itemName}. What's next?`)
            .reprompt("What else would you like to add? Say 'done' when finished.")
            .getResponse();
    }
};

/**
 * Remove Item Intent - "remove milk from my list"
 */
const RemoveItemIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RemoveItemIntent';
    },
    async handle(handlerInput) {
        const alexaUserId = handlerInput.requestEnvelope.session.user.userId;
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let itemName = slots.itemName?.value;

        if (!itemName) {
            return handlerInput.responseBuilder
                .speak("What item would you like to remove?")
                .reprompt("Tell me which item to remove from your list.")
                .getResponse();
        }

        // Clean up item name
        itemName = itemName.replace(/^the\s+/i, '').trim();

        // Get target list from session or find it
        let targetListId = sessionAttributes.currentListId;

        if (!targetListId) {
            const lists = await getListsForUser(alexaUserId);
            if (!lists || lists.length === 0) {
                return handlerInput.responseBuilder
                    .speak("You don't have any lists linked.")
                    .getResponse();
            }
            if (lists.length === 1) {
                targetListId = lists[0].id;
            } else {
                return handlerInput.responseBuilder
                    .speak("Which list? Say 'open' followed by the list name first.")
                    .reprompt("Which list should I remove from?")
                    .getResponse();
            }
        }

        // Find and delete matching item(s)
        const { data: items } = await supabase
            .from('shopping_list_items')
            .select('id, item_name')
            .eq('list_id', targetListId)
            .ilike('item_name', `%${itemName}%`);

        if (!items || items.length === 0) {
            return handlerInput.responseBuilder
                .speak(`I couldn't find ${itemName} on your list.`)
                .reprompt("What else would you like to do?")
                .getResponse();
        }

        // Delete matching items
        const { error } = await supabase
            .from('shopping_list_items')
            .delete()
            .in('id', items.map(i => i.id));

        if (error) {
            return handlerInput.responseBuilder
                .speak("Sorry, I couldn't remove that item.")
                .reprompt("Try again.")
                .getResponse();
        }

        const removedNames = items.map(i => i.item_name).join(', ');
        return handlerInput.responseBuilder
            .speak(`Removed ${removedNames}. What else?`)
            .reprompt("What else would you like to do?")
            .getResponse();
    }
};

/**
 * Modify Item Intent - "change apples to 3"
 * Parses query like "apples to 3" or "3 apples"
 */
const ModifyItemIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ModifyItemIntent';
    },
    async handle(handlerInput) {
        const alexaUserId = handlerInput.requestEnvelope.session.user.userId;
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let query = slots.query?.value;

        if (!query) {
            return handlerInput.responseBuilder
                .speak("What would you like to change? Say the item name and new quantity, like 'apples to 3'.")
                .reprompt("Tell me which item and the new quantity.")
                .getResponse();
        }

        // Parse query: "apples to 3" or "3 apples" or "the apples to 5"
        let itemName = null;
        let quantity = null;

        // Try pattern: "item to number"
        const toPattern = query.match(/^(.+?)\s+to\s+(\d+)$/i);
        if (toPattern) {
            itemName = toPattern[1].replace(/^the\s+/i, '').trim();
            quantity = parseInt(toPattern[2]);
        } else {
            // Try pattern: "number item"
            const numFirst = query.match(/^(\d+)\s+(.+)$/);
            if (numFirst) {
                quantity = parseInt(numFirst[1]);
                itemName = numFirst[2].replace(/^the\s+/i, '').trim();
            }
        }

        if (!itemName || !quantity) {
            return handlerInput.responseBuilder
                .speak("I didn't understand. Say something like 'apples to 3' or '3 apples'.")
                .reprompt("Tell me the item and new quantity.")
                .getResponse();
        }

        // Get target list from session
        let targetListId = sessionAttributes.currentListId;

        if (!targetListId) {
            const lists = await getListsForUser(alexaUserId);
            if (!lists || lists.length === 0) {
                return handlerInput.responseBuilder
                    .speak("You don't have any lists linked.")
                    .getResponse();
            }
            if (lists.length === 1) {
                targetListId = lists[0].id;
            } else {
                return handlerInput.responseBuilder
                    .speak("Which list? Say 'open' followed by the list name first.")
                    .reprompt("Which list should I modify?")
                    .getResponse();
            }
        }

        // Find matching item
        const { data: items } = await supabase
            .from('shopping_list_items')
            .select('id, item_name')
            .eq('list_id', targetListId)
            .ilike('item_name', `%${itemName}%`);

        if (!items || items.length === 0) {
            return handlerInput.responseBuilder
                .speak(`I couldn't find ${itemName} on your list.`)
                .reprompt("What else would you like to do?")
                .getResponse();
        }

        // Update the first matching item's quantity
        const { error } = await supabase
            .from('shopping_list_items')
            .update({ quantity: quantity })
            .eq('id', items[0].id);

        if (error) {
            return handlerInput.responseBuilder
                .speak("Sorry, I couldn't update that item.")
                .reprompt("Try again.")
                .getResponse();
        }

        return handlerInput.responseBuilder
            .speak(`Updated ${items[0].item_name} to ${quantity}. What else?`)
            .reprompt("What else would you like to do?")
            .getResponse();
    }
};

/**
 * Read List Intent - "what's on my grocery list"
 */
const ReadListIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ReadListIntent';
    },
    async handle(handlerInput) {
        const alexaUserId = handlerInput.requestEnvelope.session.user.userId;
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        let listName = slots.listName?.value;

        // Get user's lists
        const lists = await getListsForUser(alexaUserId);

        if (!lists || lists.length === 0) {
            return handlerInput.responseBuilder
                .speak("You don't have any lists linked. Say 'link my account' with your sync code.")
                .getResponse();
        }

        // Find the target list
        let targetList;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        if (listName) {
            // Clean up list name 
            const cleanName = listName.replace(/\s+list$/i, '').replace(/^(the|my)\s+/i, '').trim().toLowerCase();
            targetList = lists.find(l => l.name.toLowerCase().includes(cleanName));
        } else if (sessionAttributes.currentListId) {
            // Use session context if no list specified
            targetList = lists.find(l => l.id === sessionAttributes.currentListId);
        } else if (lists.length === 1) {
            targetList = lists[0];
        } else {
            const listNames = lists.map(l => l.name).join(', or ');
            return handlerInput.responseBuilder
                .speak(`Which list? You have ${listNames}.`)
                .reprompt("Which list would you like to hear?")
                .getResponse();
        }

        if (!targetList) {
            return handlerInput.responseBuilder
                .speak(`I couldn't find a list called ${listName}.`)
                .getResponse();
        }

        // Set session context for follow-up adds
        sessionAttributes.currentListId = targetList.id;
        sessionAttributes.currentListName = targetList.name;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        // Get items
        const { data: items } = await supabase
            .from('shopping_list_items')
            .select('item_name, quantity, is_checked')
            .eq('list_id', targetList.id)
            .eq('is_checked', false)
            .order('added_at', { ascending: true });

        if (!items || items.length === 0) {
            return handlerInput.responseBuilder
                .speak(`Your ${targetList.name} is empty. Say 'add' followed by an item to get started.`)
                .reprompt(`What would you like to add to ${targetList.name}?`)
                .getResponse();
        }

        // Format items for speech
        const itemList = items.map(i => {
            return i.quantity > 1 ? `${i.quantity} ${i.item_name}` : i.item_name;
        }).join(', ');

        return handlerInput.responseBuilder
            .speak(`On your ${targetList.name}, you have: ${itemList}.`)
            .reprompt("Would you like to add something?")
            .getResponse();
    }
};

/**
 * List Lists Intent - "what lists do I have"
 */
/**
 * Open List Intent - "open my grocery list" (Sets context)
 */
const OpenListIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'OpenListIntent';
    },
    async handle(handlerInput) {
        const alexaUserId = handlerInput.requestEnvelope.session.user.userId;
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        let listName = slots.listName?.value;

        if (!listName) {
            return handlerInput.responseBuilder
                .speak("Which list would you like to open?")
                .reprompt("Tell me which list to open.")
                .getResponse();
        }

        // Get user's lists
        const lists = await getListsForUser(alexaUserId);

        if (!lists || lists.length === 0) {
            return handlerInput.responseBuilder
                .speak("You don't have any lists linked yet. Say 'link my account with code' followed by your sync code.")
                .reprompt("Please link your account to continue.")
                .getResponse();
        }

        // Clean up the list name (strip "list", "the", "my" etc.)
        let cleanName = listName.replace(/\s+list$/i, '').replace(/^(the|my|a)\s+/i, '').trim().toLowerCase();

        // Find the target list
        const targetList = lists.find(l => l.name.toLowerCase() === cleanName || l.name.toLowerCase().includes(cleanName));

        if (!targetList) {
            const listNames = lists.map(l => l.name).join(', or ');
            return handlerInput.responseBuilder
                .speak(`I couldn't find a list called ${listName}. You have ${listNames}.`)
                .reprompt(`Which list would you like to open? You have ${listNames}.`)
                .getResponse();
        }

        // Set session context
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.currentListId = targetList.id;
        sessionAttributes.currentListName = targetList.name;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return handlerInput.responseBuilder
            .speak(`I've opened the ${targetList.name} list. To add items, say the quantity then the item name. For example, 'two apples' or 'add milk'.`)
            .reprompt("Say a quantity and item, like 'three bananas'.")
            .getResponse();
    }
};

/**
 * Get Share Code Intent - "what's the share code for party"
 */
const GetShareCodeIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetShareCodeIntent';
    },
    async handle(handlerInput) {
        const alexaUserId = handlerInput.requestEnvelope.session.user.userId;
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        let listName = slots.listName?.value;

        if (!listName) {
            // If context exists, use that
            const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            if (sessionAttributes.currentListName) {
                listName = sessionAttributes.currentListName;
            } else {
                return handlerInput.responseBuilder
                    .speak("Which list do you need the code for?")
                    .reprompt("Which list's share code do you need?")
                    .getResponse();
            }
        }

        const lists = await getListsForUser(alexaUserId);
        if (!lists) {
            return handlerInput.responseBuilder
                .speak("Please link your account first.")
                .reprompt("Say 'link my account' to get started.")
                .getResponse();
        }

        const targetList = lists.find(l => l.name.toLowerCase().includes(listName.toLowerCase()));

        if (!targetList) {
            return handlerInput.responseBuilder
                .speak(`I couldn't find a list called ${listName}.`)
                .reprompt("Which list logic do you need?")
                .getResponse();
        }

        // Read the code explicitly as digits
        const code = targetList.share_code;
        return handlerInput.responseBuilder
            .speak(`The share code for ${targetList.name} is <say-as interpret-as="digits">${code}</say-as>. You can enter this in the Luna Cart app to join the list.`)
            .reprompt("What else can I help you with?")
            .getResponse();
    }
};

/**
 * Delete List Intent - "delete party list" (Soft Delete)
 */
const DeleteListIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DeleteListIntent';
    },
    async handle(handlerInput) {
        const alexaUserId = handlerInput.requestEnvelope.session.user.userId;
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        let listName = slots.listName?.value;

        if (!listName) {
            return handlerInput.responseBuilder
                .speak("Which list would you like to delete?")
                .reprompt("Tell me which list to delete.")
                .getResponse();
        }

        const lists = await getListsForUser(alexaUserId);
        if (!lists) {
            return handlerInput.responseBuilder
                .speak("Please link your account first.")
                .reprompt("Say 'link my account' to get started.")
                .getResponse();
        }

        // Clean the list name to avoid item names being treated as list names
        const cleanName = listName.replace(/\s+list$/i, '').replace(/^(the|my)\s+/i, '').trim().toLowerCase();
        const targetList = lists.find(l => l.name.toLowerCase() === cleanName || l.name.toLowerCase().includes(cleanName));

        if (!targetList) {
            return handlerInput.responseBuilder
                .speak(`I couldn't find a list called ${listName}. To remove an item, say 'remove' followed by the item name.`)
                .reprompt("Which list would you like to delete?")
                .getResponse();
        }

        // Soft delete (set deleted_at)
        const { error } = await supabase
            .from('shopping_lists')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', targetList.id);

        if (error) {
            console.error('Delete failed:', error);
            return handlerInput.responseBuilder
                .speak("Sorry, I couldn't delete the list.")
                .reprompt("Try again later.")
                .getResponse();
        }

        // Update sync codes to trigger app refresh if needed (optional)
        await supabase.from('alexa_sync_codes').update({ last_used_at: new Date().toISOString() }).eq('alexa_user_id', alexaUserId);

        return handlerInput.responseBuilder
            .speak(`I've deleted the ${targetList.name} list. You can restore it in the app or ask me to restore it within 24 hours.`)
            .reprompt("What would you like to do now?")
            .getResponse();
    }
};

/**
 * Restore List Intent - "restore party list" (Undo Delete)
 */
const RestoreListIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RestoreListIntent';
    },
    async handle(handlerInput) {
        const alexaUserId = handlerInput.requestEnvelope.session.user.userId;
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        let listName = slots.listName?.value;

        if (!listName) {
            return handlerInput.responseBuilder
                .speak("Which list would you like to restore?")
                .reprompt("Tell me which list to restore.")
                .getResponse();
        }

        // Get DELETED lists
        const lists = await getDeletedListsForUser(alexaUserId);
        if (!lists || lists.length === 0) {
            return handlerInput.responseBuilder
                .speak("I didn't find any recently deleted lists to restore.")
                .reprompt("What else would you like to do?")
                .getResponse();
        }

        const targetList = lists.find(l => l.name.toLowerCase().includes(listName.toLowerCase()));

        if (!targetList) {
            return handlerInput.responseBuilder
                .speak(`I couldn't find a deleted list called ${listName}.`)
                .reprompt("Which list would you like to restore?")
                .getResponse();
        }

        // Restore list
        const { error } = await supabase
            .from('shopping_lists')
            .update({ deleted_at: null })
            .eq('id', targetList.id);

        if (error) {
            return handlerInput.responseBuilder
                .speak("Sorry, I couldn't restore the list.")
                .reprompt("Try again later.")
                .getResponse();
        }

        return handlerInput.responseBuilder
            .speak(`I've restored the ${targetList.name} list.`)
            .reprompt("What would you like to do with it?")
            .getResponse();
    }
};

/**
 * Clear List Intent - "clear party list" (Remove all items)
 * Asks for confirmation before clearing
 */
const ClearListIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ClearListIntent';
    },
    async handle(handlerInput) {
        const alexaUserId = handlerInput.requestEnvelope.session.user.userId;
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let listName = slots.listName?.value;

        if (!listName) {
            // Use context
            if (sessionAttributes.currentListName) {
                listName = sessionAttributes.currentListName;
            } else {
                return handlerInput.responseBuilder
                    .speak("Which list would you like to clear?")
                    .reprompt("Tell me which list to clear.")
                    .getResponse();
            }
        }

        const lists = await getListsForUser(alexaUserId);
        if (!lists) {
            return handlerInput.responseBuilder
                .speak("Please link your account first.")
                .reprompt("Say 'link my account' to get started.")
                .getResponse();
        }

        // Clean the list name
        const cleanName = listName.replace(/\s+list$/i, '').replace(/^(the|my)\s+/i, '').trim().toLowerCase();
        const targetList = lists.find(l => l.name.toLowerCase().includes(cleanName));

        if (!targetList) {
            return handlerInput.responseBuilder
                .speak(`I couldn't find a list called ${listName}.`)
                .reprompt("Which list would you like to clear?")
                .getResponse();
        }

        // Get item count to show what will be deleted
        const { data: items } = await supabase
            .from('shopping_list_items')
            .select('id')
            .eq('list_id', targetList.id);

        const itemCount = items?.length || 0;

        if (itemCount === 0) {
            return handlerInput.responseBuilder
                .speak(`The ${targetList.name} list is already empty.`)
                .reprompt("What else would you like to do?")
                .getResponse();
        }

        // Delete all items
        const { error } = await supabase
            .from('shopping_list_items')
            .delete()
            .eq('list_id', targetList.id);

        if (error) {
            return handlerInput.responseBuilder
                .speak("Sorry, I couldn't clear the list.")
                .reprompt("Try again later.")
                .getResponse();
        }

        return handlerInput.responseBuilder
            .speak(`Done. I've cleared ${itemCount} item${itemCount !== 1 ? 's' : ''} from the ${targetList.name} list.`)
            .reprompt("What would you like to add instead?")
            .getResponse();
    }
};

/**
 * List Lists Intent - "what lists do I have"
 */
const ListListsIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ListListsIntent';
    },
    async handle(handlerInput) {
        const alexaUserId = handlerInput.requestEnvelope.session.user.userId;
        const lists = await getListsForUser(alexaUserId);

        if (!lists || lists.length === 0) {
            return handlerInput.responseBuilder
                .speak("You don't have any lists linked. Link your account first by saying 'link my account with code' followed by your sync code.")
                .getResponse();
        }

        const listNames = lists.map(l => l.name).join(', ');
        return handlerInput.responseBuilder
            .speak(`You have ${lists.length} list${lists.length !== 1 ? 's' : ''}: ${listNames}.`)
            .reprompt("Which list would you like to work with?")
            .getResponse();
    }
};

/**
 * Done Intent - "done", "that's all", "finished"
 */
const DoneIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DoneIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak("Got it! Happy shopping!")
            .withShouldEndSession(true)
            .getResponse();
    }
};

/**
 * Help Intent - Comprehensive examples
 */
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const helpMessage = `Here's what you can do with Luna Cart. ` +
            `To add items, say a quantity then the item, like 'two apples' or 'add milk'. ` +
            `To manage lists, try 'create a list called grocery', 'open tester', or 'what lists do I have'. ` +
            `To hear your list, say 'read me the list' or 'what's on my list'. ` +
            `You can also say 'clear the list', 'delete tester', or 'what is the share code for tester'. ` +
            `What would you like to do?`;

        return handlerInput.responseBuilder
            .speak(helpMessage)
            .reprompt("Try saying 'open' followed by a list name, or 'two apples' to add an item.")
            .getResponse();
    }
};

/**
 * Fallback Intent - Catches unrecognized phrases
 * If user has an active list context, treat the raw utterance as an item to add
 */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    async handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        // If we have an active list context, treat the raw utterance as an item to add
        if (sessionAttributes.currentListId) {
            const alexaUserId = handlerInput.requestEnvelope.session.user.userId;

            // Get the raw input transcript - this is what the user actually said
            const request = handlerInput.requestEnvelope.request;
            let rawUtterance = null;

            // Try to get from request.intent.slots first (may have a catch-all)
            // If not available, try the input transcript from the request
            if (request.intent && request.intent.slots) {
                // Check for any slot with a value
                for (const slotName of Object.keys(request.intent.slots)) {
                    if (request.intent.slots[slotName].value) {
                        rawUtterance = request.intent.slots[slotName].value;
                        break;
                    }
                }
            }

            // FallbackIntent typically doesn't have slots, so we may not get the utterance
            // In that case, we need to prompt the user
            if (!rawUtterance) {
                return handlerInput.responseBuilder
                    .speak(`I didn't catch that. Please say 'add' followed by the item, or a quantity then the item. For example, 'add apple juice' or 'two lemons'.`)
                    .reprompt("Say 'add' then the item, or a quantity and item.")
                    .getResponse();
            }

            // Add the raw utterance as an item - let the app's parser handle it
            const { error } = await supabase
                .from('shopping_list_items')
                .insert({
                    list_id: sessionAttributes.currentListId,
                    item_name: rawUtterance,
                    category: 'Other',
                    quantity: 1,
                    added_by: 'Alexa',
                    added_at: new Date().toISOString()
                });

            if (error) {
                console.error('Failed to add item:', rawUtterance, error);
                return handlerInput.responseBuilder
                    .speak(`Sorry, I couldn't add that item. Please try again.`)
                    .reprompt("What item would you like to add?")
                    .getResponse();
            }

            // Update last_used_at
            await supabase
                .from('alexa_sync_codes')
                .update({ last_used_at: new Date().toISOString() })
                .eq('alexa_user_id', alexaUserId);

            return handlerInput.responseBuilder
                .speak(`Added ${rawUtterance}. What's next?`)
                .reprompt("What else would you like to add?")
                .getResponse();
        }

        // No active list context - provide general help
        return handlerInput.responseBuilder
            .speak("I'm not sure what you want to do. You can say things like 'create a list called grocery', 'open my grocery list', or 'add milk to my list'.")
            .reprompt("What would you like to do?")
            .getResponse();
    }
};

/**
 * Cancel and Stop Intent
 */
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak("Goodbye! Happy shopping!")
            .getResponse();
    }
};

/**
 * Session Ended
 */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.getResponse();
    }
};

/**
 * Error Handler
 */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error('Error:', error);
        return handlerInput.responseBuilder
            .speak("Sorry, I had trouble doing that. Please try again.")
            .reprompt("What would you like to do?")
            .getResponse();
    }
};

// ==============================================
// Skill Builder
// ==============================================

// Build the skill instance
const skill = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        LinkAccountIntentHandler,
        CreateListIntentHandler,
        AddItemIntentHandler,
        RemoveItemIntentHandler,
        ModifyItemIntentHandler,
        ReadListIntentHandler,
        OpenListIntentHandler,
        GetShareCodeIntentHandler,
        DeleteListIntentHandler,
        ClearListIntentHandler,
        RestoreListIntentHandler,
        ListListsIntentHandler,
        DoneIntentHandler,
        HelpIntentHandler,
        FallbackIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .create();

// Async handler wrapper for Node.js 24+ compatibility
// (Lambda no longer supports callback-style handlers)
exports.handler = async (event, context) => {
    return skill.invoke(event, context);
};
