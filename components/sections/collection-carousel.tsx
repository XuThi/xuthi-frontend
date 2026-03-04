"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { api } from "@/lib/api/client"

interface CollectionCard {
    id: string
    name: string
    image: string | null
    link: string
    type: "category" | "campaign"
}

export function CollectionCarousel() {
    const [cards, setCards] = useState<CollectionCard[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    useEffect(() => {
        const loadCollections = async () => {
            const items: CollectionCard[] = []

            try {
                const catResult = await api.categoryBrowse({ limit: 20 })
                for (const cat of catResult.data) {
                    items.push({
                        id: `cat-${cat.id}`,
                        name: cat.name,
                        image: cat.image || null,
                        link: `/collection/${cat.slug}`,
                        type: "category",
                    })
                }
            } catch (e) {
                console.error("Failed to load categories for collection", e)
            }

            try {
                const campResult = await api.saleCampaignBrowse({
                    isActive: true,
                    onlyRunning: true,
                    pageSize: 10,
                })
                for (const camp of campResult.data || []) {
                    items.push({
                        id: `camp-${camp.id}`,
                        name: camp.name,
                        image: camp.bannerImageUrl || null,
                        link: camp.slug ? `/sale/${camp.slug}` : "/collection",
                        type: "campaign",
                    })
                }
            } catch (e) {
                console.error("Failed to load campaigns for collection", e)
            }

            setCards(items)
        }

        loadCollections()
    }, [])

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        setCanScrollLeft(el.scrollLeft > 0)
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
    }, [])

    useEffect(() => {
        updateScrollState()
        const el = scrollRef.current
        if (!el) return
        el.addEventListener("scroll", updateScrollState, { passive: true })
        window.addEventListener("resize", updateScrollState)
        return () => {
            el.removeEventListener("scroll", updateScrollState)
            window.removeEventListener("resize", updateScrollState)
        }
    }, [cards, updateScrollState])

    const scroll = (dir: "left" | "right") => {
        const el = scrollRef.current
        if (!el) return
        const scrollAmount = el.clientWidth * 0.7
        el.scrollBy({
            left: dir === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        })
    }

    if (cards.length === 0) return null

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-12 sm:pb-16">
            <div className="mb-12">
                <h2 className="text-2xl sm:text-3xl font-medium text-foreground">
                    Bộ sưu tập
                </h2>
                <p className="mt-2 text-muted-foreground">
                    Khám phá các bộ sưu tập và chương trình ưu đãi
                </p>
            </div>

            <div className="relative group">
                {canScrollLeft && (
                    <button
                        type="button"
                        onClick={() => scroll("left")}
                        className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}

                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {cards.map((card) => (
                        <Link
                            key={card.id}
                            href={card.link}
                            className="flex-shrink-0 snap-start w-64 sm:w-72 lg:w-80 group/card"
                        >
                            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-100 mb-4 shadow-sm">
                                {card.image ? (
                                    <Image
                                        src={card.image}
                                        alt={card.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                                        sizes="(max-width: 640px) 256px, (max-width: 1024px) 288px, 320px"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                                        <span className="text-5xl font-light text-neutral-300">
                                            {card.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                {/* Gradient overlay for text readability */}
                                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
                                <div className="absolute bottom-0 inset-x-0 p-5">
                                    <h3 className="text-white font-medium text-lg tracking-wide">
                                        {card.name}
                                    </h3>
                                    <span className="text-white/80 text-sm mt-1 inline-block">
                                        {card.type === "campaign" ? "Xem khuyến mãi" : "Xem bộ sưu tập"} &rarr;
                                    </span>
                                </div>
                                {card.type === "campaign" && (
                                    <span className="absolute top-3 left-3 bg-black text-white text-xs font-semibold px-3 py-1 rounded-full tracking-wide uppercase">
                                        Sale
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>

                {canScrollRight && (
                    <button
                        type="button"
                        onClick={() => scroll("right")}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}
            </div>
        </section>
    )
}
