

import { setTimeout, clearTimeout } from 'timers-browserify';
import Masonry from 'masonry-layout';

import log from './log.js';
import { genRandomId, randomSort, now } from './Utils';

import GiphySearch from "./GiphySearch.js";

class GifWall {

    constructor(config, urlParams) {

        this.lastGifTime = 0;
        this.pendingItem = 0;
        this.itemPool = [];

        // override config values with querysting parameters if present
        if (urlParams.has("gifs.displayColumns")) config.displayColumns = parseInt(urlParams.get('gifs.gifColumns'), 10);
        if (urlParams.has("gifs.displayCount")) config.displayCount = parseInt(urlParams.get('gifs.displayCount'), 10);
        if (urlParams.has("gifs.searchSize")) config.searchSize = parseInt(urlParams.get('gifs.searchSize'), 10);
        if (urlParams.has("gifs.giphy_rating")) config.giphy_rating = urlParams.get('gifs.giphy_rating');
        if (urlParams.has("gifs.giphy_apiKey")) config.giphy_apiKey = urlParams.get('gifs.giphy_apiKey');

        this.singleGIFDisplay = config.displayCount == 1;
        if (this.singleGIFDisplay) config.displayColumns = 1;

        this.config = config;
        this.gifSearch = new GiphySearch(config);

        // set column width
        document.querySelector('.grid-sizer').style.width = this.getColumnWidth();

        /**
         * use masonry to lay out the grid of items
         */
        this.gifContainer = document.getElementById("gif-container");
        this.msnry = new Masonry(this.gifContainer, {
            itemSelector: '.item',
            columnWidth: '.grid-sizer',
            transitionDuration: 100
        });
    }


    update(query) {

        const item = {
            id: genRandomId(),
            query: query,
        };

        // rate limit if needed
        if (this.config.minimumDisplayTime <= 0 || (now() - this.lastGifTime >= this.config.minimumDisplayTime * 1000)) {
            this.lastGifTime = now();
            clearTimeout(this.pendingItem);
            this.fetchGIF(item).then(data => this.gotGIF(data));
        } else {
            this.pendingItem = setTimeout(
                () => this.fetchGIF(item).then(data => this.gotGIF(data)),
                this.config.minimumDisplayTime
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
            // too many? removed oldest item.
            const removed = this.itemPool.shift();
            const el = document.getElementById(removed.id);
            this.gifContainer.removeChild(el);
            this.msnry.remove(el);
            this.msnry.layout();
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
    gotGIF(data) {

        if (!data.ok) {
            log("removing failed item", data.id);
            // remove failed item from the pool and exit
            this.itemPool = this.itemPool.filter(item => item.id !== data.id);
            return;
        }

        const img = this.createImageItem(data);
        img.style.opacity = 0;

        // gifContainer.appendChild(img);
        this.gifContainer.insertBefore(img, this.gifContainer.firstChild);

        // if only showing one, fill background of container with repeating version of the loaded gif
        this.gifContainer.style.setProperty("background-image", this.singleGIFDisplay ? `url("${data.url}")` : "unset");

        setTimeout(() => {
            this.msnry.prepended(img);
            this.msnry.layout();
            img.style.opacity = 1;
        }, 200); // when using prepend it seems we to need a small delay for the layout update to register properly in masonry
    }



    /**
     * create dom elements to display a new gif in the grid
     */
    createImageItem(data) {

        const { id, url } = data;
        const aspect = parseFloat(data.width) / parseFloat(data.height);

        const wrap = document.createElement('div');
        wrap.classList.add("item");
        wrap.id = id;

        const img = new Image();
        img.src = url;

        if (this.config.displayColumns == 1) {
            // and set height to fill the available area, 
            const newHeight = window.innerHeight / this.config.displayCount;
            const newWidth = newHeight * aspect;

            // centre output if only 1 column
            wrap.style.width = this.getColumnWidth();
            img.style.margin = "0 auto";
            img.style.height = `${window.innerHeight / this.config.displayCount}px`;

            // and maintain aspect ratio if increasing height
            img.style.setProperty("min-width", `${newWidth}px`);
            // then - images wider than the window will be centrally cropped, narrower ones will centre in the available space
            img.style.margin = (newWidth < window.innerWidth) ? "0 auto" : `0 ${(window.innerWidth - newWidth) / 2}px`;
        }

        wrap.appendChild(img);

        return wrap;
    }


    getColumnWidth() {
        return `${100 / this.config.displayColumns}%`;
    }
}

export default GifWall;