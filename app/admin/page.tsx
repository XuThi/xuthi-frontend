"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { getOrderStatusMeta } from "@/lib/admin/presentation"
import { useCurrency } from "@/lib/currency-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const API_URL = "/api/bff"

interface RecentOrder {
  id: string
  orderNumber: string
  customerName: string
  total: number
  status: string
  createdAt: string
}

interface MonthlyRevenue {
  month: string
  revenue: number
}

interface DashboardStats {
  totalRevenue: number
  revenueChangePercentage: number
  orderCount: number
  orderCountChangePercentage: number
  activeProductsCount: number
  newCustomersCount: number
  newCustomersChangePercentage: number
  recentOrders: RecentOrder[]
  monthlyRevenue: MonthlyRevenue[]
}

export default function AdminPage() {
  const { formatFromVnd } = useCurrency()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("xuthi_auth_token")
      const response = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setError("Không thể tải dữ liệu tổng quan. Vui lòng kiểm tra quyền truy cập.")
      }
    } catch (err) {
      console.error("Error fetching dashboard stats:", err)
      setError("Đã xảy ra lỗi khi kết nối máy chủ.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Đang tải số liệu thống kê...</p>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-20 bg-card rounded-xl border border-destructive/20 max-w-2xl mx-auto my-8">
        <p className="text-destructive font-medium mb-4">{error || "Đã xảy ra lỗi"}</p>
        <Button onClick={fetchDashboardStats} variant="outline">Thử lại</Button>
      </div>
    )
  }

  // Find max monthly revenue for scaling SVG chart
  const maxRevenue = Math.max(...stats.monthlyRevenue.map((d) => d.revenue), 1000000)

  return (
    <main className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tổng quan</h1>
          <p className="text-muted-foreground text-sm">Chào mừng quay trở lại. Đây là số liệu hoạt động của cửa hàng.</p>
        </div>
        <Button onClick={fetchDashboardStats} size="sm" variant="outline" className="self-start">
          Làm mới số liệu
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <Card className="overflow-hidden hover:shadow-md transition-shadow relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng doanh thu (tháng này)</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFromVnd(stats.totalRevenue)}</div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              {stats.revenueChangePercentage >= 0 ? (
                <span className="flex items-center text-emerald-600 font-medium">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  +{stats.revenueChangePercentage}%
                </span>
              ) : (
                <span className="flex items-center text-rose-600 font-medium">
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                  {stats.revenueChangePercentage}%
                </span>
              )}
              <span className="text-muted-foreground">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card className="overflow-hidden hover:shadow-md transition-shadow relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đơn hàng mới (tháng này)</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-sky-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.orderCount}</div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              {stats.orderCountChangePercentage >= 0 ? (
                <span className="flex items-center text-emerald-600 font-medium">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  +{stats.orderCountChangePercentage}%
                </span>
              ) : (
                <span className="flex items-center text-rose-600 font-medium">
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                  {stats.orderCountChangePercentage}%
                </span>
              )}
              <span className="text-muted-foreground">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card className="overflow-hidden hover:shadow-md transition-shadow relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sản phẩm đang bán</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-violet-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProductsCount}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
              Đang hoạt động trên cửa hàng
            </div>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card className="overflow-hidden hover:shadow-md transition-shadow relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Khách hàng mới (tháng này)</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.newCustomersCount}</div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              {stats.newCustomersChangePercentage >= 0 ? (
                <span className="flex items-center text-emerald-600 font-medium">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  +{stats.newCustomersChangePercentage}%
                </span>
              ) : (
                <span className="flex items-center text-rose-600 font-medium">
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                  {stats.newCustomersChangePercentage}%
                </span>
              )}
              <span className="text-muted-foreground">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-8">
        {/* Revenue Chart - 5 Columns */}
        <Card className="lg:col-span-5 hover:shadow-sm transition-shadow">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Doanh thu 6 tháng gần nhất</CardTitle>
            <CardDescription>Biểu đồ doanh thu hàng tháng từ hoạt động bán hàng</CardDescription>
          </CardHeader>
          <CardContent>
            {/* SVG Chart */}
            <div className="w-full h-64 relative flex flex-col justify-end mt-4">
              <div className="flex h-full items-end gap-3 justify-between px-4 pb-2 border-b border-border">
                {stats.monthlyRevenue.map((d, index) => {
                  // Calculate height percentage (min height 5% for visual visibility)
                  const heightPercent = maxRevenue > 0 ? (d.revenue / maxRevenue) * 80 + 5 : 5
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 bg-popover text-popover-foreground border px-2.5 py-1 rounded-md text-xs font-semibold shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap">
                        {formatFromVnd(d.revenue)}
                      </div>
                      {/* Animated Gradient Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-primary/80 to-primary transition-all duration-500 hover:brightness-110 shadow-sm"
                      ></div>
                      <span className="text-xs text-muted-foreground mt-2 truncate max-w-full text-center">
                        {d.month}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders - 3 Columns */}
        <Card className="lg:col-span-3 hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Đơn hàng mới nhất</CardTitle>
              <CardDescription>Hoạt động đặt hàng gần đây</CardDescription>
            </div>
            <Link href="/admin/orders">
              <Button size="sm" variant="ghost" className="text-xs">
                Xem tất cả
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentOrders.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Chưa có đơn hàng nào
                </div>
              ) : (
                stats.recentOrders.map((order) => {
                  const statusMeta = getOrderStatusMeta(order.status)
                  return (
                    <div key={order.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/40 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/orders/${order.id}`} className="font-semibold text-sm hover:underline hover:text-primary">
                            #{order.orderNumber}
                          </Link>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusMeta.badgeClass}`}>
                            {statusMeta.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {order.customerName} • {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">{formatFromVnd(order.total)}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
