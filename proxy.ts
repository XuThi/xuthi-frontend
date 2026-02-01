import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
	// For now, just pass through - implement your checkout logic here
	return NextResponse.next();
}

export const config = {
	matcher: ["/checkout/:path*"],
};
