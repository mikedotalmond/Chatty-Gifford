/**
 * ╰(*°▽°*)╯ Giffing Wall Sentimental ╰(*°▽°*)╯
 * 
 * Display a wall of GIFs driven by a simple Twitch
 * live chat sentiment analysis and the Giphy search API.
 *  
 * Use as a browser source in OBS / your streaming tool of choice.
 **/

import afinn from 'afinn-165';
import nlp from 'compromise'
import Masonry from 'masonry-layout';

import { setTimeout } from 'timers-browserify';

import log from './modules/log.js';

import ChatClient from "./modules/ChatClient.js";
import GiphySearch from "./modules/GiphySearch.js";

const config = window.sentimentWall.config;
const afinnKeys = Object.keys(afinn);
const gifContainer = document.getElementById("gif-container");

const rndInt = n => (Math.random() * n) | 0;
const genRandomId = () => rndInt(0xffffff7).toString(36);
const randomSort = (a, b) => (Math.random() >= 0.5) ? -1 : 1;
const filterUnique = (value, index, self) => self.indexOf(value) === index;
const stripUsernames = str => str.replace(/@[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)*/gi, "");
const getColumnWidth = () => `${100 / config.displayColumns}%`;

/**
 * using masonry to lay out the grid of items
 */
const msnry = new Masonry(gifContainer, {
    itemSelector: '.item',
    columnWidth: '.grid-sizer',
    transitionDuration:100
});


let chatClient;
let giphySearch;
let itemPool = [];

/**
 * create dom elements to display a new gif in the grid
 */
const createImageItem = (data) => {

    const {id, url} = data;
    const aspect = parseFloat(data.width) / parseFloat(data.height);

    const wrap = document.createElement('div');
    wrap.classList.add("item");
    wrap.style.width = getColumnWidth();
    wrap.id = id;

    const img = new Image();
    img.src = url;

    if(config.displayColumns == 1){
        // centre output if only 1 column
        img.style.margin = "0 auto";

        // and set height to fill the available area, 
        const newHeight = window.innerHeight / config.displayCount;
        const newWidth = newHeight * aspect;
        img.style.height = `${window.innerHeight / config.displayCount}px`;

        // and maintain aspect ratio if increasing height
        img.style.setProperty("min-width", `${newWidth}px`);
        // then - images wider than the window will be centrally cropped, narrower ones will centre in the available space
        img.style.margin = (newWidth < window.innerWidth) ?  "0 auto" : `0 ${(window.innerWidth-newWidth) / 2}px`;
    }

    wrap.appendChild(img);

    return wrap;
}


const matchSentiments = words => {
    const out = [];
    afinnKeys.forEach((key, j) => {
        if (words.indexOf(key) > -1) {
            out.push(key);
        }
    });
    return out;
}

/**
 * assign a simple sentiment score to a list of words
 * @param {*} words 
 */
const scoreSentiments = words => {
    const score = { positive: 0, negative: 0 };

    afinnKeys.forEach((key, j) => {
        if (words.indexOf(key) > -1) {
            let value = afinn[key];
            if (value > 0) score.positive += value;
            else if (value < 0) score.negative += value;
            // log(`sentiment match for ${key} (score:${value})`);
        }
    });

    score.populated = score.positive != 0 || score.negative != 0;
    score.conflicted = score.positive != 0 && score.negative != 0;

    return score;
}

/**
 * Called from the ChatClient, receives all regular Twitch chat messages
 * @param {*} message 
 */
const handleChatMessage = (message) => {

    const original = message;

    message = message.toLowerCase();
    message = stripUsernames(message);

    let doc = nlp(message);
    doc.normalize();
    doc.parentheses().remove();
    doc.remove('(#Emoticon|#Emoji)');

    let text = doc.text('reduced');
    let words = text.split(" ").filter(filterUnique);

    if (words.length > 6) {
        // lots of words? try to just pick some salient details so that the search passed to the giphy api is a bit more focussed.
        doc = nlp(words.join(" "));
        const topics = doc.topics().out('array');
        const verbs = doc.verbs().out('array');
        const nouns = doc.nouns().out('array');
        const sentiments = matchSentiments(words);
        words = sentiments.concat(topics,nouns,verbs).filter(filterUnique);
        if(words.length > 6) {
            words.sort(randomSort); // shuffle for a bit of variety
            words.length = 6; // then truncate
        }

        text = words.join(" ");
    }
    log(text);
    const score = scoreSentiments(words);

    // message has a negative/positive sentiment score?
    if (score.populated) {

        const item = {
            id: genRandomId(),
            message: text,
            originalMessage: original,
            score: score,
        };

        log(item);
        fetchGIF(item).then(gotGIF);
    }
};


function gotGIF(data) {

    if (config.debug) log("gotGIF", data);

    if (!data.ok) {
        log("removing failed item", data.id);
        // remove failed item from the pool and exit
        itemPool = itemPool.filter(item => item.id !== data.id);
        return;
    }

    const img = createImageItem(data);
    img.style.opacity = 0;

    // gifContainer.appendChild(img);
    gifContainer.insertBefore(img, gifContainer.firstChild);

    setTimeout(() => {
        msnry.prepended(img);
        msnry.layout();
        img.style.opacity = 1;
    }, 200); // when using prepend it seems we to need a small delay for the layout update to register properly in masonry
}


/**
 * Queries the Giphy Search API using the supplied message
 * @param {*} item 
 */
async function fetchGIF(item) {

    let query = item.message;
    let id = item.id;

    const gData = await giphySearch.query(query, Math.max(1, config.searchSize), 0, config.giphy_rating);
    if (!gData) return { ok: false, id: id };
    if (config.debug) log("giphySearch response", gData);

    gData.sort(randomSort); // randomise order of results 

    let imageData = null;

    gData.every(data => {
        const isUnique = itemPool.every(item => item.originalURL !== data.images.original.url);
        // if image does not exist in current items, keep it
        if (isUnique) {
            imageData = data.images.original;
            return false;
        }
        return true; // keep checking
    });

    if (imageData === null) {
        log("item already exists, no new gifs to show for this query.");
        return { ok: false, id: id };
    }

    // Seems that Giphy no longer just returns a gif url, it's an html page with a gif/webm/mp4 embed. 
    // We only want the source gif url...
    const url = imageData.url;
    let assetId = url.substr(0, url.indexOf("/giphy.gif?"));
    assetId = assetId.substring(assetId.lastIndexOf("/") + 1);
    const gifURL = `https://i.giphy.com/media/${assetId}/giphy.gif`

    item.originalURL = url;
    itemPool.push(item);

    if (itemPool.length > config.displayCount) {
        // too many? removed oldest item.
        const removed = itemPool.shift();
        const el = document.getElementById(removed.id);
        gifContainer.removeChild(el);
        msnry.remove(el);
        msnry.layout();
    }

    return {
        ok: true,
        id: id,
        url: gifURL,
        width: imageData.width,
        height: imageData.height,
    };
}


/**
 * construct and configure
 */
function init() {

    // override config values with querysting parameters if present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("channel")) config.channel = urlParams.get('channel');

    if (urlParams.has("displayColumns")) config.displayColumns = parseInt(urlParams.get('displayColumns'), 10);
    if (urlParams.has("displayCount")) config.displayCount = parseInt(urlParams.get('displayCount'), 10);
    if (urlParams.has("searchSize")) config.searchSize = parseInt(urlParams.get('searchSize'), 10);

    if (urlParams.has("giphy_rating")) config.giphy_rating = urlParams.get('giphy_rating');
    if (urlParams.has("giphy_apiKey")) config.giphy_apiKey = urlParams.get('giphy_apiKey');

    // set column width
    document.querySelector('.grid-sizer').style.width = getColumnWidth();

    window.handleChatMessage = handleChatMessage; // to test

    chatClient = new ChatClient(config, handleChatMessage);
    giphySearch = new GiphySearch(config)
}

init();