import Big from "big.js";
import fetch from "cross-fetch";
import { signQueryString } from "./signature";

const API_BASE_URL = "https://api.screenshotone.com";
const API_TAKE_PATH = "/take";
const API_ANIMATE_PATH = "/animate";

/**
 * Represents an API client for the ScreenshotOne.com API.
 */
export class Client {
    private readonly accessKey: string;
    private readonly secretKey: string;

    constructor(accessKey: string, secretKey: string) {
        if (!accessKey || !secretKey) {
            throw new Error(
                "Both non-empty access and secret keys are required"
            );
        }

        this.accessKey = accessKey;
        this.secretKey = secretKey;
    }

    /**
     * Generates an URL that can be used to send GET requests for taking screenshots.
     *
     * Warning! Don't share the link publicly generated by this method publicly.
     *
     * @param options Options for taking the screenshot.
     * @returns An URL that will generate the screenshot if requested.
     */
    async generateTakeURL(options: TakeOptions): Promise<string> {
        const query = options.toQuery();
        query.append("access_key", this.accessKey);
        let queryString = query.toString();

        return `${API_BASE_URL}${API_TAKE_PATH}?${queryString}`;
    }

    /**
     * Generates the link that can be publicly available, but make sure
     * you read the documentation before at https://screenshotone.com/docs/signed-requests/.
     *
     * @param options
     * @returns A signed URL that will generate the screenshot if requested.
     */
    async generateSignedTakeURL(options: TakeOptions): Promise<string> {
        const query = options.toQuery();
        query.append("access_key", this.accessKey);
        let queryString = query.toString();

        const signature = await signQueryString(queryString, this.secretKey);
        queryString += "&signature=" + signature;

        return `${API_BASE_URL}${API_TAKE_PATH}?${queryString}`;
    }

    /**
     * Generates the link that can be publicly available, but make sure
     * you read the documentation before at https://screenshotone.com/docs/signed-requests/.
     *
     * @param options
     * @returns A signed URL that will generate the animated screenshot if requested.
     */
    async generateSignedAnimateURL(options: AnimateOptions): Promise<string> {
        const query = options.toQuery();
        query.append("access_key", this.accessKey);
        let queryString = query.toString();

        const signature = await signQueryString(queryString, this.secretKey);
        queryString += "&signature=" + signature;

        return `${API_BASE_URL}${API_ANIMATE_PATH}?${queryString}`;
    }

    /**
     * Generates a screenshot and return the image blob.
     *
     * @param options
     * @returns
     */
    async take(options: TakeOptions): Promise<Blob> {
        const url = await this.generateSignedTakeURL(options);
        const response = await fetch(url);
        if (response.ok) {
            return await response.blob();
        }

        try {
            const data = await response.json();

            throw new Error(
                `failed to take screenshot, response returned ${response.status} ${response.statusText}: ${data?.message}`
            );
        } catch (e) {
            throw new Error(
                `failed to take screenshot, response returned ${response.status} ${response.statusText}`
            );
        }
    }

    /**
     * Generates an animated screenshot and return the image blob.
     *
     * @param options
     * @returns
     */
    async animate(options: AnimateOptions): Promise<Blob> {
        const url = await this.generateSignedAnimateURL(options);
        const response = await fetch(url);
        if (response.ok) {
            return await response.blob();
        }

        try {
            const data = await response.json();

            throw new Error(
                `failed to generate animation, response returned ${response.status} ${response.statusText}: ${data?.message}`
            );
        } catch (e) {
            throw new Error(
                `failed to generate animation, response returned ${response.status} ${response.statusText}`
            );
        }
    }

    /**
     * Generates an animated screenshot and return the image blob.
     *
     * @param options
     * @returns
     */
    async store(
        options: AnimateOptions | TakeOptions,
        path: string,
        bucket?: string,
        acl?: "public-read" | "",
        storageClass?: string
    ): Promise<{ bucket: string | null; key: string | null }> {
        options.store(true).storagePath(path).responseType("empty");

        if (bucket) {
            options.storageBucket(bucket);
        }
        if (acl) {
            options.storageACL(acl);
        }
        if (storageClass) {
            options.storageClass(storageClass);
        }

        const url =
            options instanceof TakeOptions
                ? await this.generateSignedTakeURL(options)
                : await this.generateSignedAnimateURL(options);

        const response = await fetch(url);
        if (response.ok) {
            return {
                key: response.headers.get("X-ScreenshotOne-Store-Key"),
                bucket: response.headers.get("X-ScreenshotOne-Store-Bucket"),
            };
        }

        const data = await response.json();

        throw new Error(
            `failed to take screenshot, response returned ${response.status} ${response.statusText}: ${data?.message}`
        );
    }
}

/**
 * Represents options for taking screenshots.
 */
export class TakeOptions {
    private readonly query: URLSearchParams;

    private constructor() {
        const query = new URLSearchParams();

        this.query = query;
    }

    /**
     * Initializes take screenshot options with provided website URL.
     */
    static url(url: string): TakeOptions {
        const options = new TakeOptions();
        options.put("url", url);

        return options;
    }

    /**
     * Initializes take screenshot options with provided HTML.
     */
    static html(html: string): TakeOptions {
        const options = new TakeOptions();
        options.put("html", html);

        return options;
    }

    /**
     * Initializes take screenshot options with provided Markdown.
     */
    static markdown(markdown: string): TakeOptions {
        const options = new TakeOptions();
        options.put("markdown", markdown);

        return options;
    }

    private put(key: string, ...values: string[]) {
        for (const value of values) {
            if (values.length == 1) {
                this.query.set(key, value);
            } else {
                this.query.append(key, value);
            }
        }
    }

    /**
     * Selector is a CSS-like selector of the element to take a screenshot of.
     */
    selector(selector: string) {
        this.put("selector", selector);

        return this;
    }

    /**
     * Available response types:
     * by_format — return exactly the response defined in the format option. If format=png, the response will be the binary representation of the png with the content type header image/png;
     * empty — return only status or error. It is suitable when you want to upload the screenshot to storage and don’t care about the results. It also speeds up the response since there are no networking costs involved.
     * The default value is by_format.
     */
    responseType(responseType: string) {
        this.put("response_type", responseType);

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
     * Capture beyond the viewport.
     */
    captureBeyondViewport(beyond: boolean) {
        this.put("capture_beyond_viewport", beyond ? "true" : "false");

        return this;
    }

    /**
     * When reduced_motion set to `true`,
     * the API will request the site to minimize the amount of non-essential motion it uses.
     * When the site supports it, it should use animations as least as possible.
     */
    reducedMotion(darkMode: boolean): TakeOptions {
        this.put("reduced_motion", darkMode ? "true" : "false");

        return this;
    }

    /**
     * If you want to request the page and it is supported to be rendered for printers, specify `print`.
     * If the page is by default rendered for printers and you want it to be rendered for screens,
     * use `screen`.
     */
    mediaType(mediaType: string): TakeOptions {
        this.put("media_type", mediaType);

        return this;
    }

    /**
     * Set `true` to request site rendering, if supported, in the dark mode.
     * Set `false` to request site rendering in the light mode if supported.
     * If you don’t set the parameter. The site is rendered in the default mode.
     */
    darkMode(darkMode: boolean): TakeOptions {
        this.put("dark_mode", darkMode ? "true" : "false");

        return this;
    }

    /**
     * The `hide_selectors` option allows hiding elements before taking a screenshot.
     * You can specify as many selectors as you wish.
     * All elements that match each selector will be hidden by
     * setting the `display` style property to none `!important`.
     */
    hideSelectors(...selectors: string[]): TakeOptions {
        this.put("hide_selectors", ...selectors);

        return this;
    }

    /**
     * The scripts_wain_until option allows you to wait until a given
     * set of events after the scripts were executed.
     * It accepts the same values as wait_until and can have multiple values:
     *  - `load`: the navigation is successful when the load even is fired;
     *  - `domcontentloaded`: the navigation is finished when the DOMContentLoaded even is fired;
     *  - `networkidle0`: the navigation is finished when there are no more than 0 network connections for at least 500 ms;
     *  _ `networkidle2`: consider navigation to be finished when there are no more than 2 network connections for at least 500 ms.
     */
    scriptsWaitUntil(...until: string[]): TakeOptions {
        this.put("scripts_wait_until", ...until);

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
     * Max height.
     */
    fullPageMaxHeight(maxHeight: number): TakeOptions {
        this.put("full_page_max_height", maxHeight.toString());

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
     * Sets IP country code.
     */
    ipCountryCode(format: string): TakeOptions {
        this.put("ip_country_code", format);

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
     * Instead of manually specifying viewport parameters like width and height,
     * you can specify a device to use for emulation.
     * In addition, other parameters of the viewport, including the user agent,
     * will be set automatically.
     */
    viewportDevice(viewportDevice: string): TakeOptions {
        this.put("viewport_device", viewportDevice);

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
     * Whether the meta viewport tag is taken into account. Defaults to `false`.
     */
    viewportMobile(isMobile: boolean): TakeOptions {
        this.put("viewport_mobile", isMobile ? "true" : "false");

        return this;
    }

    /**
     * The default value is `false`. Set to `true` if the viewport supports touch events.
     */
    viewportHasTouch(hasTouch: boolean): TakeOptions {
        this.put("viewport_has_touch", hasTouch ? "true" : "false");

        return this;
    }

    /**
     * The default value is `false`. Set to `true` if the viewport is in landscape mode.
     */
    viewportLandscape(landscape: boolean): TakeOptions {
        this.put("viewport_landscape", landscape ? "true" : "false");

        return this;
    }

    /**
     * Sets geolocation latitude for the request.
     * Both latitude and longitude are required if one of them is set.
     */
    geolocationLatitude(latitude: number): TakeOptions {
        this.put(
            "geolocation_latitude",
            new Big(latitude).toFixed(20).replace(/0+$/, "")
        );

        return this;
    }

    /**
     * Sets geolocation longitude for the request. Both latitude and longitude are required if one of them is set.
     */
    geolocationLongitude(longitude: number): TakeOptions {
        this.put(
            "geolocation_longitude",
            new Big(longitude).toFixed(20).replace(/0+$/, "")
        );

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
     * Blocks banners by heuristics.
     */
    blockBannersByHeuristics(block: boolean): TakeOptions {
        this.put("block_banners_by_heuristics", block ? "true" : "false");

        return this;
    }

    /**
     * Blocks cookie banners.
     */
    blockCookieBanners(block: boolean): TakeOptions {
        this.put("block_cookie_banners", block ? "true" : "false");

        return this;
    }

    /**
     * Blocks chats.
     */
    blockChats(block: boolean): TakeOptions {
        this.put("block_chats", block ? "true" : "false");

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
     * It scrolls the page if needed and ensures that the given
     * selector is present in the view when taking a screenshot.
     */
    scrollIntoView(selector: string): TakeOptions {
        this.put("scroll_into_view", selector);

        return this;
    }

    /**
     * You can use your custom proxy to take screenshots
     * or render HTML with the proxy option.
     *
     * The https, http, socks4 and socks5 proxies are supported.
     */
    proxy(proxy: string): TakeOptions {
        this.put("proxy", proxy);

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

    /**
     * Sets navigation timeout.
     */
    navigationTimeout(timeout: number): TakeOptions {
        this.put("navigation_timeout", timeout.toString());

        return this;
    }

    /**
     * Default value is false. Use store=true to trigger upload of the taken screenshot,
     * rendered HTML or PDF to the configured S3 bucket.
     * Make sure you configured access to S3.
     */
    store(store: boolean): TakeOptions {
        this.put("store", store ? "true" : "false");

        return this;
    }

    /**
     * The parameter is required if you set store=true.
     * You must specify the key for the file, but don’t specify an extension,
     * it will be added automatically based on the format you specified.
     * You can also specify “subdirectories” in the path part.
     */
    storagePath(path: string): TakeOptions {
        this.put("storage_path", path);

        return this;
    }

    storageACL(acl: string): TakeOptions {
        this.put("storage_acl", acl);

        return this;
    }

    /**
     * You can override the default bucket you configured with storage_bucket=<bucket name>.
     */
    storageBucket(bucket: string): TakeOptions {
        this.put("storage_bucket", bucket);

        return this;
    }

    /**
     * Storage class allows you to specify the object storage class.
     */
    storageClass(storageClass: string): TakeOptions {
        this.put("storage_class", storageClass);

        return this;
    }

    toQuery(): URLSearchParams {
        return new URLSearchParams(this.query.toString());
    }
}

/**
 * Represents options for animating screenshots.
 */
export class AnimateOptions {
    private readonly query: URLSearchParams;

    private constructor() {
        const query = new URLSearchParams();

        this.query = query;
    }

    /**
     * Initializes take screenshot options with provided website URL.
     */
    static url(url: string): AnimateOptions {
        const options = new AnimateOptions();
        options.put("url", url);

        return options;
    }

    /**
     * Initializes take screenshot options with provided HTML.
     */
    static html(html: string): AnimateOptions {
        const options = new AnimateOptions();
        options.put("html", html);

        return options;
    }

    /**
     * Initializes take screenshot options with provided Markdown.
     */
    static markdown(markdown: string): AnimateOptions {
        const options = new AnimateOptions();
        options.put("markdown", markdown);

        return options;
    }

    private put(key: string, ...values: string[]) {
        for (const value of values) {
            if (values.length == 1) {
                this.query.set(key, value);
            } else {
                this.query.append(key, value);
            }
        }
    }

    /**
     * Available response types:
     * by_format — return exactly the response defined in the format option. If format=png, the response will be the binary representation of the png with the content type header image/png;
     * empty — return only status or error. It is suitable when you want to upload the screenshot to storage and don’t care about the results. It also speeds up the response since there are no networking costs involved.
     * The default value is by_format.
     */
    responseType(responseType: string) {
        this.put("response_type", responseType);

        return this;
    }

    /**
     * When reduced_motion set to `true`,
     * the API will request the site to minimize the amount of non-essential motion it uses.
     * When the site supports it, it should use animations as least as possible.
     */
    reducedMotion(darkMode: boolean): AnimateOptions {
        this.put("reduced_motion", darkMode ? "true" : "false");

        return this;
    }

    /**
     * If you want to request the page and it is supported to be rendered for printers, specify `print`.
     * If the page is by default rendered for printers and you want it to be rendered for screens,
     * use `screen`.
     */
    mediaType(mediaType: string): AnimateOptions {
        this.put("media_type", mediaType);

        return this;
    }

    /**
     * Set `true` to request site rendering, if supported, in the dark mode.
     * Set `false` to request site rendering in the light mode if supported.
     * If you don’t set the parameter. The site is rendered in the default mode.
     */
    darkMode(darkMode: boolean): AnimateOptions {
        this.put("dark_mode", darkMode ? "true" : "false");

        return this;
    }

    /**
     * The `hide_selectors` option allows hiding elements before taking a screenshot.
     * You can specify as many selectors as you wish.
     * All elements that match each selector will be hidden by
     * setting the `display` style property to none `!important`.
     */
    hideSelectors(...selectors: string[]): AnimateOptions {
        this.put("hide_selectors", ...selectors);

        return this;
    }

    /**
     * The scripts_wain_until option allows you to wait until a given
     * set of events after the scripts were executed.
     * It accepts the same values as wait_until and can have multiple values:
     *  - `load`: the navigation is successful when the load even is fired;
     *  - `domcontentloaded`: the navigation is finished when the DOMContentLoaded even is fired;
     *  - `networkidle0`: the navigation is finished when there are no more than 0 network connections for at least 500 ms;
     *  _ `networkidle2`: consider navigation to be finished when there are no more than 2 network connections for at least 500 ms.
     */
    scriptsWaitUntil(...until: string[]): AnimateOptions {
        this.put("scripts_wait_until", ...until);

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
     * You can use your custom proxy to take screenshots
     * or render HTML with the proxy option.
     *
     * The https, http, socks4 and socks5 proxies are supported.
     */
    proxy(proxy: string): AnimateOptions {
        this.put("proxy", proxy);

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
     * Sets response format, one of: "mp4", "avi", "webm", "mov" or "gif".
     */
    format(format: string): AnimateOptions {
        this.put("format", format);

        return this;
    }

    /**
     * Renders a transparent background for the image. Works only if the site has not defined background color.
     * Available for the following response formats: "png", "webp".
     */
    omitBackground(omitBackground: boolean): AnimateOptions {
        this.put("omit_background", omitBackground ? "true" : "false");

        return this;
    }

    /**
     * Instead of manually specifying viewport parameters like width and height,
     * you can specify a device to use for emulation.
     * In addition, other parameters of the viewport, including the user agent,
     * will be set automatically.
     */
    viewportDevice(viewportDevice: string): AnimateOptions {
        this.put("viewport_device", viewportDevice);

        return this;
    }

    /**
     * Sets the width of the browser viewport (pixels).
     */
    viewportWidth(viewportWidth: number): AnimateOptions {
        this.put("viewport_width", viewportWidth.toString());

        return this;
    }

    /**
     * Sets the height of the browser viewport (pixels).
     */
    viewportHeight(viewportHeight: number): AnimateOptions {
        this.put("viewport_height", viewportHeight.toString());

        return this;
    }

    /**
     * Sets the device scale factor. Acceptable value is one of: 1, 2 or 3.
     */
    deviceScaleFactor(deviceScaleFactor: number): AnimateOptions {
        this.put("device_scale_factor", deviceScaleFactor.toString());

        return this;
    }

    /**
     * Whether the meta viewport tag is taken into account. Defaults to `false`.
     */
    viewportMobile(isMobile: boolean): AnimateOptions {
        this.put("viewport_mobile", isMobile ? "true" : "false");

        return this;
    }

    /**
     * The default value is `false`. Set to `true` if the viewport supports touch events.
     */
    viewportHasTouch(hasTouch: boolean): AnimateOptions {
        this.put("viewport_has_touch", hasTouch ? "true" : "false");

        return this;
    }

    /**
     * The default value is `false`. Set to `true` if the viewport is in landscape mode.
     */
    viewportLandscape(landscape: boolean): AnimateOptions {
        this.put("viewport_landscape", landscape ? "true" : "false");

        return this;
    }

    /**
     * Sets geolocation latitude for the request.
     * Both latitude and longitude are required if one of them is set.
     */
    geolocationLatitude(latitude: number): AnimateOptions {
        this.put(
            "geolocation_latitude",
            new Big(latitude).toFixed(20).replace(/0+$/, "")
        );

        return this;
    }

    /**
     * Sets geolocation longitude for the request. Both latitude and longitude are required if one of them is set.
     */
    geolocationLongitude(longitude: number): AnimateOptions {
        this.put(
            "geolocation_longitude",
            new Big(longitude).toFixed(20).replace(/0+$/, "")
        );

        return this;
    }

    /**
     * Sets the geolocation accuracy in meters.
     */
    geolocationAccuracy(accuracy: number): AnimateOptions {
        this.put("geolocation_accuracy", accuracy.toString());

        return this;
    }

    /**
     * Blocks ads.
     */
    blockAds(blockAds: boolean): AnimateOptions {
        this.put("block_ads", blockAds ? "true" : "false");

        return this;
    }

    /**
     * Blocks cookie banners.
     */
    blockCookieBanners(block: boolean): AnimateOptions {
        this.put("block_cookie_banners", block ? "true" : "false");

        return this;
    }

    /**
     * Blocks chats.
     */
    blockChats(block: boolean): AnimateOptions {
        this.put("block_chats", block ? "true" : "false");

        return this;
    }

    /**
     * Blocks trackers.
     */
    blockTrackers(blockTrackers: boolean): AnimateOptions {
        this.put("block_trackers", blockTrackers ? "true" : "false");

        return this;
    }

    /**
     * Blocks requests by specifying URL, domain, or even a simple pattern.
     */
    blockRequests(...blockRequests: string[]): AnimateOptions {
        this.put("block_requests", ...blockRequests);

        return this;
    }

    /**
     * Blocks loading resources by type. Available resource types are: "document", "stylesheet", "image", "media",
     * "font", "script", "texttrack", "xhr", "fetch", "eventsource", "websocket", "manifest", "other".
     */
    blockResources(...blockResources: string[]): AnimateOptions {
        this.put("block_resources", ...blockResources);

        return this;
    }

    /**
     * Blocks banners by heuristics.
     */
    blockBannersByHeuristics(block: boolean): AnimateOptions {
        this.put("block_banners_by_heuristics", block ? "true" : "false");

        return this;
    }

    /**
     * Enables caching.
     */
    cache(cache: boolean): AnimateOptions {
        this.put("cache", cache ? "true" : "false");

        return this;
    }

    /**
     * Sets cache TTL.
     */
    cacheTtl(cacheTTL: number): AnimateOptions {
        this.put("cache_ttl", cacheTTL.toString());

        return this;
    }

    /**
     * Sets cache key.
     */
    cacheKey(cacheKey: string): AnimateOptions {
        this.put("cache_key", cacheKey);

        return this;
    }

    /**
     * Sets a user agent for the request.
     */
    userAgent(userAgent: string): AnimateOptions {
        this.put("user_agent", userAgent);

        return this;
    }

    /**
     * Sets an authorization header for the request.
     */
    authorization(authorization: string): AnimateOptions {
        this.put("authorization", authorization);

        return this;
    }

    /**
     * Set cookies for the request.
     */
    cookies(...cookies: string[]): AnimateOptions {
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
    timeZone(timeZone: string): AnimateOptions {
        this.put("time_zone", timeZone);

        return this;
    }

    /**
     * Sets delay.
     */
    delay(delay: number): AnimateOptions {
        this.put("delay", delay.toString());

        return this;
    }

    /**
     * Sets timeout.
     */
    timeout(timeout: number): AnimateOptions {
        this.put("timeout", timeout.toString());

        return this;
    }

    /**
     * Sets navigation timeout.
     */
    navigationTimeout(timeout: number): AnimateOptions {
        this.put("navigation_timeout", timeout.toString());

        return this;
    }

    /**
     * Default value is false. Use store=true to trigger upload of the taken screenshot,
     * rendered HTML or PDF to the configured S3 bucket.
     * Make sure you configured access to S3.
     */
    store(store: boolean): AnimateOptions {
        this.put("store", store ? "true" : "false");

        return this;
    }

    /**
     * Access key ID. It overrides the one specified in the dashboard configuration.
     */
    storageAccessKeyId(accessKeyId: string): AnimateOptions {
        this.put("storage_access_key_id", accessKeyId);

        return this
    }

    /**
     * Secret access key. It overrides the one specified in the dashboard configuration.
     */
    storageSecretAccessKey(secretAccessKey: string): AnimateOptions {
        this.put("storage_secret_access_key", secretAccessKey);

        return this
    }

    /**
     * The parameter is required if you set store=true.
     * You must specify the key for the file, but don’t specify an extension,
     * it will be added automatically based on the format you specified.
     * You can also specify “subdirectories” in the path part.
     */
    storagePath(path: string): AnimateOptions {
        this.put("storage_path", path);

        return this;
    }

    /**
     * You can override the default bucket you configured with storage_bucket=<bucket name>.
     */
    storageBucket(bucket: string): AnimateOptions {
        this.put("storage_bucket", bucket);

        return this;
    }

    /**
     * Storage class allows you to specify the object storage class.
     */
    storageClass(storageClass: string): AnimateOptions {
        this.put("storage_class", storageClass);

        return this;
    }

    storageACL(acl: string): AnimateOptions {
        this.put("storage_acl", acl);

        return this;
    }

    /**
     * Sets animation duration.
     */
    duration(duration: number): AnimateOptions {
        this.put("duration", duration.toString());

        return this;
    }

    /**
     * Sets animation duration.
     */
    scenario(scenario: string): AnimateOptions {
        this.put("scenario", scenario);

        return this;
    }

    scrollDelay(delay: number): AnimateOptions {
        this.put("scroll_delay", delay.toString());

        return this;
    }

    scrollDuration(duration: number): AnimateOptions {
        this.put("scroll_duration", duration.toString());

        return this;
    }

    scrollStartImmediately(startImmediately: boolean): AnimateOptions {
        this.put(
            "scroll_start_immediately",
            startImmediately ? "true" : "false"
        );
        return this;
    }

    scrollBack(scrollBack: boolean): AnimateOptions {
        this.put("scroll_back", scrollBack ? "true" : "false");
        return this;
    }

    toQuery(): URLSearchParams {
        return new URLSearchParams(this.query.toString());
    }
}
