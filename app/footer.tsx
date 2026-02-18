import { cacheLife } from "next/cache";
import { AppLink } from "@/components/app-link";
import { commerce } from "@/lib/commerce";
import Image from "next/image";

const LOGO_URL = "https://res.cloudinary.com/dxlhncwp0/image/upload/v1769941817/logo_qlelti.svg";

export async function Footer() {
	"use cache";
	cacheLife("hours");

	const categories = await commerce.collectionBrowse({ limit: 6 });

	return (
		<footer className="bg-gray-950 text-gray-300">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
					{/* Brand Section */}
					<div className="lg:col-span-1">
						<AppLink href="/" className="inline-flex items-center gap-3 mb-4 group">
							<Image
								src={LOGO_URL}
								alt="XuThi Store"
								width={40}
								height={40}
								className="group-hover:scale-110 transition-transform"
							/>
							<span className="text-xl font-bold text-white">XuThi Store</span>
						</AppLink>
						<p className="text-sm text-gray-400 leading-relaxed mb-4">
							Thời trang chất lượng cao, phong cách hiện đại. Cam kết mang đến
							trải nghiệm mua sắm tuyệt vời cho khách hàng.
						</p>
						<div className="flex gap-3">
							<a
								href="https://facebook.com"
								target="_blank"
								rel="noopener noreferrer"
								className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors"
								aria-label="Facebook"
							>
								<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
									<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
								</svg>
							</a>
							<a
								href="https://instagram.com"
								target="_blank"
								rel="noopener noreferrer"
								className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-600 transition-colors"
								aria-label="Instagram"
							>
								<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
									<path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z" />
								</svg>
							</a>
						</div>
					</div>

					{/* Categories */}
					<div>
						<h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
							Danh mục
						</h3>
						<ul className="space-y-3">
							{categories.data.map((category) => (
								<li key={category.id}>
									<AppLink
										href={`/collection/${category.slug}`}
										className="text-sm text-gray-400 hover:text-white transition-colors"
									>
										{category.name}
									</AppLink>
								</li>
							))}
						</ul>
					</div>

					{/* Customer Service */}
					<div>
						<h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
							Hỗ trợ
						</h3>
						<ul className="space-y-3">
							<li>
								<AppLink href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
									Về chúng tôi
								</AppLink>
							</li>
							<li>
								<AppLink href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
									Liên hệ
								</AppLink>
							</li>
							<li>
								<AppLink href="/shipping" className="text-sm text-gray-400 hover:text-white transition-colors">
									Chính sách vận chuyển
								</AppLink>
							</li>
							<li>
								<AppLink href="/returns" className="text-sm text-gray-400 hover:text-white transition-colors">
									Đổi trả & hoàn tiền
								</AppLink>
							</li>
							<li>
								<AppLink href="/faq" className="text-sm text-gray-400 hover:text-white transition-colors">
									Câu hỏi thường gặp
								</AppLink>
							</li>
						</ul>
					</div>

					{/* Contact Info */}
					<div>
						<h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
							Liên hệ
						</h3>
						<ul className="space-y-3 text-sm text-gray-400">
							<li className="flex items-start gap-2">
								<svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									<path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								<span>TP. Hồ Chí Minh, Việt Nam</span>
							</li>
							<li className="flex items-start gap-2">
								<svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
								</svg>
								<span>support@xuthi.store</span>
							</li>
							<li className="flex items-start gap-2">
								<svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
								</svg>
								<span>0123 456 789</span>
							</li>
						</ul>
					</div>
				</div>
			</div>

			{/* Bottom bar */}
			<div className="border-t border-gray-800">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
					<p className="text-xs text-gray-500">
						© {new Date().getFullYear()} XuThi Store. Tất cả quyền được bảo lưu.
					</p>
					<div className="flex gap-6">
						<AppLink href="/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
							Chính sách bảo mật
						</AppLink>
						<AppLink href="/terms" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
							Điều khoản sử dụng
						</AppLink>
					</div>
				</div>
			</div>
		</footer>
	);
}
