import { TakeOptions, Client } from '../src/main';

describe('testing client', () => {
    const client = new Client('RcLsdM6uhIN6gw', 'MW2vfkkgLTzGGw');

    test('example.com with block ads URL generated and signed correctly', () => {
        const options = TakeOptions.url('https://example.com').blockAds(true);

        expect(client.generateTakeURL(options)).toBe('https://api.screenshotone.com/take?url=https%3A%2F%2Fexample.com&block_ads=true&access_key=RcLsdM6uhIN6gw&signature=3cf1edeafc139f41191928c1c5b8b04fe1d5722560244ccdd76a55d69120bbac');
    });

    test('example.com with block ads, full page and user agent URL generated and signed correctly', () => {
        const options = TakeOptions
            .url('https://example.com')
            .blockAds(true)
            .fullPage(true)
            .userAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36');

        expect(client.generateTakeURL(options)).toBe('https://api.screenshotone.com/take?url=https%3A%2F%2Fexample.com&block_ads=true&full_page=true&user_agent=Mozilla%2F5.0+%28X11%3B+Linux+x86_64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F51.0.2704.103+Safari%2F537.36&access_key=RcLsdM6uhIN6gw&signature=ea217db7d746c8bf9b710257d62ef09670b003137d239ee4c81eae3645b4a901');
    });    
});