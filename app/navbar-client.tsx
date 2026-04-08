"use client"

import { useState } from "react"
import { ChevronDown, Menu } from "lucide-react"
import type { Category, SaleCampaign } from "@/lib/api/types"
import { AppLink } from "@/components/app-link"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"

interface NavbarClientProps {
	categories: Category[]
	saleCampaigns: SaleCampaign[]
}

export function NavbarClient({ categories, saleCampaigns }: NavbarClientProps) {
	const [openDropdown, setOpenDropdown] = useState<string | null>(null)
	const [mobileOpen, setMobileOpen] = useState(false)

	const activeSales = saleCampaigns.filter((s) => s.isRunning)
	const upcomingSales = saleCampaigns.filter((s) => s.isUpcoming)

	return (
		<>
			{/* Desktop Nav */}
			<nav className="hidden md:flex items-center gap-1">
				<AppLink
					prefetch={"eager"}
					href="/"
					className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-nav-hover"
				>
					Trang chủ
				</AppLink>

				{/* Danh Mục (Categories) Dropdown */}
				<div
					className="relative"
					onMouseEnter={() => setOpenDropdown("categories")}
					onMouseLeave={() => setOpenDropdown(null)}
				>
					<button
						type="button"
						className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-nav-hover cursor-pointer"
					>
						Danh mục
						<ChevronDown
							className={`w-3.5 h-3.5 transition-transform duration-200 ${
								openDropdown === "categories" ? "rotate-180" : ""
							}`}
						/>
					</button>

					{openDropdown === "categories" && categories.length > 0 && (
						<div className="absolute left-0 top-full pt-2 z-50">
							<div className="bg-popover border border-border rounded-xl shadow-xl p-4 min-w-[320px] animate-in fade-in-0 slide-in-from-top-2 duration-200">
								<div className="space-y-1">
									{categories.map((category) => (
										<AppLink
											prefetch={"eager"}
											key={category.id}
											href={`/collection/${category.slug}`}
											className="block p-2.5 rounded-lg hover:bg-nav-hover transition-colors group cursor-pointer"
											onClick={() => setOpenDropdown(null)}
										>
											<div className="min-w-0">
												<span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors block truncate">
													{category.name}
												</span>
												{category.productCount > 0 && (
													<span className="text-xs text-muted-foreground">
														{category.productCount} sản phẩm
													</span>
												)}
											</div>
										</AppLink>
									))}
								</div>
								<div className="border-t border-border mt-3 pt-3">
									<AppLink
										prefetch={"eager"}
										href="/collection"
										className="flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-1.5 cursor-pointer"
										onClick={() => setOpenDropdown(null)}
									>
										Xem tất cả danh mục →
									</AppLink>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Khuyến Mãi (Sale Campaigns) Dropdown */}
				{(activeSales.length > 0 || upcomingSales.length > 0) && (
					<div
						className="relative"
						onMouseEnter={() => setOpenDropdown("sales")}
						onMouseLeave={() => setOpenDropdown(null)}
					>
						<button
							type="button"
							className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-nav-hover cursor-pointer"
						>
							Khuyến mãi
							<ChevronDown
								className={`w-3.5 h-3.5 transition-transform duration-200 ${
									openDropdown === "sales" ? "rotate-180" : ""
								}`}
							/>
						</button>

						{openDropdown === "sales" && (
							<div className="absolute left-0 top-full pt-2 z-50">
								<div className="bg-popover border border-border rounded-xl shadow-xl p-4 min-w-75 animate-in fade-in-0 slide-in-from-top-2 duration-200">
									{activeSales.length > 0 && (
										<div className="space-y-1">
											{activeSales.map((sale) => (
												<AppLink
													prefetch={"eager"}
													key={sale.id}
													href={`/sale/${sale.slug}`}
													className="block p-2.5 rounded-lg hover:bg-nav-hover transition-colors group cursor-pointer"
													onClick={() => setOpenDropdown(null)}
												>
													<div className="min-w-0">
														<span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors block truncate">
															{sale.name}
														</span>
														<span className="text-xs text-muted-foreground">
															{sale.itemCount} sản phẩm giảm giá
														</span>
													</div>
												</AppLink>
											))}
										</div>
									)}
									{upcomingSales.length > 0 && (
										<div className={activeSales.length > 0 ? "border-t border-border mt-3 pt-3" : ""}>
											<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
												⏳ Sắp diễn ra
											</p>
											{upcomingSales.map((sale) => (
												<AppLink
													prefetch={"eager"}
													key={sale.id}
													href={`/sale/${sale.slug}`}
													className="block p-2.5 rounded-lg hover:bg-nav-hover hover:text-primary transition-colors opacity-70 cursor-pointer"
													onClick={() => setOpenDropdown(null)}
												>
													<span className="text-sm text-foreground truncate">
														{sale.name}
													</span>
												</AppLink>
											))}
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				)}

				{/* Bộ Sưu Tập Link */}
				<AppLink
					prefetch={"eager"}
					href="/collection"
					className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-nav-hover"
				>
					Bộ sưu tập
				</AppLink>
			</nav>

			{/* Mobile Menu Button */}
			<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
				<SheetTrigger asChild>
					<button
						type="button"
						className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
						aria-label="Mở menu"
					>
						<Menu className="w-5 h-5" />
					</button>
				</SheetTrigger>
				<SheetContent side="left" className="w-80 p-0">
					<SheetHeader className="p-4 border-b border-border">
						<SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
					</SheetHeader>
					<div className="overflow-y-auto flex-1 p-4 space-y-6">
						{/* Mobile Home */}
						<AppLink
							href="/"
							className="block text-base font-medium text-foreground hover:text-primary transition-colors"
							onClick={() => setMobileOpen(false)}
						>
							Trang chủ
						</AppLink>

						{/* Mobile Categories */}
						{categories.length > 0 && (
							<div>
								<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
									Danh mục sản phẩm
								</p>
								<div className="space-y-1">
									{categories.map((category) => (
										<AppLink
											key={category.id}
											href={`/collection/${category.slug}`}
											className="block p-2 rounded-lg hover:bg-nav-hover transition-colors cursor-pointer"
											onClick={() => setMobileOpen(false)}
										>
											<span className="text-sm font-medium text-foreground">
												{category.name}
											</span>
										</AppLink>
									))}
								</div>
							</div>
						)}

						{/* Mobile Sales */}
						{activeSales.length > 0 && (
							<div>
								<p className="text-xs font-semibold text-sale uppercase tracking-wider mb-3">
									🔥 Khuyến mãi
								</p>
								<div className="space-y-1">
									{activeSales.map((sale) => (
										<AppLink
											key={sale.id}
											href={`/sale/${sale.slug}`}
											className="block p-2 rounded-lg hover:bg-nav-hover hover:text-primary transition-colors text-sm font-medium text-foreground cursor-pointer"
											onClick={() => setMobileOpen(false)}
										>
											{sale.name}
										</AppLink>
									))}
								</div>
							</div>
						)}

						{/* Mobile Collection */}
						<AppLink
							href="/collection"
							className="block text-base font-medium text-foreground hover:text-primary transition-colors"
							onClick={() => setMobileOpen(false)}
						>
							Bộ sưu tập
						</AppLink>
					</div>
				</SheetContent>
			</Sheet>
		</>
	)
}
