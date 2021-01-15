/**
 * Make a copy of this file and rename it to `config.js`
 * 
 * Then replace the giphy_apiKey value with your own giphy API key (signup is free)
 * - https://support.giphy.com/hc/en-us/articles/360020283431-Request-A-GIPHY-API-Key
 * - https://developers.giphy.com/
 * 
 * * Set `channel` value to the twitch channel you want to use
 */
window.sentimentWall = {

  config: {

    // the twitch channel to observe...
    // can be anyone, twitch chats are all public and require no authentication to read from.
    channel: '1030jh', // mikedotalmond, 1030jh, limmy, etc...

    gifs: {
      // enable/disable the gif-wall display
      enabled: true,

      // total number of GIFs to show in the display at once. You probably want to have 
      // just enough to fill the size of area you want to show.
      displayCount: 1,
      // NOTE: setting displayCount to 1 will cause a single image to be displayed at a time. 
        // That image will fill the height of the window/container it's loaded into and will
        // centred in that space, while maintaining the original aspect ratio.
        // To provide a more consistent look, this single-display mode also enables a background filling copy of the GIF 
        // so that any spaces at the sides of the gif due to differences between the aspect ratio of the window and the gif, 
        // will be filled with similar (and usually non-jarring) content.

      // number of GIFs to display in each horizontal row
      displayColumns: 5,

      // number of results to request for each search query - a random choice is picked when multiple results are returned
      // increasing this should give more varied results for similar/repeated search terms
      searchSize: 16,

      // minimum time (seconds) to display each gif - useful on fast moving chats with a low displayCount (i.e. when displayCount=1)
      // set to 0 (zero) to disable and just load everything as fast as possible
      minimumDisplayTime:2.5,

      // time taken to transition when adding/removing gifs
      transitionDuration:200, // milliseconds

      // giphy specific 
      giphy_rating: "pg", // keeping results cleanish, see: https://developers.giphy.com/docs/optional-settings#rating
      giphy_apiKey: "your-api-key-here", // put your giphy api key here - but DON'T then commit this file to version control
    },


    sentiments: {
      // enable/disable an emoji bar overlay showing the current chat sentiment state 
      // 🤬😡😭😢🙁😐🙂😀😄😂🤣
      // NOTE: this is WIP and a bit hit and miss, so disabled by default 
      enabled: false,
    },


    //TODO:
    emotes: {
      // enable/disable overlay display of emotes from the chat
      // NOTE: Not yet implemented
      enabled: false,
    }

  }
}