const getBackendBaseUrl = () => {
    const apiUrl =
        process.env["services__apiservice__https__0"] ||
        process.env["services__apiservice__http__0"]
    if (apiUrl) return apiUrl

    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5331"
}

const BACKEND_BASE_URL = getBackendBaseUrl()

const HOP_BY_HOP_HEADERS = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
    "accept-encoding",
])

const shouldForwardHeader = (name: string) => {
    const lower = name.toLowerCase()
    if (HOP_BY_HOP_HEADERS.has(lower)) return false
    if (lower.startsWith("sec-")) return false
    if (lower === "origin" || lower === "referer") return false
    return true
}

async function proxyRequest(
    request: Request,
    context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
    const resolvedParams = await context.params
    const path = resolvedParams.path?.join("/") ?? ""
    const incomingUrl = new URL(request.url)
    const targetUrl = new URL(`/${path}`, BACKEND_BASE_URL)
    targetUrl.search = incomingUrl.search

    const headers = new Headers()
    for (const [name, value] of request.headers.entries()) {
        if (shouldForwardHeader(name)) {
            headers.set(name, value)
        }
    }

    const method = request.method.toUpperCase()
    const hasBody = method !== "GET" && method !== "HEAD"
    const init: RequestInit & { duplex?: "half" } = {
        method,
        headers,
        redirect: "manual",
    }

    if (hasBody) {
        init.body = request.body
        init.duplex = "half"
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

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const PATCH = proxyRequest
export const DELETE = proxyRequest
