export const CURRENCY = "VND" as const
export const LOCALE = "vi-VN" as const
export const APIEndpoint =
    typeof window === "undefined"
        ? process.env["services__api__http__0"]
        : "/api"
export const BFF_API_ENDPOINT = "/api/bff"
