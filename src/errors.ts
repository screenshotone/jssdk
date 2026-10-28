
export default class APIError extends Error {
    public readonly httpStatusCode?: number; 
    public readonly errorCode?: string;
    public readonly errorMessage?: string;
    public readonly documentationUrl?: string;

    constructor(message: string, httpStatusCode?: number, errorCode?: string, errorMessage?: string, documentationUrl?: string) {
        super(message);

        this.httpStatusCode = httpStatusCode;
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.documentationUrl = documentationUrl;
    }
}

/**
 * Where the connection failed: before the API responded ("request") or while
 * the response was downloading ("response").
 */
export type ConnectionErrorPhase = "request" | "response";

/**
 * The connection to the API failed, for example with ECONNRESET. The message
 * explains what happened and what usually causes it.
 */
export class ConnectionError extends Error {
    /** The system error code, for example "ECONNRESET". */
    public readonly code: string;
    /** Whether the connection failed before the API responded or while the response was downloading. */
    public readonly phase: ConnectionErrorPhase;
    /** Milliseconds from the start of the last attempt to the failure. */
    public readonly lastElapsedMs: number;
    /**
     * Milliseconds from the start of the first attempt to the failure, waits
     * between retries included. Equals lastElapsedMs when there was one attempt.
     */
    public readonly totalElapsedMs: number;
    /** How many times the request was sent, retries included. */
    public readonly attempts: number;
    /** The HTTP status of the response that was downloading, when the phase is "response". */
    public readonly httpStatusCode?: number;
    /** The underlying error message. */
    public readonly reason?: string;

    constructor(
        message: string,
        details: {
            code: string;
            phase: ConnectionErrorPhase;
            lastElapsedMs: number;
            totalElapsedMs: number;
            attempts: number;
            httpStatusCode?: number;
            reason?: string;
        }
    ) {
        super(message);

        this.name = "ConnectionError";
        this.code = details.code;
        this.phase = details.phase;
        this.lastElapsedMs = details.lastElapsedMs;
        this.totalElapsedMs = details.totalElapsedMs;
        this.attempts = details.attempts;
        this.httpStatusCode = details.httpStatusCode;
        this.reason = details.reason;
    }
}