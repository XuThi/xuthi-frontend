const getBackendBaseUrl = () => {
    const apiUrl =
        process.env["services__apiservice__https__0"] ||
        process.env["services__apiservice__http__0"]
    if (apiUrl) return apiUrl

    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5331"
}

const BACKEND_BASE_URL = getBackendBaseUrl()

async function forwardUnsubscribe(request: Request): Promise<Response> {
    const incomingUrl = new URL(request.url)
    const targetUrl = new URL("/api/marketing/unsubscribe", BACKEND_BASE_URL)
    targetUrl.search = incomingUrl.search

    const method = request.method.toUpperCase()
    const init: RequestInit & { duplex?: "half" } = {
        method,
        redirect: "manual",
    }

    if (method !== "GET" && method !== "HEAD") {
        init.body = request.body
        init.duplex = "half"

        const contentType = request.headers.get("content-type")
        if (contentType) {
            init.headers = {
                "content-type": contentType,
            }
        }
    }

    const upstreamResponse = await fetch(targetUrl, init)

    const responseHeaders = new Headers(upstreamResponse.headers)
    responseHeaders.delete("content-encoding")
    responseHeaders.delete("content-length")

    return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
    })
}

export const GET = forwardUnsubscribe
export const POST = forwardUnsubscribe
