import { NextResponse } from "next/server";

const getApiBaseUrl = () => {
    const apiUrl =
        process.env["services__apiservice__https__0"] ||
        process.env["services__apiservice__http__0"]
    if (apiUrl) return apiUrl
    return process.env.NEXT_PUBLIC_API_URL
}

const API_BASE_URL = getApiBaseUrl();

export async function GET() {
	let backendStatus = "unknown";
	let backendTimestamp = "";
	let latencyMs = 0;

	try {
		const start = Date.now();
        // Use an AbortController to cleanly prevent hanging promises in Next.js
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
		const res = await fetch(`${API_BASE_URL}/api/health`, {
			cache: "no-store",
			signal: controller.signal,
		});
        clearTimeout(timeoutId);
        
		latencyMs = Date.now() - start;

		if (res.ok) {
			const data = await res.json();
			backendStatus = data.status ?? "ok";
			backendTimestamp = data.timestamp ?? "";
		} else {
			backendStatus = `error (${res.status})`;
		}
	} catch (error) {
		backendStatus = `unreachable: ${error instanceof Error ? error.message : "unknown"}`;
	}

	return NextResponse.json(
		{
			frontend: "ok",
			backend: backendStatus,
			backendTimestamp,
			latencyMs,
			checkedAt: new Date().toISOString(),
		},
		{
			status: backendStatus === "ok" ? 200 : 503,
		}
	);
}
