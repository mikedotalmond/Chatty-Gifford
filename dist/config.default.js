/**
 * General config
 * 
 * 
 * Make a copy of this file and rename it to "config.js",
 * 
 * ... then replace the giphy.apiKey value with your own giphy API key 
 * - https://support.giphy.com/hc/en-us/articles/360020283431-Request-A-GIPHY-API-Key
 * - https://developers.giphy.com/
 * 
 * ... set the `channel` value to the twitch channel you want to use
 */

window.sentimentWall = {

  config: {

    debug: false, // mostly just enables some extra logging to the developer console

    // the twitch channel to observe...
    // can be anyone, twitch chats are all public and require no authentication to read from.
    channel: 'mikedotalmond', // 1030jh, limmy, zafarcakes, etc...

    // number of gif items to keep in the display at once. will need to change if the grid size is altered in the CSS.
    bufferSize: 25,


    // giphy specifics

    // 'g', 'pg13', or 'r' - keeping results clean, or not. pg13 seems to be generally ok for Twitch's ToS.
    // see: https://developers.giphy.com/docs/optional-settings#rating
    giphy_rating: "g",

    // put your giphy api key here - but DON'T then commit this file to version control
    giphy_apiKey: "your-giphy-apikey", 
  }
};