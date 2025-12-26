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
                .speak("I didn't catch the code. Please say the full code from your Luna Cart app, like LUNA-A-B-C-1-2-3.")
                .reprompt("What's your sync code?")
                .getResponse();
        }

        // Normalize the code (handle spoken letters)
        syncCode = syncCode.toUpperCase().replace(/\s+/g, '');
        if (!syncCode.startsWith('LUNA-')) {
            syncCode = 'LUNA-' + syncCode.replace('LUNA', '');
        }

        // Try to find and update the sync code
        const { data, error } = await supabase
            .from('alexa_sync_codes')
            .update({
                alexa_user_id: alexaUserId,
                linked_at: new Date().toISOString()
            })
            .eq('sync_code', syncCode)
            .select()
            .single();

        if (error || !data) {
            return handlerInput.responseBuilder
                .speak("I couldn't find that code. Make sure you've generated a sync code in the Luna Cart app's Settings page.")
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

        const itemName = slots.item?.value;
        let listName = slots.listName?.value;
        const quantity = slots.quantity?.value || '1';

        if (!itemName) {
            return handlerInput.responseBuilder
                .speak("What would you like to add?")
                .reprompt("Tell me what item to add to your list.")
                .getResponse();
        }

        // Get user's lists
        const lists = await getListsForUser(alexaUserId);

        if (!lists || lists.length === 0) {
            return handlerInput.responseBuilder
                .speak("You don't have any lists linked. Say 'link my account' with your sync code from the app.")
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
                .reprompt("Which list should I add to?")
                .getResponse();
        }

        if (!targetList) {
            return handlerInput.responseBuilder
                .speak(`I couldn't find a list called ${listName}. Say 'what lists do I have' to see your lists.`)
                .getResponse();
        }

        // Add the item
        const { error } = await supabase
            .from('shopping_list_items')
            .insert({
                list_id: targetList.id,
                item_name: itemName,
                category: 'Other',
                quantity: parseInt(quantity) || 1,
                added_by: 'Alexa',
                added_at: new Date().toISOString()
            });

        if (error) {
            console.error('Failed to add item:', error);
            return handlerInput.responseBuilder
                .speak("Sorry, I couldn't add that item. Please try again.")
                .getResponse();
        }

        // Update last_used_at
        await supabase
            .from('alexa_sync_codes')
            .update({ last_used_at: new Date().toISOString() })
            .eq('alexa_user_id', alexaUserId);

        const qtyText = quantity !== '1' ? `${quantity} ` : '';
        return handlerInput.responseBuilder
            .speak(`Added ${qtyText}${itemName} to ${targetList.name}.`)
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
 * Help Intent
 */
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak("You can say things like: add milk to my list, what's on my grocery list, or what lists do I have. What would you like to do?")
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
        AddItemIntentHandler,
        ReadListIntentHandler,
        ListListsIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
