"use client"

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    useTransition,
    type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import {
    CURRENCY_COOKIE_NAME,
    DEFAULT_CURRENCY,
    getCurrencyDefinition,
    getCurrencyRatesSnapshot,
    formatDisplayMoney,
    parseSupportedCurrency,
    SUPPORTED_CURRENCIES,
    updateCurrencyRates,
    type SupportedCurrency,
} from "@/lib/currency"
import {
    fetchLiveCurrencyRates,
    isCurrencyRateCacheFresh,
    readCachedCurrencyRates,
    writeCachedCurrencyRates,
} from "@/lib/currency-rates"

type CurrencyContextValue = {
    currency: SupportedCurrency
    locale: string
    options: Array<{ code: SupportedCurrency; label: string }>
    isUpdating: boolean
    setCurrency: (nextCurrency: SupportedCurrency) => void
    formatFromVnd: (amountInVnd: string | number | bigint) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)
const FX_REFRESH_INTERVAL_MS = 30 * 60 * 1000

function readCurrencyFromCookie(): SupportedCurrency | null {
    if (typeof document === "undefined") return null

    const cookiePattern = new RegExp(`(?:^|; )${CURRENCY_COOKIE_NAME}=([^;]+)`)
    const cookieMatch = document.cookie.match(cookiePattern)
    if (!cookieMatch?.[1]) return null

    return parseSupportedCurrency(decodeURIComponent(cookieMatch[1]))
}

export function CurrencyProvider({
    children,
    initialCurrency,
}: {
    children: ReactNode
    initialCurrency?: SupportedCurrency
}) {
    const router = useRouter()
    const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
        const cookieCurrency = readCurrencyFromCookie()
        if (cookieCurrency) return cookieCurrency

        return parseSupportedCurrency(initialCurrency ?? DEFAULT_CURRENCY)
    })
    const [isUpdating, startTransition] = useTransition()

    useEffect(() => {
        const cookieCurrency = readCurrencyFromCookie()
        if (cookieCurrency && cookieCurrency !== currency) {
            setCurrencyState(cookieCurrency)
        }
    }, [currency])

    useEffect(() => {
        if (typeof window === "undefined") return

        const cached = readCachedCurrencyRates()
        if (cached?.rates) {
            updateCurrencyRates(cached.rates)
        }

        let disposed = false

        const refreshRates = async () => {
            const latest = await fetchLiveCurrencyRates()
            if (!latest) {
                if (cached && isCurrencyRateCacheFresh(cached)) {
                    updateCurrencyRates(cached.rates)
                }
                return
            }

            if (disposed) return

            updateCurrencyRates(latest)
            writeCachedCurrencyRates(getCurrencyRatesSnapshot())
        }

        void refreshRates()

        const intervalId = window.setInterval(() => {
            void refreshRates()
        }, FX_REFRESH_INTERVAL_MS)

        const handleWindowFocus = () => {
            void refreshRates()
        }

        window.addEventListener("focus", handleWindowFocus)

        return () => {
            disposed = true
            window.clearInterval(intervalId)
            window.removeEventListener("focus", handleWindowFocus)
        }
    }, [])

    const setCurrency = useCallback(
        (nextCurrency: SupportedCurrency) => {
            const normalized = parseSupportedCurrency(nextCurrency)
            if (normalized === currency) return

            setCurrencyState(normalized)
            if (typeof document !== "undefined") {
                document.cookie = `${CURRENCY_COOKIE_NAME}=${normalized}; path=/; max-age=31536000; samesite=lax`
            }

            startTransition(() => {
                router.refresh()
            })
        },
        [currency, router],
    )

    const locale = getCurrencyDefinition(currency).locale

    const options = useMemo(
        () =>
            SUPPORTED_CURRENCIES.map((code) => ({
                code,
                label: getCurrencyDefinition(code).label,
            })),
        [],
    )

    const formatFromVnd = useCallback(
        (amountInVnd: string | number | bigint) =>
            formatDisplayMoney({ amountInVnd, currency }),
        [currency],
    )

    const contextValue = useMemo(
        () => ({
            currency,
            locale,
            options,
            isUpdating,
            setCurrency,
            formatFromVnd,
        }),
        [currency, formatFromVnd, isUpdating, locale, options, setCurrency],
    )

    return (
        <CurrencyContext.Provider value={contextValue}>
            {children}
        </CurrencyContext.Provider>
    )
}

export function useCurrency() {
    const context = useContext(CurrencyContext)
    if (!context) {
        throw new Error("useCurrency must be used within CurrencyProvider")
    }
    return context
}
