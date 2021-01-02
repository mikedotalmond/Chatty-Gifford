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

    // Number of gif items to keep in the display at once. 
    // Will need to change if the grid size is altered in the CSS.
    bufferSize: 25,

    // giphy search settings
    // 'g', 'pg13', or 'r' - keeping results clean, or not. pg13 *seems* to be generally ok for the Twitch ToS.
    // see: https://developers.giphy.com/docs/optional-settings#rating
    giphy_rating: "g",
    // put your giphy api key here - but DON'T then commit this file to version control
    giphy_apiKey: "your-giphy-apikey",
  }
};