# jssdk

[![Build](https://github.com/screenshotone/jssdk/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/screenshotone/jssdk/actions/workflows/build.yml)
[![NPM package](https://img.shields.io/npm/v/screenshotone-api-sdk.svg?branch=main)](https://www.npmjs.com/package/screenshotone-api-sdk)

An official [Screenshot API](https://screenshotone.com/) client for JavaScript and TypeScript. 

It takes minutes to start taking screenshots. Just [sign up](https://screenshotone.com/) to get access and secret keys, import the client, and you are ready to go. 

The SDK client is synchronized with the latest [screenshot API options](https://screenshotone.com/docs/options/).

## Installation

```shell
npm install screenshotone-api-sdk --save
```

## Usage

Generate a screenshot URL without executing the request. Or download the screenshot. It is up to you: 
```javascript
import * as fs from 'fs';
import * as screenshotone from 'screenshotone-api-sdk';

// create API client 
const client = new screenshotone.Client("<access key>", "<secret key>");

// set up options
const options = screenshotone.TakeOptions
    .url("https://example.com")
    .delay(3)
    .blockAds(true);    

// generate URL 
const url = client.generateTakeURL(options);
console.log(url);
// expected output: https://api.screenshotone.com/take?url=https%3A%2F%2Fexample.com&delay=3&block_ads=true&access_key=%3Caccess+key%3E&signature=7f3419ece2c53ed2c7923c7d5deef290d662c3643822bf69ec8259ce10b3ea61

// download the screenshot and handle potential errors
try {
    const imageBlob = await client.take(options);

    const buffer = Buffer.from(await imageBlob.arrayBuffer());
    fs.writeFileSync("example.png", buffer);
} catch (error) {
    if (error instanceof screenshotone.APIError) {
        // An API error occurred with 
        // HTTP Status Code: error.httpStatusCode
        // Error Code: error.errorCode
        // Error Message: error.errorMessage
        // Documentation URL: error.documentationUrl 
    } else if (error instanceof screenshotone.ConnectionError) {
        // The connection to the API failed, for example with ECONNRESET.
        // error.message explains what happened and what usually causes it.
        // Code: error.code, for example "ECONNRESET"
        // Phase: error.phase, "request" (before the API responded) or "response" (while downloading)
        // Attempts: error.attempts
        // Time from the last attempt's start to the failure: error.lastElapsedMs
        // Time from the first attempt's start, retry waits included: error.totalElapsedMs
        console.error(error.message);
    } else {        
        // An unexpected error occurred
        console.error("An unexpected error occurred:", error.message);
    }
}
```

### Connection errors and retries

A request can fail on the network between your server and the API, for example with `ECONNRESET` when a proxy, NAT gateway or firewall closes the connection. The SDK then throws a `ConnectionError` that says:

- whether the connection broke before the API responded (`phase: "request"`) or while the result was downloading (`phase: "response"`, with `httpStatusCode`)
- how many attempts were made (`attempts`)
- how long after the last attempt started (`lastElapsedMs`), and how long after the first one started, waits between retries included (`totalElapsedMs`)
- what usually causes it

To retry connection resets automatically, set `maxRetries`. It's 0 by default, so the SDK doesn't retry unless you set it:

```javascript
const client = new screenshotone.Client("<access key>", "<secret key>", {
    maxRetries: 3,
});
```

Retries apply only to `ECONNRESET` and wait with exponential backoff. A retry sends the request again. If the API had already finished the first one, the retry renders the screenshot again and counts toward your usage again, unless the result is served from the cache.

Many requests starting at once make connection resets more likely. If you take screenshots in large batches, limit how many requests run at the same time.

## Build and publish (a manual for SDK developers)

To build and publish the SDK: 

1. Bump the version property in the `package.json` file. 
2. Run `npm run prepare`. 
3. Run `npm publish`.

## License 

`screenshotone/jssdk` is released under [the MIT license](LICENSE).
