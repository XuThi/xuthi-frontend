export const CURRENCY = "USD" as const;
export const LOCALE = "en-US" as const;
export const APIEndpoint = typeof window === "undefined" ? process.env["services__api__http__0"] : "/api";