export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-600">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
                <span>Đang tải...</span>
            </div>
        </div>
    )
}
