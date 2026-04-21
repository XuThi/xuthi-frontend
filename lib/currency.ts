import { formatMoney } from "@/lib/money"

export const CURRENCY_COOKIE_NAME = "xuthi_currency"

export const SUPPORTED_CURRENCIES = ["VND", "USD", "EUR"] as const

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

type CurrencyDefinition = {
    code: SupportedCurrency
    locale: string
    label: string
    vndPerUnit: number
}

const CURRENCY_DEFINITIONS: Record<SupportedCurrency, CurrencyDefinition> = {
    VND: {
        code: "VND",
        locale: "vi-VN",
        label: "VND - Viet Nam Dong",
        vndPerUnit: 1,
    },
    USD: {
        code: "USD",
        locale: "en-US",
        label: "USD - US Dollar",
        vndPerUnit: 26000,
    },
    EUR: {
        code: "EUR",
        locale: "de-DE",
        label: "EUR - Euro",
        vndPerUnit: 28500,
    },
}

const DEFAULT_VND_PER_UNIT: Record<SupportedCurrency, number> = {
    VND: CURRENCY_DEFINITIONS.VND.vndPerUnit,
    USD: CURRENCY_DEFINITIONS.USD.vndPerUnit,
    EUR: CURRENCY_DEFINITIONS.EUR.vndPerUnit,
}

let runtimeVndPerUnit: Record<SupportedCurrency, number> = {
    ...DEFAULT_VND_PER_UNIT,
}

export const DEFAULT_CURRENCY: SupportedCurrency = "VND"

export function parseSupportedCurrency(
    value: string | null | undefined,
): SupportedCurrency {
    if (!value) return DEFAULT_CURRENCY

    const normalized = value.toUpperCase()
    return SUPPORTED_CURRENCIES.includes(normalized as SupportedCurrency)
        ? (normalized as SupportedCurrency)
        : DEFAULT_CURRENCY
}

export function getCurrencyDefinition(
    currency: SupportedCurrency,
): CurrencyDefinition {
    return {
        ...CURRENCY_DEFINITIONS[currency],
        vndPerUnit: runtimeVndPerUnit[currency],
    }
}

export function updateCurrencyRates(
    nextRates: Partial<Record<SupportedCurrency, number>>,
) {
    const updates = Object.entries(nextRates) as Array<
        [SupportedCurrency, number | undefined]
    >

    for (const [currency, rate] of updates) {
        if (!rate || !Number.isFinite(rate) || rate <= 0) continue
        runtimeVndPerUnit[currency] = rate
    }

    runtimeVndPerUnit.VND = 1
}

export function getCurrencyRatesSnapshot(): Record<SupportedCurrency, number> {
    return { ...runtimeVndPerUnit }
}

export function resetCurrencyRatesToDefault() {
    runtimeVndPerUnit = { ...DEFAULT_VND_PER_UNIT }
}

function toNumberAmount(amount: string | number | bigint): number {
    if (typeof amount === "bigint") return Number(amount)
    if (typeof amount === "string") {
        const parsed = Number(amount)
        return Number.isFinite(parsed) ? parsed : 0
    }
    return Number.isFinite(amount) ? amount : 0
}

function convertFromVndToMinorUnits(
    amountInVnd: string | number | bigint,
    currency: SupportedCurrency,
): bigint {
    const baseAmount = toNumberAmount(amountInVnd)
    const definition = getCurrencyDefinition(currency)

    if (currency === "VND") {
        return BigInt(Math.round(baseAmount))
    }

    const majorAmount = baseAmount / definition.vndPerUnit
    const minorAmount = majorAmount * 100
    return BigInt(Math.round(minorAmount))
}

export function formatDisplayMoney({
    amountInVnd,
    currency,
}: {
    amountInVnd: string | number | bigint
    currency: SupportedCurrency
}): string {
    const definition = getCurrencyDefinition(currency)
    const convertedMinor = convertFromVndToMinorUnits(amountInVnd, currency)

    return formatMoney({
        amount: convertedMinor,
        currency: definition.code,
        locale: definition.locale,
    })
}

export function formatDisplayMoneyRange({
    minAmountInVnd,
    maxAmountInVnd,
    currency,
}: {
    minAmountInVnd: string | number | bigint
    maxAmountInVnd: string | number | bigint
    currency: SupportedCurrency
}): string {
    const min = formatDisplayMoney({ amountInVnd: minAmountInVnd, currency })
    const max = formatDisplayMoney({ amountInVnd: maxAmountInVnd, currency })

    if (min === max) return min
    return `${min} - ${max}`
}
