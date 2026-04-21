import "server-only"

import { cookies } from "next/headers"
import {
    CURRENCY_COOKIE_NAME,
    parseSupportedCurrency,
    type SupportedCurrency,
} from "@/lib/currency"

export async function getServerCurrencyPreference(): Promise<SupportedCurrency> {
    const cookieStore = await cookies()
    const cookieValue = cookieStore.get(CURRENCY_COOKIE_NAME)?.value
    return parseSupportedCurrency(cookieValue)
}
