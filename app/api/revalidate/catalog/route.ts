import { revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

type CurrentUserResponse = {
    roles?: string[]
}

const getBackendBaseUrl = () => {
    const apiUrl =
        process.env["services__apiservice__https__0"] ||
        process.env["services__apiservice__http__0"]

    if (apiUrl) {
        return apiUrl
    }

    return process.env.NEXT_PUBLIC_API_URL
}

const API_BASE_URL = getBackendBaseUrl()

const isCatalogAdmin = async (request: NextRequest) => {
    const authorization = request.headers.get("authorization")

    if (!authorization) {
        return false
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: "GET",
            headers: {
                Authorization: authorization,
            },
            cache: "no-store",
        })

        if (!response.ok) {
            return false
        }

        const payload = (await response.json()) as CurrentUserResponse
        return (payload.roles || []).some((role) =>
            ["Admin", "Staff"].includes(role),
        )
    } catch {
        return false
    }
}

export async function POST(request: NextRequest) {
    const canRevalidate = await isCatalogAdmin(request)

    if (!canRevalidate) {
        return NextResponse.json(
            {
                success: false,
                message: "Unauthorized",
            },
            { status: 401 },
        )
    }

    revalidatePath("/")
    revalidatePath("/collection")
    revalidatePath("/product/[slug]", "page")
    revalidatePath("/collection/[slug]", "page")
    revalidatePath("/sale/[slug]", "page")

    return NextResponse.json({
        success: true,
        message: "Catalog cache invalidated",
    })
}
