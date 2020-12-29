const giphySearchEndpoint = "https://api.giphy.com/v1/gifs/search";

let response;
let api_key;
let afinn165;

let rndInt = n => (Math.random() * n) | 0;

async function loadLocalData() {
  response = await fetch("./giphy-apikey.json");
  api_key = (await response.json()).key;
  console.log("api_key", api_key);

  response = await fetch("./afinn-165.json");
  afinn165 = await response.json();
  console.log("afinn165", afinn165);
};


async function queryGiphy(api_key, query, limit=25, offset=0, rating="g", lang="en") {
  console.log("querying giphy for:", query);
  const request = `?api_key=${api_key}&q=${query}&limit=${limit}&offset=${offset}&rating=${rating}&lang=${lang}`;
  const result = await fetch(`${giphySearchEndpoint}${request}`);
  const data = await result.json();

  if(data?.meta?.status == 200 || data?.meta?.msg == "OK"){
    console.log("data ok");
    return data.data;
  }

  console.warn("response data not ok", data);
  return null;
}


async function init(){

  await loadLocalData();
  let afinnKeys = Object.keys(afinn165);
  console.log(afinnKeys);

  let testData = await queryGiphy(api_key, afinnKeys[rndInt(afinnKeys.length)]);
  console.log(testData);

  const imageData = testData[rndInt(testData.length)].images.original;
  let {url, width, height} = imageData;
  console.log("url", url);
  console.log(width, height);

  // giphy no longer just returns a gif, it's an html page with a gif/webm/mp4 embedded. We only want the gif... so this picks it out.
  let assetId = url.substr(0, url.indexOf("/giphy.gif?"));
  assetId = assetId.substring(assetId.lastIndexOf("/")+1);
  const gifURL = `https://i.giphy.com/media/${assetId}/giphy.gif`
  console.log(gifURL);

}


init().then(()=>{
  console.log("ready");
});
