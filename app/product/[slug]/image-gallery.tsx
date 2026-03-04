"use client"

import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Variant = {
    id: string
    images: string[]
    combinations?: {
        variantValue: {
            value: string
            variantType: {
                label: string
            }
        }
    }[]
    attributes?: Record<string, string>
}

type ImageGalleryProps = {
    images: string[]
    productName: string
    variants: Variant[]
}

export function ImageGallery({
    images,
    productName,
    variants,
}: ImageGalleryProps) {
    const searchParams = useSearchParams()
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [isZoomed, setIsZoomed] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [fullscreenVisible, setFullscreenVisible] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Track previous searchParams to reset index when variant changes
    const searchParamsKey = searchParams.toString()
    const prevSearchParamsKey = useRef(searchParamsKey)
    if (prevSearchParamsKey.current !== searchParamsKey) {
        prevSearchParamsKey.current = searchParamsKey
        setSelectedIndex(0)
    }

    const displayImages = useMemo(() => {
        const selectedVariant = variants.find((v) => {
            if (v.combinations?.length) {
                return v.combinations.every(
                    (c) =>
                        searchParams.get(c.variantValue.variantType.label) ===
                        c.variantValue.value,
                )
            }
            if (v.attributes) {
                const paramsOptions: Record<string, string> = {}
                searchParams.forEach((value, key) => {
                    paramsOptions[key] = value
                })
                return Object.entries(paramsOptions).every(
                    ([key, value]) => v.attributes?.[key] === value,
                )
            }
            return false
        })

        if (selectedVariant?.images.length) {
            return selectedVariant.images
        }
        return images
    }, [variants, searchParams, images])

    const handlePrevious = () => {
        setSelectedIndex((prev) =>
            prev === 0 ? displayImages.length - 1 : prev - 1,
        )
    }

    const handleNext = () => {
        setSelectedIndex((prev) =>
            prev === displayImages.length - 1 ? 0 : prev + 1,
        )
    }

    const openFullscreen = () => {
        setIsFullscreen(true)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setFullscreenVisible(true)
            })
        })
    }

    const closeFullscreen = () => {
        setFullscreenVisible(false)
        setTimeout(() => {
            setIsFullscreen(false)
        }, 300)
    }

    // Keyboard controls
    useEffect(() => {
        if (!isFullscreen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeFullscreen()
            if (e.key === "ArrowLeft") handlePrevious()
            if (e.key === "ArrowRight") handleNext()
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [isFullscreen, displayImages.length, selectedIndex])

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = isFullscreen ? "hidden" : ""
        return () => {
            document.body.style.overflow = ""
        }
    }, [isFullscreen])

    if (displayImages.length === 0) {
        return (
            <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
                <div className="aspect-square bg-secondary rounded-2xl flex items-center justify-center">
                    <p className="text-muted-foreground">No images available</p>
                </div>
            </div>
        )
    }

    // Fullscreen portal — rendered at document.body level to escape all stacking contexts
    // (sticky/transform on ancestors would otherwise scope fixed z-index)
    const fullscreenPortal =
        mounted && isFullscreen
            ? createPortal(
                  <div
                      className={cn(
                          "fixed inset-0 bg-black/95 transition-opacity duration-300",
                          "flex items-center justify-center",
                          // z-[9999] at body level ensures it's truly above everything
                          "z-[9999]",
                          fullscreenVisible ? "opacity-100" : "opacity-0",
                      )}
                      // Click anywhere on the dark backdrop closes the viewer
                      onClick={closeFullscreen}
                  >
                      {/* Close button */}
                      <button
                          type="button"
                          onClick={(e) => {
                              e.stopPropagation()
                              closeFullscreen()
                          }}
                          className="absolute top-6 right-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                          aria-label="Đóng"
                      >
                          <X className="h-5 w-5" />
                      </button>

                      {/* Image — stop click propagation only on the image itself */}
                      <div
                          className={cn(
                              "relative w-full h-full transition-transform duration-300",
                              fullscreenVisible ? "scale-100" : "scale-95",
                          )}
                          onClick={(e) => e.stopPropagation()}
                      >
                          <Image
                              src={displayImages[selectedIndex]}
                              alt={`${productName} fullscreen`}
                              fill
                              className="object-contain"
                              sizes="100vw"
                              priority
                          />
                      </div>

                      {/* Navigation arrows */}
                      {displayImages.length > 1 && (
                          <>
                              <button
                                  type="button"
                                  onClick={(e) => {
                                      e.stopPropagation()
                                      handlePrevious()
                                  }}
                                  className="absolute left-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/10 shadow-lg flex items-center justify-center text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                              >
                                  <ChevronLeft className="h-6 w-6" />
                              </button>
                              <button
                                  type="button"
                                  onClick={(e) => {
                                      e.stopPropagation()
                                      handleNext()
                                  }}
                                  className="absolute right-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/10 shadow-lg flex items-center justify-center text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                              >
                                  <ChevronRight className="h-6 w-6" />
                              </button>
                          </>
                      )}

                      {/* Image counter */}
                      {displayImages.length > 1 && (
                          <div
                              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm"
                              onClick={(e) => e.stopPropagation()}
                          >
                              {selectedIndex + 1} / {displayImages.length}
                          </div>
                      )}
                  </div>,
                  document.body,
              )
            : null

    return (
        <>
            <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
                {/* Main Image */}
                <div className="group relative aspect-square overflow-hidden rounded-2xl bg-secondary">
                    <Image
                        src={displayImages[selectedIndex]}
                        alt={`${productName} - View ${selectedIndex + 1}`}
                        fill
                        className={cn(
                            "object-cover transition-transform duration-500",
                            isZoomed && "scale-150 cursor-zoom-out",
                        )}
                        onClick={() => setIsZoomed(!isZoomed)}
                        priority
                    />

                    {/* Navigation Arrows */}
                    {displayImages.length > 1 && (
                        <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-background/90 shadow-lg backdrop-blur-sm hover:bg-background"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handlePrevious()
                                }}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-background/90 shadow-lg backdrop-blur-sm hover:bg-background"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleNext()
                                }}
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    )}

                    {/* Zoom Indicator */}
                    <div className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                            <ZoomIn className="h-3.5 w-3.5" />
                            Phóng to
                        </div>
                    </div>

                    {/* View Full button */}
                    <button
                        type="button"
                        onClick={openFullscreen}
                        className="absolute top-4 right-4 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100"
                    >
                        Xem full
                    </button>

                    {/* Image Counter */}
                    {displayImages.length > 1 && (
                        <div className="absolute bottom-4 left-4 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                            {selectedIndex + 1} / {displayImages.length}
                        </div>
                    )}
                </div>

                {/* Thumbnails */}
                {displayImages.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto p-2 -m-2">
                        {displayImages.map((image, index) => (
                            <button
                                key={image}
                                type="button"
                                onClick={() => setSelectedIndex(index)}
                                className={cn(
                                    "relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg transition-all duration-200",
                                    selectedIndex === index
                                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                                        : "opacity-60 hover:opacity-100",
                                )}
                            >
                                <Image
                                    src={image}
                                    alt={`${productName} thumbnail ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Portal: rendered at document.body to escape sticky stacking context */}
            {fullscreenPortal}
        </>
    )
}
