window.chatgifconfig = {

  // enable console logs for help debugging / to see what's going on 
  debug: false,

  // the twitch channel name to observe...
  // can be any, twitch chats are all public and require no authentication to read from.
  channel: 'mikedotalmond',

  gif: {
    // enable/disable the gif display
    enabled: true,

    behaviour: {
      // search for gif results relating to sentiments in chat messages
      sentiments: {
        enabled: true,
      },

      // search for gif results relating to general conversation in chat messages
      general: {
        enabled: true,
      },

      // ignore list
      // used in basic textual filters to help reduce the chance of seeing results for certain topics.
      // these are applied prior to the querying the api (so these words will be stripped from the chat messages before building a query)
      // and also the api response metadata for each gif item (content description, title, tags, ..))
      // for example...
      ignore: ["4chan", "pepe", "monka", "sadge", "http", "defi", "nft"],
    },


    display: {

      // total number of GIFs to show in the display at once. 
      // Can be one, for a single gif filling the page, or multiple displayed in columns
      total: 1,

      // number of GIFs to display in each horizontal row
      columns: 5,

      // minimum time (seconds) to display each gif - useful on fast moving chats with a low displayCount (i.e. when displayCount=1)
      // set to 0 (zero) to disable and just load everything as fast as possible (not recommended)
      minDisplayTime: 2.5,

      // per-gif display time (seconds) - the next available gif, or default asset(s) will be shown after this time is exceeded
      maxDisplayTime: 5,

      // show (up to) this many gifs per chat triggered search
      // after these are exhausted, the default asset(s) will be used
      // value here should be <= the api.searchSize value
      maxDisplayedPerQuery: 4,

      // time taken to transition when adding/removing gifs
      transitionDuration: 0, // milliseconds

      /// - CSS color value for the background 
      /// - When viewing a single gif (total:1) the background fill gif gets multiplied with this value
      // backgroundColor: '#444', // mm, a lovely shade of gray
      backgroundColor: '#9146FF', // twitch purple

      // one or more image(s) shown when maxDisplayTime is exceeded, 
      // and maxDisplayedPerQuery has been reached or no new chat prompts have triggered a new gif
      defaultAssets: [
        // can be local, relative to index.html... 
        { url: './img/a-local.gif', width: 128, height: 128 },
        // or remote:
        { url: 'https://ipfs.pixura.io/ipfs/QmVKzqUsY3vqeFB6A7DaSNRqNApsij8pmBUdFZTYnKcZ7e', width: 256, height: 236 },
      ],
    },


    api: {
      // number of results to request for each search query - random choices are picked when multiple results are returned
      // increasing this should give more varied (but less relevant) results for similar/repeated search terms
      searchSize: 24,

      // current options are "giphy", "tenor" - configure below as required
      provider: "tenor",

      ///
      providers: {
        tenor: {
          // tenor api key
          apiKey: "-your-apikey-here-",
          // keeping results clean, see: https://tenor.com/gifapi/documentation#contentfilter
          contentfilter: "high",
          // max number of characters in the search query 
          // -- shorter queries produce more relevant results...
          // - longer messages get reduced by removing sentiments/topics/verbs/nouns at random until they fit this limit
          maxQueryLength: 43,
        },
        ///
        giphy: {
          // giphy api key
          apiKey: "-your-apikey-here-",
          // keeping results clean, see: https://developers.giphy.com/docs/optional-settings#rating
          rating: "g",
          // max number of characters in the search query 
          // -- shorter queries produce more relevant results...
          // - longer messages get reduced by removing sentiments/topics/verbs/nouns at random until they fit this limit
          maxQueryLength: 43,
        }
      }
    }
  }
}