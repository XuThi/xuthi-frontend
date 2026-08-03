import { describe, expect, it, vi } from "vitest"
import {
    fetchDistricts,
    fetchProvinces,
    fetchWards,
    findMatchingDistrict,
    findMatchingProvince,
    findMatchingWard,
    matchGhnLocation,
    normalizeLocationName,
    type District,
    type Province,
} from "../location-resolver"

describe("LocationResolver - normalizeLocationName", () => {
    it("strips Vietnamese diacritics correctly", () => {
        expect(normalizeLocationName("Thành phố Hồ Chí Minh")).toBe(
            "ho chi minh",
        )
        expect(normalizeLocationName("Đà Nẵng")).toBe("da nang")
        expect(normalizeLocationName("Bình Dương")).toBe("binh duong")
    })

    it("strips administrative prefix titles", () => {
        expect(normalizeLocationName("Tỉnh Bình Dương")).toBe("binh duong")
        expect(normalizeLocationName("Thành phố Hà Nội")).toBe("ha noi")
        expect(normalizeLocationName("TP. Hồ Chí Minh")).toBe("ho chi minh")
        expect(normalizeLocationName("TP Hải Phòng")).toBe("hai phong")
        expect(normalizeLocationName("Quận 1")).toBe("1")
        expect(normalizeLocationName("Huyện Củ Chi")).toBe("cu chi")
        expect(normalizeLocationName("Thị xã Tân Uyên")).toBe("tan uyen")
        expect(normalizeLocationName("Phường Bến Nghé")).toBe("ben nghe")
        expect(normalizeLocationName("Xã Tân Thông Hội")).toBe(
            "tan thong hoi",
        )
        expect(normalizeLocationName("Thị trấn Củ Chi")).toBe("cu chi")
    })

    it("collapses whitespace and normalizes case", () => {
        expect(
            normalizeLocationName("   THÀNH   PHỐ    CẦN  THƠ   "),
        ).toBe("can tho")
    })

    it("handles empty or falsy inputs gracefully", () => {
        expect(normalizeLocationName("")).toBe("")
    })
})

describe("LocationResolver - API Fetchers", () => {
    const mockProvinces: Province[] = [
        { code: "79", name: "Hồ Chí Minh", name_with_type: "Thành phố Hồ Chí Minh" },
        { code: "01", name: "Hà Nội", name_with_type: "Thành phố Hà Nội" },
    ]

    const mockDistricts: District[] = [
        { code: "760", name: "Quận 1", name_with_type: "Quận 1" },
        { code: "769", name: "Thủ Đức", name_with_type: "Thành phố Thủ Đức" },
    ]

    const mockWards: District[] = [
        { code: "26734", name: "Bến Nghé", name_with_type: "Phường Bến Nghé" },
    ]

    it("fetchProvinces calls 2-level vs 3-level endpoints", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: mockProvinces }),
        } as Response)

        const twoLevel = await fetchProvinces(false, mockFetch)
        expect(mockFetch).toHaveBeenCalledWith("/api/locations/provinces")
        expect(twoLevel).toEqual(mockProvinces)

        const threeLevel = await fetchProvinces(true, mockFetch)
        expect(mockFetch).toHaveBeenCalledWith(
            "/api/locations/three-level/provinces",
        )
        expect(threeLevel).toEqual(mockProvinces)
    })

    it("fetchDistricts calls 2-level vs 3-level endpoints with encoded query params", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: mockDistricts }),
        } as Response)

        const twoLevel = await fetchDistricts(false, "79", mockFetch)
        expect(mockFetch).toHaveBeenCalledWith(
            "/api/locations/wards?provinceCode=79",
        )
        expect(twoLevel).toEqual(mockDistricts)

        const threeLevel = await fetchDistricts(true, "79", mockFetch)
        expect(mockFetch).toHaveBeenCalledWith(
            "/api/locations/three-level/districts?provinceCode=79",
        )
        expect(threeLevel).toEqual(mockDistricts)
    })

    it("fetchWards calls 3-level ward endpoint", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: mockWards }),
        } as Response)

        const wards = await fetchWards("79", "760", mockFetch)
        expect(mockFetch).toHaveBeenCalledWith(
            "/api/locations/three-level/wards?provinceCode=79&districtCode=760",
        )
        expect(wards).toEqual(mockWards)
    })

    it("throws error when API response is not ok", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            statusText: "Internal Server Error",
        } as Response)

        await expect(fetchProvinces(false, mockFetch)).rejects.toThrow(
            "Failed to fetch provinces: Internal Server Error",
        )
    })

    it("returns empty array if required params are missing", async () => {
        const mockFetch = vi.fn()
        expect(await fetchDistricts(true, "", mockFetch)).toEqual([])
        expect(await fetchWards("", "760", mockFetch)).toEqual([])
        expect(mockFetch).not.toHaveBeenCalled()
    })
})

describe("LocationResolver - Location Matching & GHN Code Mapper", () => {
    const provinces: Province[] = [
        { code: "79", name: "Hồ Chí Minh", name_with_type: "Thành phố Hồ Chí Minh" },
        { code: "74", name: "Bình Dương", name_with_type: "Tỉnh Bình Dương" },
    ]

    const districts: District[] = [
        { code: "760", name: "Quận 1", name_with_type: "Quận 1" },
        { code: "783", name: "Củ Chi", name_with_type: "Huyện Củ Chi" },
    ]

    const wards: District[] = [
        { code: "26734", name: "Bến Nghé", name_with_type: "Phường Bến Nghé" },
        { code: "26737", name: "Bến Thành", name_with_type: "Phường Bến Thành" },
    ]

    it("findMatchingProvince matches exact and name_with_type variants", () => {
        expect(findMatchingProvince(provinces, "Thành phố Hồ Chí Minh")?.code).toBe("79")
        expect(findMatchingProvince(provinces, "hồ chí minh")?.code).toBe("79")
        expect(findMatchingProvince(provinces, "Bình Dương")?.code).toBe("74")
        expect(findMatchingProvince(provinces, "Nonexistent")).toBeUndefined()
    })

    it("findMatchingDistrict matches districts", () => {
        expect(findMatchingDistrict(districts, "Quận 1")?.code).toBe("760")
        expect(findMatchingDistrict(districts, "Huyện Củ Chi")?.code).toBe("783")
    })

    it("findMatchingWard matches wards", () => {
        expect(findMatchingWard(wards, "Phường Bến Nghé")?.code).toBe("26734")
        expect(findMatchingWard(wards, "bến thành")?.code).toBe("26737")
    })

    it("matchGhnLocation maps input strings to GHN codes & location objects", () => {
        const result = matchGhnLocation(
            {
                city: "TP. Hồ Chí Minh",
                district: "Quận 1",
                ward: "Phường Bến Nghé",
            },
            provinces,
            districts,
            wards,
        )

        expect(result.isMatched).toBe(true)
        expect(result.matchedProvince?.code).toBe("79")
        expect(result.matchedDistrict?.code).toBe("760")
        expect(result.matchedWard?.code).toBe("26734")
        expect(result.ghnProvinceId).toBe(79)
        expect(result.ghnDistrictId).toBe(760)
        expect(result.ghnWardCode).toBe("26734")
    })

    it("matchGhnLocation returns isMatched false when location is missing", () => {
        const result = matchGhnLocation(
            {
                city: "TP. Hồ Chí Minh",
                district: "Unknown District",
            },
            provinces,
            districts,
        )

        expect(result.isMatched).toBe(false)
        expect(result.matchedProvince?.code).toBe("79")
        expect(result.matchedDistrict).toBeUndefined()
    })
})
