import log from './modules/log.js';

import afinn from 'afinn-165';
import nlp from 'compromise'

import Masonry from 'masonry-layout';

import { chatClient } from "./modules/ChatClient.js";
import { giphySearch } from "./modules/GiphySearch.js";

import config from './config.js';

import { setTimeout } from 'timers-browserify';

const rndInt = n => (Math.random() * n) | 0;
const genRandomId = () => rndInt(0xffffff7).toString(36);
const randomSort = (a,b) => (Math.random() >= 0.5) ? -1 : 1;

const filterUnique = (value, index, self) => self.indexOf(value) === index;

// const stripUsernames = str => str.replace(/^@?(\w){1,15}$/gi, "");
const stripUsernames = str => str.replace(/@[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)*/gi, "");

const afinnKeys = Object.keys(afinn);
let itemPool = [];

const gifContainer = document.getElementById("gif-container");

const createImageItem = (id, src, width, height) => {
    const wrap = document.createElement('div');
    wrap.classList.add("item");
    wrap.id = id;

    const img = new Image();
    img.src = src;
    wrap.appendChild(img);

    return wrap;
}

const msnry = new Masonry( gifContainer, {
    itemSelector: '.item',
    columnWidth: '.grid-sizer',
});

const scoreSentiments = words => {
    let score = { positive: 0, negative: 0 };

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


const handleChatMessage = message => {

    let original = message;

    message = message.toLowerCase();
    message = stripUsernames(message);

    let doc = nlp(message);
    doc.normalize();
    doc.parentheses().remove();
    doc.remove('(#Emoticon|#Emoji)');

    let text = doc.text('reduced');
    let words = text.split(" ").filter(filterUnique);

    if(words.length > 6) {
        // lots of words? try to just pick some salient details
        doc = nlp(words.join(" "));
        let topics = doc.topics().out('array');
        // let verbs = doc.verbs().out('array');
        let nouns = doc.nouns().out('array');
        words = topics.concat(nouns).filter(filterUnique);
        text = words.join(" ");
    }

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

    if(config.debug) log("gotGIF", data);

    if (!data.ok) {
        log("removing failed item", data.id);
        // remove failed item from the pool
        itemPool = itemPool.filter(item => item.id !== data.id);
        return;
    }

    const img = createImageItem(data.id, data.url, data.width, data.height);
    img.style.opacity = 0;

    // gifContainer.appendChild(img);
    gifContainer.insertBefore(img, gifContainer.firstChild);

    setTimeout(()=>{
        msnry.prepended(img);
        msnry.layout();
        img.style.opacity = 1;
    }, 200); // when using prepend it seems we to need a small delay for the layout update to register properly with masonry
}


async function fetchGIF(item) {

    let query = item.message;
    let id = item.id;

    const gData = await giphySearch.query(query, config.sentiment.bufferSize >> 1, 0, config.giphy.rating);
    if (!gData) return { ok: false, id: id };
    // log("giphySearch response", gData);
    
    gData.sort(randomSort); // ransomise result order

    let imageData = null;

    gData.every(data => {
        const isUnique = itemPool.every(item => item.originalURL !== data.images.original.url);
        // if image does not exist in current items, keep it
        if(isUnique) {
            imageData = data.images.original;
            return false;
        }
        return true; // keep checking
    });

    if(imageData === null){
        log("item already exists, no new gifs to show for this query.");
        return { ok: false, id: id };
    }
    
    // giphy no longer just returns a gif url, it's an html page with a gif/webm/mp4 embedded. We only want the gif... this picks it out.
    const url = imageData.url;
    let assetId = url.substr(0, url.indexOf("/giphy.gif?"));
    assetId = assetId.substring(assetId.lastIndexOf("/") + 1);
    const gifURL = `https://i.giphy.com/media/${assetId}/giphy.gif`
    
    item.originalURL = url;
    itemPool.push(item);

    if (itemPool.length > config.sentiment.bufferSize) {
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

function init() {
    chatClient.messageTarget = { onMessage: handleChatMessage };

}

init();

