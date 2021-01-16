

import { setTimeout, clearTimeout } from 'timers-browserify';
import Masonry from 'masonry-layout';

import log from './log.js';
import { genRandomId, randomSort, now } from './Utils';

import GiphySearch from "./GiphySearch.js";

class GifWall {

    constructor(config, urlParams) {

        this.lastGifTime = 0;
        this.pendingItem = 0;
        this.pendingRemoval = 0;
        this.itemPool = [];
        this.loadPool = [];
        this.loadMap = {};

        // override config values with querysting parameters if present
        if (urlParams.has("gifs.displayColumns")) config.displayColumns = parseInt(urlParams.get('gifs.gifColumns'), 10);
        if (urlParams.has("gifs.displayCount")) config.displayCount = parseInt(urlParams.get('gifs.displayCount'), 10);
        if (urlParams.has("gifs.transitionDuration")) config.transitionDuration = parseInt(urlParams.get('gifs.transitionDuration'), 10);
        if (urlParams.has("gifs.searchSize")) config.searchSize = parseInt(urlParams.get('gifs.searchSize'), 10);
        if (urlParams.has("gifs.giphy_rating")) config.giphy_rating = urlParams.get('gifs.giphy_rating');
        if (urlParams.has("gifs.giphy_apiKey")) config.giphy_apiKey = urlParams.get('gifs.giphy_apiKey');

        this.singleGIFDisplay = config.displayCount == 1;
        if (this.singleGIFDisplay) config.displayColumns = 1;
        this.config = config;

        this.gifContainer = document.getElementById("gif-container");
        document.querySelector('.grid-sizer').style.width = this.getColumnWidth();

        this.msnry = new Masonry(this.gifContainer, {
            itemSelector: '.item',
            columnWidth: '.grid-sizer',
            transitionDuration: this.config.transitionDuration
        });

        this.gifSearch = new GiphySearch(this.config);
    }


    update(query) {

        const item = {
            id: genRandomId(),
            query: query,
        };

        // rate limit calls to api
        // keep most recent as pending if requests are too fast, 
        // don't bother keeping a long queue

        const dt = now() - this.lastGifTime;
        this.lastGifTime = now();
        clearTimeout(this.pendingItem);
        if (this.config.minimumDisplayTime <= 0 || (dt >= this.config.minimumDisplayTime * 1000)) {
            this.fetchGIF(item).then(data => this.gotGIFData(data));
        } else {
            log("too fast, set as pending")
            this.pendingItem = setTimeout(
                () => this.fetchGIF(item).then(data => this.gotGIFData(data)),
                dt
            );
        }
    }


    /**
     * Query the Gif Search API using the supplied query item
     * @param {*} item 
     */
    async fetchGIF(item) {

        let { query, id } = item;

        const gData = await this.gifSearch.query(query, Math.max(1, this.config.searchSize), 0, this.config.giphy_rating);
        if (!gData) return { ok: false, id: id };

        gData.sort(randomSort); // randomise order of results 

        let imageData = null;

        gData.every(data => {
            const isUnique = this.itemPool.every(item => item.originalURL !== data.images.original.url);
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
        this.itemPool.push(item);

        if (this.itemPool.length > this.config.displayCount) {
            // too many? mark oldest item(s) for removal - which will happen once this item has been loaded+displayed
            this.pendingRemoval++;
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
     * Gif search retuned result(s)
     * @param {*} data 
     */
    gotGIFData(data) {

        if (!data.ok) {
            log("removing failed item", data.id);
            // remove failed item from the pool and exit
            this.itemPool = this.itemPool.filter(item => item.id !== data.id);
            return;
        }

        this.createImageItem(data, (imgWrap) => {
            // image loaded
            this.loadPool = this.loadPool.filter(value => value != imgWrap.id);
            delete this.loadMap[imgWrap.id];

            this.gifContainer.insertBefore(imgWrap, this.gifContainer.firstChild);

            this.msnry.prepended(imgWrap);
            this.msnry.layout();

            imgWrap.style.opacity = 1;

            // if only showing one, fill background of container with repeating version of the loaded gif
            this.gifContainer.style.setProperty("background-image", this.singleGIFDisplay ? `url("${data.url}")` : "unset");

            // any items to remove? do so after the `in` transition
            clearTimeout(this.qwertyuiop);
            this.qwertyuiop = setTimeout(() => {
                this.removePending();
            }, this.config.transitionDuration);
        });
    }


    removePending() {

        while (this.pendingRemoval > 0) {

            log("removePending", this.pendingRemoval);

            this.pendingRemoval--;
            const removed = this.itemPool.shift();

            if (this.loadPool.indexOf(removed.id) > -1) {
                log("remove/cancel an image that is still loading...", this.loadMap[removed.id]);
                this.loadMap[removed.id].onload = null;
                this.loadMap[removed.id].src = "";
                delete this.loadMap[removed.id];
            } else {
                log("remove existing images");
                const el = document.getElementById(removed.id);
                this.gifContainer.removeChild(el);
                this.msnry.remove(el);
            }
        }

        this.msnry.layout();
    }


    /**
     * create dom elements to display a new gif in the grid
     */
    createImageItem(data, onLoad) {

        const { id, url } = data;

        const wrap = document.createElement('div');
        wrap.classList.add("item");
        wrap.style.opacity = 0;
        wrap.id = id;

        const img = new Image();
        wrap.appendChild(img);

        // and set height to fill the available area
        if (this.config.displayColumns == 1) {
            let newHeight, newWidth;

            const imgRatio = parseFloat(data.width) / parseFloat(data.height);
            const displayRatio = window.innerWidth / window.innerHeight;
    
            wrap.style.width = `${ window.innerWidth}px`;
            wrap.style.height = `${ window.innerHeight}px`;
            img.style.position = 'relative';

            if (imgRatio < displayRatio) { 
                // window is wider ratio than gif - fit gif to height
                newHeight = window.innerHeight / this.config.displayCount;
                newWidth = newHeight * imgRatio;
                img.style.left = `${(window.innerWidth - newWidth) / 2}px`;

            } else {
                // window is taller than gif - fit gif to width
                newWidth = window.innerWidth;
                newHeight = newWidth / imgRatio;
                img.style.top = `${(window.innerHeight - newHeight) / 2}px`;
            }

            img.style.width = `${newWidth}px`;
            img.style.height = `${newHeight}px`;
        }

        img.onload = () => onLoad(wrap);
        this.loadPool.push(id);
        this.loadMap[id] = img;
        img.src = url; // start loading...
    }


    getColumnWidth() {
        return `${100 / this.config.displayColumns}%`;
    }
}

export default GifWall;