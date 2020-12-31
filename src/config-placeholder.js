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

const config = {

  debug: false, // enable some extra logging

  // the twitch channel to observe...
  // can be anyone, twitch chats are all public and require no authentication to read from.
  channel: 'mikedotalmond', // 1030jh, limmy, zafarcakes, etc...

  sentiment: {
    bufferSize:25
  },

  giphy: {
    searchEndpoint: "https://api.giphy.com/v1/gifs/search",
    rating:"g", // keeping results clean, see: https://developers.giphy.com/docs/optional-settings#rating
    apiKey: "your-giphy-apikey", // put your giphy api key here - but DON'T then commit this file to version control
  },
};

export default config;