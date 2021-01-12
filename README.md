# ╰(*°▽°*)╯ Giffing Wall Sentimental ╰(*°▽°*)╯

Display a wall of GIFs driven by a simple Twitch live chat sentiment analysis and the Giphy search API.

[Stream Example](https://www.twitch.tv/videos/856384544)

![example](https://mikedotalmond.co.uk/lab/giffingsentimental/gifwall.jpg)


### Getting started
* Download or clone the repo. 
* In `/dist/` rename `config.default.js` to `config.js` and follow the instructions there to finish setting things up. 
* Open dist/index.html in a browser or assign as a browser-source in OBS etc.

For faster config changes (or, for example, to run multiple different configs in different windows) any of the config key:value pairs can be overridden via the querystring, like...
* index.html?channel=myFavouriteStreamer&giphy_rating=pg13


### Build from source
* `npm install`
* `npm run build` or `npm run build-prod`


### Uses
* [tmi](https://www.npmjs.com/package/tmi)
* [compromise](https://www.npmjs.com/package/compromise)
* [afinn-165](https://www.npmjs.com/package/afinn-165)
* [masonry-layout](https://www.npmjs.com/package/masonry-layout)
* [timers-browserify](https://www.npmjs.com/package/timers-browserify)
* [webpack](https://www.npmjs.com/package/webpack)
* [webpack-cli](https://www.npmjs.com/package/webpack-cli)
