

import { setTimeout, clearTimeout } from 'timers-browserify';
import Masonry from 'masonry-layout';

import log from './log.js';
import { genRandomId, randomSort, now } from './Utils';

import GiphySearch from "./gif/GiphySearch.js";
import TenorSearch from "./gif/TenorSearch.js";

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

        if (urlParams.has("gifs.giphy_apiKey")) config.giphy_apiKey = urlParams.get('gifs.giphy_apiKey');
        if (urlParams.has("gifs.giphy_rating")) config.giphy_rating = urlParams.get('gifs.giphy_rating');

        if (urlParams.has("gifs.tenor_apiKey")) config.tenor_apiKey = urlParams.get('gifs.tenor_apiKey');
        if (urlParams.has("gifs.tenor_contentfilter")) config.tenor_rating = urlParams.get('gifs.tenor_contentfilter');

        this.singleGIFDisplay = config.displayCount == 1;
        if (this.singleGIFDisplay) {
            config.displayColumns = 1;
            window.addEventListener("resize", () => this.layoutSingleImage(document.querySelector('div.item')));
        }
        this.config = config;

        this.gifContainer = document.getElementById("gif-container");
        document.querySelector('.grid-sizer').style.width = this.getColumnWidth();

        this.msnry = new Masonry(this.gifContainer, {
            itemSelector: '.item',
            columnWidth: '.grid-sizer',
            transitionDuration: this.config.transitionDuration
        });

        switch (config.gifAPIProvider) {
            case "tenor":
                this.gifSearch = new TenorSearch(config);
                break;
            case "giphy":
                this.gifSearch = new GiphySearch(config);
                break;
            default:
                throw `Unsupported API name, options are "tenor", "giphy"`;
        }

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

        const gifData = await this.gifSearch.query(query, Math.max(1, this.config.searchSize));
        if (!gifData) return { ok: false, id: id };

        gifData.sort(randomSort); // randomise order of results 

        let imageData = null;

        gifData.every(data => {
            const isUnique = this.itemPool.every(item => item.url !== data.url);
            // if image does not exist in current items, keep it
            if (isUnique) {
                imageData = data;
                return false;
            }
            return true; // keep checking
        });

        if (imageData === null) {
            log("item already exists, no new gifs to show for this query.");
            return { ok: false, id: id };
        }
        
        imageData.ok = true;
        imageData.id = id;
        imageData.query = query;
        this.itemPool.push(imageData);

        if (this.itemPool.length > this.config.displayCount) {
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

        if (!data.ok) {
            log("removing failed item", data.id);
            // remove failed item from the pool and exit
            this.itemPool = this.itemPool.filter(item => item.id !== data.id);
            return;
        }

        this.createImageItem(data, container => { // image loaded callback

            this.loadPool = this.loadPool.filter(value => value != container.id);
            delete this.loadMap[container.id];

            this.gifContainer.insertBefore(container, this.gifContainer.firstChild);

            this.msnry.prepended(container);
            this.msnry.layout();

            container.style.opacity = 1;

            // if only showing one, fill background of container with repeating version of the loaded gif
            container.style.setProperty("background-image", this.singleGIFDisplay ? `url("${data.url}")` : "unset");

            // any items to remove? do so after the `in` transition
            clearTimeout(this.removeItemTimeout);
            this.removeItemTimeout = setTimeout(() => this.removePending(), this.config.transitionDuration);
        });
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
                this.msnry.remove(el);
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

        const img = new Image();
        container.appendChild(img);

        // and set height to fill the available area
        if (this.config.displayColumns == 1) {
            this.layoutSingleImage(container);
        }

        img.onload = () => onLoad(container);
        this.loadPool.push(id);
        this.loadMap[id] = img;
        img.src = url; // start loading...
    }


    getColumnWidth() {
        return `${100 / this.config.displayColumns}%`;
    }
}

export default GifWall;