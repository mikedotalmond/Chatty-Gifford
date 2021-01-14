/**
 * ╰(*°▽°*)╯ Giffing Wall Sentimental ╰(*°▽°*)╯
 * 
 * Display a wall of GIFs driven by a simple Twitch
 * live chat sentiment analysis and the Giphy search API.
 *  
 * Use as a browser source in OBS / your streaming tool of choice.
 **/


import log from './modules/log.js';

import SentimentScores from "./modules/SentimentScores.js";
import ChatClient from "./modules/ChatClient.js";
import GifWall from "./modules/GifWall.js";

const config = window.sentimentWall.config;


/** @type {SentimentScores} */
let sentimental;

/** @type {ChatClient} */
let chatClient;

/** @type {GifWall} */
let gifWall = null;

const getEmoteURI = emoteId => `https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/3.0`;

/**
 * Called from the ChatClient, receives all regular Twitch chat messages
 * @param {*} message 
 */
const handleChatMessage = (message, context) => {

    const original = message;
    const { text, score } = sentimental.processMessage(message);

    // message has a negative/positive sentiment score?
    if (score.populated) {

        log({ text, original, score });

        // sentiment gifs
        if (config.gifs.enabled) gifWall.update(text);

        // sentiment emoji
        if (config.sentiments.enabled) {
            // TODO - improve this quick test... because it's terrible.
            let totalScore = Math.round((score.positive + score.negative) / 2.0);
            totalScore = Math.min(5, Math.max(totalScore, -5));
            log(`sentiment score:${totalScore}`);
            //
            document.querySelectorAll('.sentiment-emoji').forEach(element => {
                const v = parseInt(element.dataset.sentimentscore);
                if (totalScore == v) {
                    element.classList.remove("off");
                    element.classList.add("on");
                } else {
                    element.classList.remove("on");
                    element.classList.add("off");
                }
            });
        }
    }

    // chat emotes
    if (config.emotes.enabled && context.emotes != null) {
        const emoteList = chatClient.extractEmotes(context.emotes);
        for (let i in emoteList) {
            const emoteUri = getEmoteURI(emoteList[i].id);
            log(emoteUri);
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

    //
    if (config.sentiments.enabled) {
        // setup sentiment emoji
    } else {
        document.querySelector('#sentiment-emoji-wrap').style.display = 'none';
    }

    window.handleChatMessage = handleChatMessage; // to test 

    sentimental = new SentimentScores();
    chatClient = new ChatClient(config, handleChatMessage);

    if (config.gifs.enabled) gifWall = new GifWall(config.gifs, urlParams, chatClient);
}

init();