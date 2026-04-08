export type OrderStatus =
    | "Pending"
    | "Confirmed"
    | "Processing"
    | "Shipped"
    | "Delivered"
    | "Completed"
    | "Cancelled"

const ORDER_STATUS_META: Record<
    OrderStatus,
    { label: string; badgeClass: string }
> = {
    Pending: {
        label: "Chờ xác nhận",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    },
    Confirmed: {
        label: "Đã xác nhận",
        badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-300",
    },
    Processing: {
        label: "Đang xử lý",
        badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
    },
    Shipped: {
        label: "Đang giao",
        badgeClass: "bg-violet-100 text-violet-800 border-violet-300",
    },
    Delivered: {
        label: "Đã giao",
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    },
    Completed: {
        label: "Hoàn tất",
        badgeClass: "bg-green-100 text-green-800 border-green-300",
    },
    Cancelled: {
        label: "Đã hủy",
        badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    },
}

export function getOrderStatusMeta(status: string) {
    const normalized = status as OrderStatus
    return (
        ORDER_STATUS_META[normalized] ?? {
            label: status,
            badgeClass: "bg-gray-100 text-gray-700 border-gray-300",
        }
    )
}

export function normalizeTier(tier: unknown) {
    return String(tier ?? "").toLowerCase()
}

export function getTierLabel(tier: unknown) {
    const normalized = normalizeTier(tier)
    if (normalized === "4" || normalized === "platinum") return "Platinum"
    if (normalized === "3" || normalized === "gold") return "Gold"
    if (normalized === "2" || normalized === "silver") return "Silver"
    return "Standard"
}

export function getTierBadgeClass(tier: unknown) {
    switch (normalizeTier(tier)) {
        case "4":
        case "platinum":
            return "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300"
        case "3":
        case "gold":
            return "bg-amber-100 text-amber-800 border-amber-300"
        case "2":
        case "silver":
            return "bg-slate-100 text-slate-800 border-slate-300"
        default:
            return "bg-sky-100 text-sky-800 border-sky-300"
    }
}

export function getVoucherStatusBadgeClass(isActive: boolean) {
    return isActive
        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
        : "bg-zinc-200 text-zinc-800 border-zinc-300"
}

export function getSaleCampaignStatusMeta(
    isRunning: boolean,
    isUpcoming: boolean,
) {
    if (isRunning) {
        return {
            label: "Đang diễn ra",
            badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
        }
    }

    if (isUpcoming) {
        return {
            label: "Sắp diễn ra",
            badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-300",
        }
    }

    return {
        label: "Đã kết thúc",
        badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    }
}
