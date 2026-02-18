"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Clock, Flame, ArrowRight, Tag } from "lucide-react"
import { api } from "@/lib/api/client"

interface SaleCampaign {
    id: string
    name: string
    slug?: string | null
    description?: string | null
    bannerImageUrl?: string | null
    type: number | string
    startDate: string
    endDate: string
    isActive: boolean
    isFeatured: boolean
    isRunning: boolean
    isUpcoming: boolean
    itemCount: number
}

function getTimeLeft(endDate: string) {
    const diff = new Date(endDate).getTime() - Date.now()
    if (diff <= 0) return null

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((diff / (1000 * 60)) % 60)
    const seconds = Math.floor((diff / 1000) % 60)

    return { days, hours, minutes, seconds }
}

function CountdownTimer({ endDate }: { endDate: string }) {
    const [timeLeft, setTimeLeft] = useState(getTimeLeft(endDate))

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(getTimeLeft(endDate))
        }, 1000)
        return () => clearInterval(interval)
    }, [endDate])

    if (!timeLeft)
        return (
            <span className="text-sm text-red-500 font-medium">
                Đã kết thúc
            </span>
        )

    return (
        <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-orange-500" />
            <div className="flex gap-1 text-sm font-mono font-bold">
                {timeLeft.days > 0 && (
                    <span className="bg-gray-900 text-white px-1.5 py-0.5 rounded text-xs">
                        {timeLeft.days}d
                    </span>
                )}
                <span className="bg-gray-900 text-white px-1.5 py-0.5 rounded text-xs">
                    {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-gray-400">:</span>
                <span className="bg-gray-900 text-white px-1.5 py-0.5 rounded text-xs">
                    {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-gray-400">:</span>
                <span className="bg-gray-900 text-white px-1.5 py-0.5 rounded text-xs">
                    {String(timeLeft.seconds).padStart(2, "0")}
                </span>
            </div>
        </div>
    )
}

export function SaleBanner() {
    const [campaigns, setCampaigns] = useState<SaleCampaign[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const result = await api.saleCampaignBrowse({
                    isActive: true,
                    onlyRunning: true,
                    pageSize: 3,
                })
                setCampaigns(result.data || [])
            } catch (err) {
                console.error("Failed to fetch campaigns:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchCampaigns()
    }, [])

    // Don't render anything if no active campaigns
    if (loading || campaigns.length === 0) return null

    return (
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Section header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <Flame className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Khuyến mãi đang diễn ra
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Ưu đãi có hạn — đừng bỏ lỡ!
                        </p>
                    </div>
                </div>
            </div>

            {/* Campaign cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                    <Link
                        key={campaign.id}
                        href={
                            campaign.slug
                                ? `/sale/${campaign.slug}`
                                : `/collection`
                        }
                        className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                        {/* Banner image or gradient */}
                        {campaign.bannerImageUrl ? (
                            <div className="h-40 overflow-hidden">
                                <img
                                    src={campaign.bannerImageUrl}
                                    alt={campaign.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        ) : (
                            <div className="h-40 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 flex items-center justify-center">
                                <Tag className="w-12 h-12 text-white/60" />
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-5 space-y-3">
                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                                {campaign.name}
                            </h3>

                            {campaign.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {campaign.description}
                                </p>
                            )}

                            <div className="flex items-center justify-between pt-2">
                                <CountdownTimer endDate={campaign.endDate} />
                                <span className="text-xs text-muted-foreground">
                                    {campaign.itemCount} sản phẩm
                                </span>
                            </div>

                            <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                                <span>Xem ngay</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        {/* Running badge */}
                        {campaign.isRunning && (
                            <div className="absolute top-3 right-3 px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                LIVE
                            </div>
                        )}
                    </Link>
                ))}
            </div>
        </section>
    )
}
