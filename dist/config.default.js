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

    debug: false, // mostly just enables some extra logging to the developer console

    // the twitch channel to observe...
    // can be anyone, twitch chats are all public and require no authentication to read from.
    channel: 'mikedotalmond', // 1030jh, coolcaits, limmy, pinkhexagon, sheila, toastie, zafarcakes, etc...

    // number of GIFs to display in each horizontal row
    displayColumns: 5,
    // total number of GIFs to show in the display at once. You probably want to have just enough to fill the size of area you want to show.
    displayCount: 25,
    // NOTE: setting each of the above to 1 will cause a single image to be displayed at a time. 
    // That image will fill the height of the window/container it's loaded into and be centred horizontally in that space
    // (while maintaining the original aspect ratio)

    // number of results to request for each search query - a random choice is picked when multiple results are returned
    // can give more varied results for similar/repeated search terms
    searchSize: 16,

    // giphy search settings
    // 'g', 'pg13', or 'r' - keeping results clean, or not. pg13 *seems* to be generally ok for the Twitch ToS.
    // see: https://developers.giphy.com/docs/optional-settings#rating
    giphy_rating: "g",
    // put your giphy api key here - but DON'T then commit this file to version control
    giphy_apiKey: "your-giphy-apikey",
  }
};