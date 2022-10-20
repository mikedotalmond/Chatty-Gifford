# ╰(*°▽°*)╯ Chatty Gifford ╰(*°▽°*)╯

Display GIFs driven by live Twitch chat messages and GIF search APIs.

## Getting started
* Download or clone the repo. 
* In `/dist/` rename `config.default.js` to `config.js` set your channel name, add your API key(s) and follow the instructions there to change any of the configuration options. 
* Open dist/index.html in a browser or assign as a browser source in OBS etc.


## Examples

#### Single item with a portrait image fitting to a landscape window area (default mode)
![single-item-example](https://mikedotalmond.dev/lab/giffingsentimental/singlegif.png)

#### 5-column wall
![example](https://mikedotalmond.dev/lab/giffingsentimental/gifwall.jpg)


## Build
* `npm install`
* `npm run build` or `npm run build-prod`

#### Uses:
* [tmi](https://www.npmjs.com/package/tmi)
* [compromise](https://www.npmjs.com/package/compromise)
* [afinn-165](https://www.npmjs.com/package/afinn-165)
* [masonry-layout](https://www.npmjs.com/package/masonry-layout)
* [timers-browserify](https://www.npmjs.com/package/timers-browserify)
* [webpack](https://www.npmjs.com/package/webpack)
* [webpack-cli](https://www.npmjs.com/package/webpack-cli)
