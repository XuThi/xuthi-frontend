const getBackendBaseUrl = () => {
    const apiUrl =
        process.env["services__apiservice__https__0"] ||
        process.env["services__apiservice__http__0"]
    if (apiUrl) return apiUrl

    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5331"
}

const BACKEND_BASE_URL = getBackendBaseUrl()

async function proxyRequest(
    request: Request,
    context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
    const resolvedParams = await context.params
    const path = resolvedParams.path?.join("/") ?? ""
    const incomingUrl = new URL(request.url)
    const targetUrl = new URL(`/${path}`, BACKEND_BASE_URL)
    targetUrl.search = incomingUrl.search

    const headers = new Headers(request.headers)
    headers.delete("host")
    headers.delete("connection")

    const method = request.method.toUpperCase()
    const hasBody = method !== "GET" && method !== "HEAD"
    const body = hasBody ? await request.arrayBuffer() : undefined

    const upstreamResponse = await fetch(targetUrl, {
        method,
        headers,
        body: hasBody ? body : undefined,
        redirect: "manual",
    })

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
