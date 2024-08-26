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

// download the screenshot and handle potential API errors
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
    } else {        
        // An unexpected error occurred
        console.error("An unexpected error occurred:", error.message);
    }
}
```

## Build and publish (a manual for SDK developers)

To build and publish the SDK: 

1. Bump the version property in the `package.json` file. 
2. Run `npm run prepare`. 
3. Run `npm publish`.

## License 

`screenshotone/jssdk` is released under [the MIT license](LICENSE).
