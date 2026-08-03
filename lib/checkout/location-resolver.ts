// Pure TypeScript Location Resolver Adapter & Diacritic Normalizer
// Strips Vietnamese diacritics/prefixes and provides administrative location resolution & GHN code matching.

export interface Province {
    code: string
    name: string
    name_with_type: string
}

export interface District {
    code: string
    name: string
    name_with_type: string
}

export interface LocationMatchInput {
    city: string
    district?: string
    ward?: string
}

export interface LocationMatchResult {
    matchedProvince?: Province
    matchedDistrict?: District
    matchedWard?: District
    ghnProvinceId?: number
    ghnDistrictId?: number
    ghnWardCode?: string
    isMatched: boolean
}

/**
 * Normalizes Vietnamese administrative location names by removing diacritics,
 * stripping common administrative prefixes ("Tỉnh", "Thành phố", "TP.", "Quận", "Huyện", "Thị xã", "Phường", "Xã", "Thị trấn"),
 * converting to lower case, and collapsing whitespace.
 */
export function normalizeLocationName(name: string): string {
    if (!name) return ""
    return name
        .toLowerCase()
        .replace(/đ/g, "d")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(
            /^(tinh|thanh pho|tp\.?|quan|huyen|thi xa|phuong|xa|thi tran)\s+/i,
            "",
        )
        .trim()
}

export type Fetcher = (
    input: RequestInfo | URL,
    init?: RequestInit,
) => Promise<Response>

/**
 * Fetches provinces list using 2-level or 3-level API endpoints.
 */
export async function fetchProvinces(
    useThreeLevel: boolean,
    fetchFn: Fetcher = fetch,
): Promise<Province[]> {
    const endpoint = useThreeLevel
        ? "/api/locations/three-level/provinces"
        : "/api/locations/provinces"
    const response = await fetchFn(endpoint)
    if (!response.ok) {
        throw new Error(`Failed to fetch provinces: ${response.statusText}`)
    }
    const result = await response.json()
    return result.data || []
}

/**
 * Fetches level 2 locations (districts in 3-level mode, wards in 2-level mode) for a province.
 */
export async function fetchDistricts(
    useThreeLevel: boolean,
    provinceCode: string,
    fetchFn: Fetcher = fetch,
): Promise<District[]> {
    if (!provinceCode) return []
    const endpoint = useThreeLevel
        ? `/api/locations/three-level/districts?provinceCode=${encodeURIComponent(provinceCode)}`
        : `/api/locations/wards?provinceCode=${encodeURIComponent(provinceCode)}`
    const response = await fetchFn(endpoint)
    if (!response.ok) {
        throw new Error(`Failed to fetch districts: ${response.statusText}`)
    }
    const result = await response.json()
    return result.data || []
}

/**
 * Fetches level 3 locations (wards in 3-level mode) for a province and district.
 */
export async function fetchWards(
    provinceCode: string,
    districtCode: string,
    fetchFn: Fetcher = fetch,
): Promise<District[]> {
    if (!provinceCode || !districtCode) return []
    const endpoint = `/api/locations/three-level/wards?provinceCode=${encodeURIComponent(provinceCode)}&districtCode=${encodeURIComponent(districtCode)}`
    const response = await fetchFn(endpoint)
    if (!response.ok) {
        throw new Error(`Failed to fetch wards: ${response.statusText}`)
    }
    const result = await response.json()
    return result.data || []
}

/**
 * Finds a matching province from a list of provinces based on normalized name matching.
 */
export function findMatchingProvince(
    provinces: Province[],
    name: string,
): Province | undefined {
    if (!name) return undefined
    const normalizedInput = normalizeLocationName(name)
    return provinces.find(
        (p) =>
            normalizeLocationName(p.name) === normalizedInput ||
            normalizeLocationName(p.name_with_type) === normalizedInput,
    )
}

/**
 * Finds a matching district from a list of districts based on normalized name matching.
 */
export function findMatchingDistrict(
    districts: District[],
    name: string,
): District | undefined {
    if (!name) return undefined
    const normalizedInput = normalizeLocationName(name)
    return districts.find(
        (d) =>
            normalizeLocationName(d.name) === normalizedInput ||
            normalizeLocationName(d.name_with_type) === normalizedInput,
    )
}

/**
 * Finds a matching ward from a list of wards based on normalized name matching.
 */
export function findMatchingWard(
    wards: District[],
    name: string,
): District | undefined {
    if (!name) return undefined
    const normalizedInput = normalizeLocationName(name)
    return wards.find(
        (w) =>
            normalizeLocationName(w.name) === normalizedInput ||
            normalizeLocationName(w.name_with_type) === normalizedInput,
    )
}

/**
 * Maps customer address strings (city, district, ward) to standard GHN location records and location codes.
 */
export function matchGhnLocation(
    input: LocationMatchInput,
    provinces: Province[],
    districts: District[],
    wards: District[] = [],
): LocationMatchResult {
    const matchedProvince = findMatchingProvince(provinces, input.city)
    const matchedDistrict = input.district
        ? findMatchingDistrict(districts, input.district)
        : undefined
    const matchedWard = input.ward
        ? findMatchingWard(wards, input.ward)
        : undefined

    const ghnProvinceId = matchedProvince?.code
        ? Number.parseInt(matchedProvince.code, 10)
        : undefined
    const ghnDistrictId = matchedDistrict?.code
        ? Number.parseInt(matchedDistrict.code, 10)
        : undefined
    const ghnWardCode = matchedWard?.code || undefined

    const isMatched =
        !!matchedProvince &&
        (!input.district || !!matchedDistrict) &&
        (!input.ward || !!matchedWard)

    return {
        matchedProvince,
        matchedDistrict,
        matchedWard,
        ghnProvinceId: Number.isNaN(ghnProvinceId) ? undefined : ghnProvinceId,
        ghnDistrictId: Number.isNaN(ghnDistrictId) ? undefined : ghnDistrictId,
        ghnWardCode,
        isMatched,
    }
}
