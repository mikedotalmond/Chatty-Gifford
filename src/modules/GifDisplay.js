

import { setTimeout, clearTimeout } from 'timers-browserify';
import Masonry from 'masonry-layout';

import log from './log.js';
import { genRandomId, randomSort, now } from './Utils';

import GiphySearch from "./gif/GiphySearch.js";
import TenorSearch from "./gif/TenorSearch.js";

class GifDisplay {

    constructor(config, urlParams) {

        this.lastGifTime = 0;
        this.pendingItem = 0;
        this.pendingRemoval = 0;
        this.viewCounter = 0;

        // display items(s)
        this.itemPool = [];
        // loading item(s)
        this.loadPool = [];
        this.loadMap = {};
        // loaded, not yet used gif data results
        this.gifData = [];

        this.singleItem = config.display.total == 1;

        if (this.singleItem) {
            config.display.columns = 1;
            window.addEventListener("resize", () => this.layoutSingleImage(document.querySelector('div.item')));
        }

        this.config = config;

        document.body.style.backgroundColor = `${config.display.backgroundColor}`;
        // log(document.body.style.backgroundColor);

        this.gifContainer = document.getElementById("gif-container");
        document.querySelector('.grid-sizer').style.width = this.getColumnWidth();

        this.msnry = new Masonry(this.gifContainer, {
            itemSelector: '.item',
            columnWidth: '.grid-sizer',
            transitionDuration: this.config.display.transitionDuration
        });

        switch (config.api.provider) {
            case "tenor":
                this.gifSearch = new TenorSearch(config);
                break;
            case "giphy":
                this.gifSearch = new GiphySearch(config);
                break;
            default:
                throw `Unsupported gif.api.provider name, valid options are "tenor", "giphy"`;
        }

        /// start with local/default asset(s) while waiting for twitch chat connection/messaging
        this.fetchDefaultAssets();
    }

    query(/** @type {String} */query) {

        if (query.length == 0) {
            log("Empty query, nothing to search");
            return;
        }

        const item = {
            id: genRandomId(),
            query: query,
        };


        // rate limit calls to api
        // keep most recent as pending if requests are too fast, 
        // don't bother keeping a long queue

        clearTimeout(this.pendingItem);
        clearTimeout(this.nextGifTimeout);

        const dt = now() - this.lastGifTime;

        const d = this.config.display;
        const delay = d.minDisplayTime * 1000;
        if (d.minDisplayTime <= 0 || (dt >= delay)) {
            this.lastGifTime = now();
            this.fetchGIF(item)
                .then((d) => this.gotGIFData(d))
                .then(() => this.queueNext(query));
        } else {
            this.pendingItem = setTimeout(() => this.query(query), dt);
        }
    }

    /**
     * 
     */
    queueNext(query) {
        log(`queueNext ${query}...`);

        clearTimeout(this.nextGifTimeout);
        this.nextGifTimeout = setTimeout(() => {
            log(`queueNext remaining:${this.gifData.length}`);
            log(`queueNext viewCounter:${this.viewCounter} (max:${this.config.display.maxDisplayedPerQuery})`);
            if (this.gifData.length > 0 && this.viewCounter < this.config.display.maxDisplayedPerQuery) {
                this.gotGIFData(this.processGifData(this.gifData, { id: genRandomId(), query: query }))
                    .then(() => this.queueNext(query));
            } else {
                log(`Exhausted API Gifs for ${query} - fall back to user default(s)`);
                this.fetchDefaultAssets();
            }
        }, this.config.display.maxDisplayTime * 1000);
    }

    /**
     * 
     */
    fetchDefaultAssets() {
        const q = 'defaultAssets';
        const d = this.config.display.defaultAssets;
        this.gifData = d.concat();
        this.viewCounter = -this.gifData.length;
        this.lastGifTime = now();
        this.gotGIFData(this.processGifData(this.gifData, { id: genRandomId(), query: q }))
            .then(() => { if (d.length > 1) this.queueNext(q); });
    }

    /**
     * Query the Gif Search API using the supplied query item
     * @param {*} item 
     */
    async fetchGIF(item) {

        const { query, id } = item;

        // a new query - reset the view count
        this.viewCounter = 0;

        const gifData = await this.gifSearch.query(query, Math.max(1, this.config.api.searchSize));
        if (!gifData) return { ok: false, id: id };

        gifData.sort(randomSort);
        return this.processGifData(gifData, item);
    }

    /**
     * 
     * @param {Array} gifData 
     * @returns 
     */
    processGifData(/** @type {Array} */gifData, item) {
        let imageData = null;
        let selectedIndex = -1;

        const { query, id } = item;

        gifData.every((data, i) => {
            const isUnique = this.itemPool.every(item => item.url !== data.url);
            // if image does not exist in current items, keep it
            if (isUnique) {
                selectedIndex = i;
                imageData = data;
                return false;
            }
            return true; // keep checking
        });

        if (selectedIndex === -1) {
            log("item already exists, no new gif to show for this query.");
            return { ok: false, id: id };
        }

        imageData = gifData.splice(selectedIndex, 1)[0];
        this.gifData = gifData;

        imageData.ok = true;
        imageData.id = id;
        imageData.query = query;
        this.itemPool.push(imageData);

        if (this.itemPool.length > this.config.display.total) {
            // too many? mark oldest item(s) for removal - which will happen once this item has been loaded+displayed
            this.pendingRemoval++;
        }

        return imageData;
    }


    /**
     * Gif search retuned result(s)
     * @param {*} data 
     */
    gotGIFData(data) {

        const resolution = new Promise((resolve) => {

            if (!data.ok) {
                log("removing failed item", data.id);
                // remove failed item from the pool and exit
                this.itemPool = this.itemPool.filter(item => item.id !== data.id);
                resolve(false);
                return;
            }

            this.createImageItem(data, container => { // image loaded callback

                this.viewCounter++;

                this.loadPool = this.loadPool.filter(value => value != container.id);
                delete this.loadMap[container.id];

                this.gifContainer.insertBefore(container, this.gifContainer.firstChild);

                this.msnry.prepended(container);
                this.msnry.layout();

                container.style.opacity = 1;

                // if only showing one, fill background of container with repeating version of the loaded gif
                container.style.setProperty("background-image", this.singleItem ? `url("${data.url}")` : "unset");

                // any items to remove? do so after the `in ` transition
                clearTimeout(this.removeItemTimeout);
                this.removeItemTimeout = setTimeout(() => {
                    this.removePending();
                }, this.config.display.transitionDuration);


                //
                resolve(true);
            });
        });

        return resolution;
    }


    removePending() {

        while (this.pendingRemoval > 0) {

            this.pendingRemoval--;
            const removed = this.itemPool.shift();

            if (this.loadPool.indexOf(removed.id) > -1) {
                this.loadMap[removed.id].onload = null;
                this.loadMap[removed.id].src = "";
                delete this.loadMap[removed.id];
            } else {
                const el = document.getElementById(removed.id);
                this.gifContainer.removeChild(el);
                try { this.msnry.remove(el); } catch (_) { }
            }
        }

        this.msnry.layout();
    }


    layoutSingleImage(container) {
        if (container == null) return;

        const img = container.firstChild;
        const imgRatio = parseFloat(container.dataset.width) / parseFloat(container.dataset.height);
        const displayRatio = window.innerWidth / window.innerHeight;

        container.style.width = `${window.innerWidth}px`;
        container.style.height = `${window.innerHeight}px`;
        img.style.position = 'relative';

        let newHeight, newWidth;

        if (imgRatio < displayRatio) {
            // window is wider ratio than gif - fit gif to height
            newHeight = window.innerHeight / this.config.display.total;
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


    /**
     * create dom elements to display a new gif in the grid
     */
    createImageItem(data, onLoad) {

        const { id, url } = data;

        const container = document.createElement('div');
        container.classList.add("item");
        container.id = id;
        container.style.opacity = 0;
        container.dataset.width = data.width;
        container.dataset.height = data.height;
        container.style.backgroundColor = `${this.config.display.backgroundColor}`;

        const img = new Image();
        container.appendChild(img);

        // and set height to fill the available area
        if (this.config.display.columns == 1) {
            this.layoutSingleImage(container);
        }

        img.onload = () => onLoad(container);
        this.loadPool.push(id);
        this.loadMap[id] = img;
        img.src = url; // start loading...
    }

    getColumnWidth() {
        return `${100 / this.config.display.columns}% `;
    }
}

export default GifDisplay;