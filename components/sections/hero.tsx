"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { api } from "@/lib/api/client"

interface CampaignSlide {
    image: string
    link: string
    alt: string
}

const fallbackSlides: CampaignSlide[] = [
    {
        image: "",
        link: "/collection",
        alt: "Khuyến mãi",
    },
]

export function Hero() {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [slides, setSlides] = useState<CampaignSlide[]>(fallbackSlides)

    const goToSlide = (index: number) => {
        if (slides.length === 0) return
        const normalized = (index + slides.length) % slides.length
        setCurrentSlide(normalized)
    }

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const result = await api.saleCampaignBrowse({
                    isActive: true,
                    onlyRunning: true,
                    pageSize: 10,
                })

                const campaigns = result.data || []
                const bannerSlides = campaigns
                    .filter((c) => c.bannerImageUrl)
                    .map((c) => ({
                        image: c.bannerImageUrl!,
                        link: c.slug ? `/sale/${c.slug}` : "/collection",
                        alt: c.name,
                    }))

                if (bannerSlides.length > 0) {
                    setSlides(bannerSlides)
                }
            } catch (error) {
                console.error("Failed to load campaign banners for hero", error)
            }
        }

        fetchCampaigns()
    }, [])

    // Auto-play carousel
    useEffect(() => {
        if (slides.length <= 1) return
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 1500)
        return () => clearInterval(interval)
    }, [slides.length])

    useEffect(() => {
        if (currentSlide >= slides.length) {
            setCurrentSlide(0)
        }
    }, [slides.length, currentSlide])

    return (
        <section className="relative w-full overflow-hidden">
            <div
                className="relative w-full"
                style={{
                    aspectRatio: "16/8",
                    minHeight: "500px",
                    maxHeight: "820px",
                }}
            >
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                            index === currentSlide
                                ? "opacity-100 z-10"
                                : "opacity-0 z-0"
                        }`}
                    >
                        {slide.image ? (
                            <Link
                                href={slide.link}
                                className="block w-full h-full cursor-pointer"
                            >
                                <Image
                                    src={slide.image}
                                    alt={slide.alt}
                                    fill
                                    className="object-cover object-center"
                                    priority={index === 0}
                                    sizes="100vw"
                                />
                            </Link>
                        ) : (
                            <Link
                                href={slide.link}
                                className="block w-full h-full cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-neutral-100" />
                            </Link>
                        )}
                    </div>
                ))}

                {slides.length > 1 && (
                    <>
                        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
                            {slides.map((_, index) => (
                                <button
                                    key={`dot-${index}`}
                                    type="button"
                                    onClick={() => goToSlide(index)}
                                    className={`h-2.5 w-2.5 rounded-full transition ${
                                        index === currentSlide
                                            ? "bg-white"
                                            : "bg-white/50 hover:bg-white/80"
                                    }`}
                                    aria-label={`Đi tới slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    )
}
