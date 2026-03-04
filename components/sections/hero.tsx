"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { api } from "@/lib/api/client"

interface CampaignSlide {
    image: string
    link: string
    alt: string
}

export function Hero() {
    const [slides, setSlides] = useState<CampaignSlide[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    /**
     * Infinite-loop carousel using the clone technique.
     *
     * For N real slides, we render: [slides[N-1], ...slides, slides[0]]
     * i.e. a "last clone" at index 0 and a "first clone" at index N+1.
     *
     * virtualIndex always lives in [0 .. N+1].
     * Real slide for dot indicators = virtualIndex - 1, clamped to [0, N-1].
     *
     * When virtualIndex reaches 0 or N+1, we wait for the CSS transition to
     * finish (510ms), then instantly (no animation) jump to the real position.
     */
    const [virtualIndex, setVirtualIndex] = useState(1) // starts at real slide 0
    const [animated, setAnimated] = useState(true) // false = instant jump, no transition
    const jumpScheduled = useRef(false)

    // Drag / pointer state
    const containerRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)
    const wasDragged = useRef(false)
    const dragStartX = useRef(0)
    const [dragOffset, setDragOffset] = useState(0)
    const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const slideCount = slides.length

    // Extended array: [last, ...real, first]
    const virtualSlides =
        slideCount > 1
            ? [slides[slideCount - 1], ...slides, slides[0]]
            : slides
    const virtualCount = virtualSlides.length

    // Which real slide index is currently visible (for dot indicator)
    const realCurrentSlide =
        virtualIndex <= 0
            ? slideCount - 1
            : virtualIndex >= slideCount + 1
              ? 0
              : virtualIndex - 1

    // ── Fetch campaigns ────────────────────────────────────────────────────
    useEffect(() => {
        const fetch = async () => {
            try {
                const result = await api.saleCampaignBrowse({
                    isActive: true,
                    onlyRunning: true,
                    pageSize: 10,
                })
                const bannerSlides = (result.data || [])
                    .filter(
                        (c) =>
                            typeof c.bannerImageUrl === "string" &&
                            c.bannerImageUrl.trim().length > 0,
                    )
                    .map((c) => ({
                        image: c.bannerImageUrl!.trim(),
                        link: c.slug ? `/sale/${c.slug}` : "/collection",
                        alt: c.name,
                    }))
                if (bannerSlides.length > 0) {
                    setSlides(bannerSlides)
                    setVirtualIndex(1)
                }
            } catch (e) {
                console.error("Failed to load hero banners", e)
            } finally {
                setIsLoaded(true)
            }
        }
        fetch()
    }, [])

    // ── Infinite loop: jump after clone is shown ───────────────────────────
    useEffect(() => {
        if (slideCount <= 1) return
        // Only act on the clone boundary indices
        if (virtualIndex !== 0 && virtualIndex !== slideCount + 1) return
        if (jumpScheduled.current) return

        jumpScheduled.current = true
        const timer = setTimeout(() => {
            // Disable transition for the instant jump
            setAnimated(false)
            setVirtualIndex(virtualIndex === 0 ? slideCount : 1)
            // Re-enable transition on the very next paint
            requestAnimationFrame(() =>
                requestAnimationFrame(() => {
                    setAnimated(true)
                    jumpScheduled.current = false
                }),
            )
        }, 510) // just after the 500ms CSS transition

        return () => {
            clearTimeout(timer)
            jumpScheduled.current = false
        }
    }, [virtualIndex, slideCount])

    // ── Auto-play ──────────────────────────────────────────────────────────
    const startAutoplay = useCallback(() => {
        if (autoplayRef.current) clearInterval(autoplayRef.current)
        if (slideCount <= 1) return
        autoplayRef.current = setInterval(() => {
            setAnimated(true)
            setVirtualIndex((prev) => prev + 1)
        }, 5000)
    }, [slideCount])

    useEffect(() => {
        startAutoplay()
        return () => {
            if (autoplayRef.current) clearInterval(autoplayRef.current)
        }
    }, [startAutoplay])

    // ── Pointer drag ───────────────────────────────────────────────────────
    const handlePointerDown = (e: React.PointerEvent) => {
        if (slideCount <= 1) return
        if (e.pointerType === "mouse" && e.button !== 0) return
        isDragging.current = true
        wasDragged.current = false
        dragStartX.current = e.clientX
        setDragOffset(0)
        if (autoplayRef.current) clearInterval(autoplayRef.current)
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return
        const diff = e.clientX - dragStartX.current
        if (Math.abs(diff) > 5) wasDragged.current = true
        setDragOffset(diff)
    }

    const handlePointerUp = () => {
        if (!isDragging.current) return
        isDragging.current = false
        const containerWidth = containerRef.current?.offsetWidth || 1
        const threshold = containerWidth * 0.15
        if (Math.abs(dragOffset) > threshold) {
            setAnimated(true)
            if (dragOffset < 0) {
                // Swiped left → advance (may enter clone at N+1)
                setVirtualIndex((prev) => prev + 1)
            } else {
                // Swiped right → go back (may enter clone at 0)
                setVirtualIndex((prev) => prev - 1)
            }
        }
        setDragOffset(0)
        startAutoplay()
    }

    const handleClick = (e: React.MouseEvent) => {
        if (wasDragged.current) {
            e.preventDefault()
            e.stopPropagation()
            wasDragged.current = false
        }
    }

    // ── Transform (pixel-based, 1:1 with cursor) ───────────────────────────
    const getStripTransform = () => {
        const cw = containerRef.current?.offsetWidth ?? 0
        const basePx = -virtualIndex * cw
        if (dragOffset === 0 || cw === 0) return `translateX(${basePx}px)`
        return `translateX(${basePx + dragOffset}px)`
    }

    // ── Go to dot ──────────────────────────────────────────────────────────
    const goToSlide = (realIndex: number) => {
        setAnimated(true)
        setVirtualIndex(realIndex + 1)
    }

    // ── Render ─────────────────────────────────────────────────────────────
    if (!isLoaded || slideCount === 0) {
        return (
            <section className="relative w-full overflow-hidden">
                <div
                    className="relative w-full bg-neutral-100 animate-pulse"
                    style={{
                        aspectRatio: "16/8",
                        minHeight: "500px",
                        maxHeight: "900px",
                    }}
                />
            </section>
        )
    }

    return (
        <section
            ref={containerRef}
            className="relative w-full overflow-hidden select-none touch-pan-y cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            <div
                className="relative w-full"
                style={{
                    aspectRatio: "16/8",
                    minHeight: "500px",
                    maxHeight: "900px",
                }}
            >
                {/* Strip: [lastClone, slide0, slide1, …, firstClone] */}
                <div
                    className="absolute inset-0 flex"
                    style={{
                        width: `${virtualCount * 100}%`,
                        transform: getStripTransform(),
                        transition:
                            animated && dragOffset === 0
                                ? "transform 500ms ease-in-out"
                                : "none",
                    }}
                >
                    {virtualSlides.map((slide, index) => (
                        <div
                            key={`vs-${index}`}
                            className="relative h-full"
                            style={{ width: `${100 / virtualCount}%` }}
                        >
                            <Link
                                href={slide.link}
                                className="block w-full h-full"
                                onClick={handleClick}
                                draggable={false}
                            >
                                <Image
                                    src={slide.image}
                                    alt={slide.alt}
                                    fill
                                    className="object-cover object-center pointer-events-none"
                                    draggable={false}
                                    priority={index === 1}
                                    sizes="100vw"
                                />
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Dot indicators (based on real slide, not virtual) */}
                {slideCount > 1 && (
                    <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
                        {slides.map((_, index) => (
                            <button
                                key={`dot-${index}`}
                                type="button"
                                onClick={() => goToSlide(index)}
                                className={`h-2.5 w-2.5 rounded-full transition ${
                                    index === realCurrentSlide
                                        ? "bg-white"
                                        : "bg-white/50 hover:bg-white/80"
                                }`}
                                aria-label={`Đi tới slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
