import type { SupportedCurrency } from "@/lib/currency"
import { SUPPORTED_CURRENCIES } from "@/lib/currency"

type CurrencyRateCache = {
    timestamp: number
    rates: Partial<Record<SupportedCurrency, number>>
}

const FX_STORAGE_KEY = "xuthi_fx_rates_v1"
const FX_CACHE_TTL_MS = 6 * 60 * 60 * 1000

function hasWindow() {
    return typeof window !== "undefined"
}

export function readCachedCurrencyRates(): CurrencyRateCache | null {
    if (!hasWindow()) return null

    try {
        const raw = window.localStorage.getItem(FX_STORAGE_KEY)
        if (!raw) return null

        const parsed = JSON.parse(raw) as CurrencyRateCache
        if (!parsed?.timestamp || !parsed?.rates) return null

        return parsed
    } catch {
        return null
    }
}

export function writeCachedCurrencyRates(rates: Partial<Record<SupportedCurrency, number>>) {
    if (!hasWindow()) return

    const payload: CurrencyRateCache = {
        timestamp: Date.now(),
        rates,
    }

    try {
        window.localStorage.setItem(FX_STORAGE_KEY, JSON.stringify(payload))
    } catch {
        // Ignore storage write failures
    }
}

export function isCurrencyRateCacheFresh(cache: CurrencyRateCache): boolean {
    return Date.now() - cache.timestamp < FX_CACHE_TTL_MS
}

export async function fetchLiveCurrencyRates(
    timeoutMs = 4500,
): Promise<Partial<Record<SupportedCurrency, number>> | null> {
    return null;

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const response = await fetch("https://open.er-api.com/v6/latest/VND", {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
        })

        if (!response.ok) {
            return null
        }

        const payload = (await response.json()) as {
            result?: string
            rates?: Record<string, number>
        }

        if (!payload?.rates) {
            return null
        }

        const resolvedRates: Partial<Record<SupportedCurrency, number>> = {
            VND: 1,
        }

        for (const currency of SUPPORTED_CURRENCIES) {
            if (currency === "VND") continue

            const perVnd = payload.rates![currency]
            if (!perVnd || !Number.isFinite(perVnd) || perVnd <= 0) continue

            resolvedRates[currency] = Number((1 / perVnd).toFixed(2))
        }

        return resolvedRates
    } catch {
        return null
    } finally {
        clearTimeout(timeoutId)
    }
}
