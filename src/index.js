/**
 * ╰(*°▽°*)╯ Chatty Gifford ╰(*°▽°*)╯
 * 
 * Display GIFs driven by live Twitch chat messages and GIF search APIs.
 *  
 * Use as a browser source in OBS / your streaming tool of choice.
 **/

import log from './modules/log.js';

import MessageProcess from "./modules/MessageProcess.js";
import ChatClient from "./modules/ChatClient.js";
import GifDisplay from "./modules/GifDisplay.js";
import { randomSort } from './modules/Utils.js';

const config = window.chatgifconfig;

/** @type {MessageProcess} */
let messageProcess;

/** @type {ChatClient} */
let chatClient;

/** @type {GifDisplay} */
let gifDisplay = null;

const getEmoteURI = emoteId => `https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/3.0`;

/**
 * Called from the ChatClient, receives all regular Twitch chat messages
 * @param {*} message 
 */
const handleChatMessage = (message, context) => {

    const original = message;
    const { words, sentimentScore, salient } = messageProcess.parse(message, config.gif.behaviour.ignore);

    let query = words.join(" ");

    const maxQueryLength = gifDisplay.gifSearch.providerConfig.maxQueryLength;

    if (query.length > maxQueryLength) {
        log("query too long, searching salient terms only...");
        query = '';
        salient.sort(randomSort);
        salient.forEach((s) => { if (s.length + query.length < maxQueryLength) query += `${s} `; });
        // still too long? just truncate
        if (query.length > maxQueryLength) query = query.substring(0, maxQueryLength - 1);
    }


    // message has a negative/positive sentiment score?
    if (query.length > 0 && config.gif.enabled) {
        log(`query: ${query}`);
        const behaviour = config.gif.behaviour;
        // send query to the gif search api
        if (behaviour.general.enabled || (behaviour.sentiments.enabled && sentimentScore.populated)) {
            log(`sending query...`);
            gifDisplay.query(query);
        }
    }
};



/**
 * construct and configure
 */
const init = () => {

    // override config values with querysting parameters if present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("channel")) config.channel = urlParams.get('channel');

    window.handleChatMessage = handleChatMessage; // to test 

    messageProcess = new MessageProcess();
    chatClient = new ChatClient(config, handleChatMessage);

    if (config.gif.enabled) gifDisplay = new GifDisplay(config.gif, urlParams, chatClient);
}

init();