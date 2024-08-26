
class APIError extends Error {
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

export default APIError;