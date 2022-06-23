import * as crypto from 'crypto';
import Big from 'big.js';
import fetch from 'cross-fetch';

const API_BASE_URL = "https://api.screenshotone.com";
const API_TAKE_PATH = "/take";

/**
 * Represents an API client for the screenshotone.com API.
 */
export class Client {
    private readonly accessKey: string;
    private readonly secretKey: string;

    constructor(accessKey: string, secretKey: string) {
        this.accessKey = accessKey;
        this.secretKey = secretKey;
    }

    generateTakeURL(options: TakeOptions): string {
        const query = options.toQuery();
        query.append("access_key", this.accessKey);
        let queryString = query.toString();

        const signature = crypto.createHmac("sha256", this.secretKey)
            .update(queryString, 'utf-8')
            .digest('hex');
        queryString += '&signature=' + signature;

        return `${API_BASE_URL}${API_TAKE_PATH}?${queryString}`;
    }

    async take(options: TakeOptions): Promise<Blob> {
        const url = this.generateTakeURL(options);
        const response = await fetch(url);
        if (response.ok) {
            return await response.blob()
        }

        const data = await response.json();

        throw new Error(`failed to take screenshot, response returned ${response.status} ${response.statusText}: ${data?.message}`);
    }
}

/**
 * Represents options for taking screenshots.
 */
export class TakeOptions {
    private readonly query: URLSearchParams;

    private constructor(url: string) {
        const query = new URLSearchParams();
        query.append("url", url);

        this.query = query;
    }

    /**
     * Initializes take screenshot options with provided website URL.
     */
    static url(url: string): TakeOptions {
        return new TakeOptions(url);
    }

    /**
     * Initializes take screenshot options with provided HTML.
     */
    static html(url: string): TakeOptions {
        return new TakeOptions(url);
    }

    private put(key: string, ...values: string[]) {
        for (const value of values) {
            this.query.append(key, value);
        }
    };

    /**
    * Selector is a CSS-like selector of the element to take a screenshot of.
    */
    selector(selector: string) {
        this.put("selector", selector);

        return this;
    }

    /**
     * It determines the behavior of what to do when selector is not found.
     */
    errorOnSelectorNotFound(errorOn: boolean) {
        this.put("error_on_selector_not_found", errorOn ? "true" : "false");

        return this;
    }

    /**
     * Styles specifies custom CSS styles for the page.
     */
    styles(styles: string) {
        this.put("styles", styles);

        return this;
    }

    /**
     * Scripts specifies custom scripts for the page.
     */
    scripts(scripts: string) {
        this.put("scripts", scripts);

        return this;
    }


    /**
     * Renders the full page.
     */
    fullPage(fullPage: boolean): TakeOptions {
        this.put("full_page", fullPage ? "true" : "false");

        return this;
    }

    /**
     * Sets response format, one of: "png", "jpeg", "webp" or "jpg".
     */
    format(format: string): TakeOptions {
        this.put("format", format);

        return this;
    }

    /**
     * Renders image with the specified quality. Available for the next formats: "jpeg" ("jpg"), "webp".
     */
    imageQuality(imageQuality: number): TakeOptions {
        this.put("image_quality", imageQuality.toString());

        return this;
    }

    /**
     * Renders a transparent background for the image. Works only if the site has not defined background color.
     * Available for the following response formats: "png", "webp".
     */
    omitBackground(omitBackground: boolean): TakeOptions {
        this.put("omit_background", omitBackground ? "true" : "false");

        return this;
    }

    /**
     * Sets the width of the browser viewport (pixels).
     */
    viewportWidth(viewportWidth: number): TakeOptions {
        this.put("viewport_width", viewportWidth.toString());

        return this;
    }

    /**
     * Sets the height of the browser viewport (pixels).
     */
    viewportHeight(viewportHeight: number): TakeOptions {
        this.put("viewport_height", viewportHeight.toString());

        return this;
    }

    /**
     * Sets the device scale factor. Acceptable value is one of: 1, 2 or 3.
     */
    deviceScaleFactor(deviceScaleFactor: number): TakeOptions {
        this.put("device_scale_factor", deviceScaleFactor.toString());

        return this;
    }

    /**
     * Sets geolocation latitude for the request.
     * Both latitude and longitude are required if one of them is set.
     */
    geolocationLatitude(latitude: number): TakeOptions {
        this.put("geolocation_latitude", new Big(latitude).toFixed(20).replace(/0+$/, ""));

        return this;
    }

    /**
     * Sets geolocation longitude for the request. Both latitude and longitude are required if one of them is set.
     */
    geolocationLongitude(longitude: number): TakeOptions {
        this.put("geolocation_longitude", new Big(longitude).toFixed(20).replace(/0+$/, ""));

        return this;
    }

    /**
     * Sets the geolocation accuracy in meters.
     */
    geolocationAccuracy(accuracy: number): TakeOptions {
        this.put("geolocation_accuracy", accuracy.toString());

        return this;
    }

    /**
     * Blocks ads.
     */
    blockAds(blockAds: boolean): TakeOptions {
        this.put("block_ads", blockAds ? "true" : "false");

        return this;
    }

    /**
     * Blocks trackers.
     */
    blockTrackers(blockTrackers: boolean): TakeOptions {
        this.put("block_trackers", blockTrackers ? "true" : "false");

        return this;
    }

    /**
     * Blocks requests by specifying URL, domain, or even a simple pattern.
     */
    blockRequests(...blockRequests: string[]): TakeOptions {
        this.put("block_requests", ...blockRequests);

        return this;
    }

    /**
     * Blocks loading resources by type. Available resource types are: "document", "stylesheet", "image", "media",
     * "font", "script", "texttrack", "xhr", "fetch", "eventsource", "websocket", "manifest", "other".
     */
    blockResources(...blockResources: string[]): TakeOptions {
        this.put("block_resources", ...blockResources);

        return this;
    }

    /**
     * Enables caching.
     */
    cache(cache: boolean): TakeOptions {
        this.put("cache", cache ? "true" : "false");

        return this;
    }

    /**
     * Sets cache TTL.
     */
    cacheTtl(cacheTTL: number): TakeOptions {
        this.put("cache_ttl", cacheTTL.toString());

        return this;
    }

    /**
     * Sets cache key.
     */
    cacheKey(cacheKey: string): TakeOptions {
        this.put("cache_key", cacheKey);

        return this;
    }

    /**
     * Sets a user agent for the request.
     */
    userAgent(userAgent: string): TakeOptions {
        this.put("user_agent", userAgent);

        return this;
    }

    /**
     * Sets an authorization header for the request.
     */
    authorization(authorization: string): TakeOptions {
        this.put("authorization", authorization);

        return this;
    }

    /**
     * Set cookies for the request.
     */
    cookies(...cookies: string[]): TakeOptions {
        this.put("cookies", ...cookies);

        return this;
    }

    /**
     * Sets extra headers for the request.
     */
    headers(...headers: string[]) {
        this.put("headers", ...headers);

        return this;
    }

    /**
     * TimeZone sets time zone for the request.
     * Available time zones are: "America/Santiago", "Asia/Shanghai", "Europe/Berlin", "America/Guayaquil",
     * "Europe/Madrid", "Pacific/Majuro", "Asia/Kuala_Lumpur", "Pacific/Auckland", "Europe/Lisbon", "Europe/Kiev",
     * "Asia/Tashkent", "Europe/London".
     */
    timeZone(timeZone: string): TakeOptions {
        this.put("time_zone", timeZone);

        return this;
    }

    /**
     * Sets delay.
     */
    delay(delay: number): TakeOptions {
        this.put("delay", delay.toString());

        return this;
    }

    /**
     * Sets timeout.
     */
    timeout(timeout: number): TakeOptions {
        this.put("timeout", timeout.toString());

        return this;
    }

    toQuery(): URLSearchParams {
        return new URLSearchParams(this.query.toString());
    }
}