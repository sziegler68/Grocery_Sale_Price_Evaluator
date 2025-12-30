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
            .speak(`Welcome back to Luna Cart! You have ${listCount} list${listCount !== 1 ? 's' : ''}: ${listNames}. What would you like to do?`)
            .reprompt("You can say things like 'add milk to my grocery list' or 'what's on my list'.")
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
            .speak(`I've created the ${listName} list. What would you like to add to it?`)
            .reprompt("What would you like to add?")
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

        // Get the single catch-all query slot
        const rawQuery = slots.query?.value;

        if (!rawQuery) {
            return handlerInput.responseBuilder
                .speak("What would you like to add?")
                .reprompt("Tell me what item to add to your list.")
                .getResponse();
        }

        // Parse query: "milk to my grocery list" -> item: "milk", list: "grocery"
        // Regex looks for " to ", " on ", " in " as separators
        const match = rawQuery.match(/^(.+?)(?:\s+(?:to|on|in)\s+(?:my\s+)?(.+?)(?:\s+list)?)?$/i);

        let fullItemPart = rawQuery;
        let listName = null;

        if (match) {
            fullItemPart = match[1].trim(); // "milk and eggs"
            if (match[2]) {
                listName = match[2].trim(); // "grocery"
            }
        }

        // Get user's lists
        const lists = await getListsForUser(alexaUserId);

        if (!lists || lists.length === 0) {
            return handlerInput.responseBuilder
                .speak("You don't have any lists linked. Say 'link my account' with your sync code from the Luna Cart app.")
                .getResponse();
        }

        // Find the target list
        let targetList;
        if (listName) {
            targetList = lists.find(l => l.name.toLowerCase().includes(listName.toLowerCase()));
        } else if (lists.length === 1) {
            targetList = lists[0];
        } else {
            // Check for session context (e.g., just created a list)
            const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            if (sessionAttributes.currentListId) {
                targetList = lists.find(l => l.id === sessionAttributes.currentListId);
            }

            // If still no target, try "Grocery" as default
            if (!targetList) {
                const groceryList = lists.find(l => l.name.toLowerCase().includes('grocery'));
                if (groceryList) {
                    targetList = groceryList;
                }
            }

            // If still no target, ask the user
            if (!targetList) {
                const listNames = lists.map(l => l.name).join(', or ');
                return handlerInput.responseBuilder
                    .speak(`Which list? You have ${listNames}.`)
                    .reprompt("Which list should I add to?")
                    .getResponse();
            }
        }

        if (!targetList) {
            return handlerInput.responseBuilder
                .speak(`I couldn't find a list called ${listName}. Say 'what lists do I have' to see your lists.`)
                .getResponse();
        }

        // Parse individual items by splitting on " and "
        // "two gallons of milk and three lemons" -> ["two gallons of milk", "three lemons"]
        const rawItems = fullItemPart.split(/\s+and\s+/i);
        const addedItems = [];
        const failedItems = [];

        for (const rawItem of rawItems) {
            let itemName = rawItem.trim();
            let quantity = 1;

            // Parse quantity if present ("2 milk", "two gallons")
            // We only handle digits here for simplicity, or we could re-use our word map
            // Keeping it simple for now: regex for leading digits
            const qtyMatch = itemName.match(/^(\d+)\s+(.+)/);
            if (qtyMatch) {
                quantity = parseInt(qtyMatch[1]) || 1;
                itemName = qtyMatch[2];
            }

            // Insert into Supabase
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
                failedItems.push(itemName);
            } else {
                const qtyStr = quantity > 1 ? `${quantity} ` : '';
                addedItems.push(`${qtyStr}${itemName}`);
            }
        }

        // Construct response
        let speakOutput = '';
        if (addedItems.length > 0) {
            // Join with commas and "and" for last item
            const itemsStr = addedItems.length === 1
                ? addedItems[0]
                : `${addedItems.slice(0, -1).join(', ')} and ${addedItems[addedItems.length - 1]}`;

            speakOutput = `Added ${itemsStr} to ${targetList.name}.`;
        }

        if (failedItems.length > 0) {
            speakOutput += ` I had trouble adding ${failedItems.join(', ')}.`;
        }

        if (addedItems.length === 0 && failedItems.length > 0) {
            speakOutput = "Sorry, I couldn't add those items. Please try again.";
        }

        // Update last_used_at
        await supabase
            .from('alexa_sync_codes')
            .update({ last_used_at: new Date().toISOString() })
            .eq('alexa_user_id', alexaUserId);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("What else would you like to add?")
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
        if (listName) {
            targetList = lists.find(l => l.name.toLowerCase().includes(listName.toLowerCase()));
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
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
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

        // Find the target list
        const targetList = lists.find(l => l.name.toLowerCase().includes(listName.toLowerCase()));

        if (!targetList) {
            return handlerInput.responseBuilder
                .speak(`I couldn't find a list called ${listName}.`)
                .reprompt("Which list would you like to open?")
                .getResponse();
        }

        // Set session context
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.currentListId = targetList.id;
        sessionAttributes.currentListName = targetList.name;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return handlerInput.responseBuilder
            .speak(`I've opened the ${targetList.name} list. What would you like to add?`)
            .reprompt("What would you like to add?")
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

        const targetList = lists.find(l => l.name.toLowerCase().includes(listName.toLowerCase()));

        if (!targetList) {
            return handlerInput.responseBuilder
                .speak(`I couldn't find a list called ${listName}.`)
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
 */
const ClearListIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ClearListIntent';
    },
    async handle(handlerInput) {
        const alexaUserId = handlerInput.requestEnvelope.session.user.userId;
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        let listName = slots.listName?.value;

        if (!listName) {
            // Use context
            const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
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

        const targetList = lists.find(l => l.name.toLowerCase().includes(listName.toLowerCase()));

        if (!targetList) {
            return handlerInput.responseBuilder
                .speak(`I couldn't find a list called ${listName}.`)
                .reprompt("Which list would you like to clear?")
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
            .speak(`I've cleared all items from the ${targetList.name} list.`)
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
 * Help Intent
 */
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak("You can say things like: add milk to my list, create a list called party, open my grocery list, or delete my party list. What would you like to do?")
            .reprompt("Try saying 'add eggs to my list'.")
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

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        LinkAccountIntentHandler,
        CreateListIntentHandler,
        AddItemIntentHandler,
        ReadListIntentHandler,
        OpenListIntentHandler,
        GetShareCodeIntentHandler,
        DeleteListIntentHandler,
        ClearListIntentHandler,
        RestoreListIntentHandler,
        ListListsIntentHandler,
        DoneIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
