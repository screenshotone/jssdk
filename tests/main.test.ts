import APIError from "../src/errors";
import { TakeOptions, Client, AnimateOptions } from "../src/main";
import fetch from "cross-fetch";

jest.mock("cross-fetch");

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("testing client", () => {
    const client = new Client("RcLsdM6uhIN6gw", "MW2vfkkgLTzGGw");

    test("example.com with block ads URL generated and signed correctly", async () => {
        const options = TakeOptions.url("https://example.com").blockAds(true);

        expect(await client.generateSignedTakeURL(options)).toBe(
            "https://api.screenshotone.com/take?url=https%3A%2F%2Fexample.com&block_ads=true&access_key=RcLsdM6uhIN6gw&signature=3cf1edeafc139f41191928c1c5b8b04fe1d5722560244ccdd76a55d69120bbac"
        );
    });

    test("example.com with block ads, full page and user agent URL generated correctly", async () => {
        const options = TakeOptions.url("https://example.com")
            .blockAds(true)
            .fullPage(true)
            .userAgent(
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36"
            );

        expect(await client.generateTakeURL(options)).toBe(
            "https://api.screenshotone.com/take?url=https%3A%2F%2Fexample.com&block_ads=true&full_page=true&user_agent=Mozilla%2F5.0+%28X11%3B+Linux+x86_64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F51.0.2704.103+Safari%2F537.36&access_key=RcLsdM6uhIN6gw"
        );
    });

    test("example.com with block ads, full page and user agent URL generated and signed correctly", async () => {
        const options = TakeOptions.url("https://example.com")
            .blockAds(true)
            .fullPage(true)
            .userAgent(
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36"
            );

        expect(await client.generateSignedTakeURL(options)).toBe(
            "https://api.screenshotone.com/take?url=https%3A%2F%2Fexample.com&block_ads=true&full_page=true&user_agent=Mozilla%2F5.0+%28X11%3B+Linux+x86_64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F51.0.2704.103+Safari%2F537.36&access_key=RcLsdM6uhIN6gw&signature=ea217db7d746c8bf9b710257d62ef09670b003137d239ee4c81eae3645b4a901"
        );
    });

    test("setting an option twice doesn`t convert it to an array parameter (TakeOptions)", () => {
        const options = TakeOptions.url("https://example.com")
            .blockAds(true)
            .blockAds(true);

        expect(options.toQuery().getAll("block_ads").length).toBe(1);
    });

    test("setting an option twice doesn`t convert it to an array parameter (AnimateOptions)", () => {
        const options = AnimateOptions.url("https://example.com")
            .blockAds(true)
            .blockAds(true);

        expect(options.toQuery().getAll("block_ads").length).toBe(1);
    });

    test("serializes the latest take options", () => {
        const options = TakeOptions.url("https://example.com")
            .selectorAlgorithm("clip")
            .selectorScrollIntoView(false)
            .includeShadowDom(true)
            .attachmentName("capture")
            .externalIdentifier("capture123")
            .click("#accept")
            .hover(".menu")
            .errorOnClickSelectorNotFound(false)
            .errorOnHoverSelectorNotFound(true)
            .fullPageScrollBy(400)
            .fullPageSlices(true)
            .fullPageSliceHeight(3000)
            .fullPageSliceOverlapHeight(500)
            .serversRegion("us-east")
            .blockSocials(true)
            .proxy("http://proxy.example.com")
            .proxyBypassHosts(
                "cdn.example.com",
                "cdn.*.screenshotone.com"
            )
            .pdfLandscape(true)
            .pdfPaperFormat("a4")
            .pdfMargin("10mm")
            .pdfMarginTop("20mm")
            .pdfMarginRight("15mm")
            .pdfMarginBottom("20mm")
            .pdfMarginLeft("15mm")
            .waitForSelectorAlgorithm("at_least_by_count")
            .metadataIcon(true)
            .metadataContentFormat("markdown")
            .webhookErrors(true)
            .failIfContentContains("Error", "Blocked")
            .failIfContentMissing("Ready", "Loaded")
            .failIfRequestFailed(
                "*api.example.com*",
                "*cdn.example.com*"
            );

        const expected: Record<string, string[]> = {
            selector_algorithm: ["clip"],
            selector_scroll_into_view: ["false"],
            include_shadow_dom: ["true"],
            attachment_name: ["capture"],
            external_identifier: ["capture123"],
            click: ["#accept"],
            hover: [".menu"],
            error_on_click_selector_not_found: ["false"],
            error_on_hover_selector_not_found: ["true"],
            full_page_scroll_by: ["400"],
            full_page_slices: ["true"],
            full_page_slice_height: ["3000"],
            full_page_slice_overlap_height: ["500"],
            servers_region: ["us-east"],
            block_socials: ["true"],
            proxy: ["http://proxy.example.com"],
            proxy_bypass_hosts: [
                "cdn.example.com",
                "cdn.*.screenshotone.com",
            ],
            pdf_landscape: ["true"],
            pdf_paper_format: ["a4"],
            pdf_margin: ["10mm"],
            pdf_margin_top: ["20mm"],
            pdf_margin_right: ["15mm"],
            pdf_margin_bottom: ["20mm"],
            pdf_margin_left: ["15mm"],
            wait_for_selector_algorithm: ["at_least_by_count"],
            metadata_icon: ["true"],
            metadata_content_format: ["markdown"],
            webhook_errors: ["true"],
            fail_if_content_contains: ["Error", "Blocked"],
            fail_if_content_missing: ["Ready", "Loaded"],
            fail_if_request_failed: [
                "*api.example.com*",
                "*cdn.example.com*",
            ],
        };
        const query = options.toQuery();

        for (const [key, values] of Object.entries(expected)) {
            expect(query.getAll(key)).toEqual(values);
        }
    });

    test("returning an API error when the response is not successful", async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: "Bad Request",
            json: () =>
                Promise.resolve({
                    error_code: "name_not_resolved",
                    error_message:
                        "Usually, the error happens when the domain name of the requested URL is not resolved. If you are trying to take a screenshot of the new site, please, wait a bit until the DNS records are refreshed.",
                    documentation_url:
                        "https://screenshotone.com/docs/errors/",
                }),
        } as any);

        const options = AnimateOptions.url("https://example.com");
        await expect(client.animate(options)).rejects.toThrow(APIError);
    });
});
