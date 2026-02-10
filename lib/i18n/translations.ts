/**
 * Vietnamese translations for XuThi e-commerce
 * Default language is Vietnamese with English fallback available
 */

export const translations = {
	vi: {
		// Navigation
		nav: {
			home: "Trang chủ",
			products: "Sản phẩm",
			categories: "Danh mục",
			collections: "Bộ sưu tập",
			brands: "Thương hiệu",
			about: "Giới thiệu",
			contact: "Liên hệ",
			search: "Tìm kiếm",
			account: "Tài khoản",
			login: "Đăng nhập",
			register: "Đăng ký",
			logout: "Đăng xuất",
		},

		// Cart
		cart: {
			title: "Giỏ hàng",
			yourCart: "Giỏ hàng của bạn",
			empty: "Giỏ hàng trống",
			emptyDescription: "Thêm sản phẩm để bắt đầu mua sắm",
			items: "sản phẩm",
			subtotal: "Tạm tính",
			total: "Tổng cộng",
			checkout: "Thanh toán",
			continueShopping: "Tiếp tục mua sắm",
			addToCart: "Thêm vào giỏ",
			adding: "Đang thêm...",
			selectOptions: "Chọn tùy chọn",
			shippingNote: "Phí vận chuyển và thuế được tính khi thanh toán",
			remove: "Xóa",
			quantity: "Số lượng",
		},

		// Product
		product: {
			price: "Giá",
			originalPrice: "Giá gốc",
			salePrice: "Giá sale",
			inStock: "Còn hàng",
			outOfStock: "Hết hàng",
			sku: "Mã SKU",
			category: "Danh mục",
			brand: "Thương hiệu",
			description: "Mô tả",
			specifications: "Thông số kỹ thuật",
			reviews: "Đánh giá",
			relatedProducts: "Sản phẩm liên quan",
			viewDetails: "Xem chi tiết",
		},

		// Common
		common: {
			loading: "Đang tải...",
			error: "Đã có lỗi xảy ra",
			retry: "Thử lại",
			cancel: "Hủy",
			save: "Lưu",
			delete: "Xóa",
			edit: "Sửa",
			create: "Tạo mới",
			update: "Cập nhật",
			search: "Tìm kiếm",
			filter: "Lọc",
			sort: "Sắp xếp",
			all: "Tất cả",
			none: "Không có",
			yes: "Có",
			no: "Không",
			confirm: "Xác nhận",
			back: "Quay lại",
			next: "Tiếp theo",
			previous: "Trước",
			viewAll: "Xem tất cả",
			seeMore: "Xem thêm",
			showLess: "Thu gọn",
		},

		// Checkout
		checkout: {
			title: "Thanh toán",
			shippingInfo: "Thông tin giao hàng",
			paymentMethod: "Phương thức thanh toán",
			orderSummary: "Tóm tắt đơn hàng",
			placeOrder: "Đặt hàng",
			processing: "Đang xử lý...",
			fullName: "Họ và tên",
			phone: "Số điện thoại",
			email: "Email",
			address: "Địa chỉ",
			city: "Thành phố",
			district: "Quận/Huyện",
			ward: "Phường/Xã",
			notes: "Ghi chú",
			shippingFee: "Phí vận chuyển",
			discount: "Giảm giá",
			voucher: "Mã giảm giá",
			applyVoucher: "Áp dụng",
		},

		// Order
		order: {
			title: "Đơn hàng",
			orderHistory: "Lịch sử đơn hàng",
			orderNumber: "Mã đơn hàng",
			orderDate: "Ngày đặt",
			status: "Trạng thái",
			details: "Chi tiết đơn hàng",
			trackOrder: "Theo dõi đơn hàng",
			statuses: {
				pending: "Chờ xử lý",
				confirmed: "Đã xác nhận",
				processing: "Đang xử lý",
				shipping: "Đang giao hàng",
				delivered: "Đã giao hàng",
				cancelled: "Đã hủy",
				returned: "Đã hoàn trả",
			},
		},

		// Account
		account: {
			title: "Tài khoản",
			profile: "Thông tin cá nhân",
			orders: "Đơn hàng của tôi",
			addresses: "Sổ địa chỉ",
			wishlist: "Sản phẩm yêu thích",
			settings: "Cài đặt",
			changePassword: "Đổi mật khẩu",
		},

		// Auth
		auth: {
			login: "Đăng nhập",
			register: "Đăng ký",
			forgotPassword: "Quên mật khẩu?",
			resetPassword: "Đặt lại mật khẩu",
			email: "Email",
			password: "Mật khẩu",
			confirmPassword: "Xác nhận mật khẩu",
			rememberMe: "Ghi nhớ đăng nhập",
			orContinueWith: "Hoặc tiếp tục với",
			alreadyHaveAccount: "Đã có tài khoản?",
			dontHaveAccount: "Chưa có tài khoản?",
		},

		// Trust badges
		trust: {
			freeShipping: "Miễn phí vận chuyển",
			freeShippingDesc: "Đơn hàng từ 500.000₫",
			securePayment: "Thanh toán an toàn",
			securePaymentDesc: "Bảo mật 100%",
			quality: "Chất lượng đảm bảo",
			qualityDesc: "Sản phẩm chính hãng",
			support: "Hỗ trợ 24/7",
			supportDesc: "Luôn sẵn sàng hỗ trợ",
		},

		// Footer
		footer: {
			about: "Về chúng tôi",
			policies: "Chính sách",
			support: "Hỗ trợ",
			contact: "Liên hệ",
			newsletter: "Đăng ký nhận tin",
			newsletterDesc: "Nhận thông tin khuyến mãi mới nhất",
			subscribe: "Đăng ký",
			privacyPolicy: "Chính sách bảo mật",
			termsOfService: "Điều khoản sử dụng",
			returnPolicy: "Chính sách đổi trả",
			shippingPolicy: "Chính sách vận chuyển",
			copyright: "© 2026 XuThi. Đã đăng ký bản quyền.",
		},
	},

	en: {
		// Navigation
		nav: {
			home: "Home",
			products: "Products",
			categories: "Categories",
			collections: "Collections",
			brands: "Brands",
			about: "About",
			contact: "Contact",
			search: "Search",
			account: "Account",
			login: "Login",
			register: "Register",
			logout: "Logout",
		},

		// Cart
		cart: {
			title: "Cart",
			yourCart: "Your Cart",
			empty: "Your cart is empty",
			emptyDescription: "Add some products to get started",
			items: "items",
			subtotal: "Subtotal",
			total: "Total",
			checkout: "Checkout",
			continueShopping: "Continue Shopping",
			addToCart: "Add to Cart",
			adding: "Adding...",
			selectOptions: "Select options",
			shippingNote: "Shipping and taxes calculated at checkout",
			remove: "Remove",
			quantity: "Quantity",
		},

		// Product
		product: {
			price: "Price",
			originalPrice: "Original Price",
			salePrice: "Sale Price",
			inStock: "In Stock",
			outOfStock: "Out of Stock",
			sku: "SKU",
			category: "Category",
			brand: "Brand",
			description: "Description",
			specifications: "Specifications",
			reviews: "Reviews",
			relatedProducts: "Related Products",
			viewDetails: "View Details",
		},

		// Common
		common: {
			loading: "Loading...",
			error: "An error occurred",
			retry: "Retry",
			cancel: "Cancel",
			save: "Save",
			delete: "Delete",
			edit: "Edit",
			create: "Create",
			update: "Update",
			search: "Search",
			filter: "Filter",
			sort: "Sort",
			all: "All",
			none: "None",
			yes: "Yes",
			no: "No",
			confirm: "Confirm",
			back: "Back",
			next: "Next",
			previous: "Previous",
			viewAll: "View All",
			seeMore: "See More",
			showLess: "Show Less",
		},

		// Checkout
		checkout: {
			title: "Checkout",
			shippingInfo: "Shipping Information",
			paymentMethod: "Payment Method",
			orderSummary: "Order Summary",
			placeOrder: "Place Order",
			processing: "Processing...",
			fullName: "Full Name",
			phone: "Phone",
			email: "Email",
			address: "Address",
			city: "City",
			district: "District",
			ward: "Ward",
			notes: "Notes",
			shippingFee: "Shipping Fee",
			discount: "Discount",
			voucher: "Voucher Code",
			applyVoucher: "Apply",
		},

		// ... English translations continue
		order: {
			title: "Orders",
			orderHistory: "Order History",
			orderNumber: "Order Number",
			orderDate: "Order Date",
			status: "Status",
			details: "Order Details",
			trackOrder: "Track Order",
			statuses: {
				pending: "Pending",
				confirmed: "Confirmed",
				processing: "Processing",
				shipping: "Shipping",
				delivered: "Delivered",
				cancelled: "Cancelled",
				returned: "Returned",
			},
		},

		account: {
			title: "Account",
			profile: "Profile",
			orders: "My Orders",
			addresses: "Address Book",
			wishlist: "Wishlist",
			settings: "Settings",
			changePassword: "Change Password",
		},

		auth: {
			login: "Login",
			register: "Register",
			forgotPassword: "Forgot Password?",
			resetPassword: "Reset Password",
			email: "Email",
			password: "Password",
			confirmPassword: "Confirm Password",
			rememberMe: "Remember Me",
			orContinueWith: "Or continue with",
			alreadyHaveAccount: "Already have an account?",
			dontHaveAccount: "Don't have an account?",
		},

		trust: {
			freeShipping: "Free Shipping",
			freeShippingDesc: "Orders over 500,000₫",
			securePayment: "Secure Payment",
			securePaymentDesc: "100% Secure",
			quality: "Quality Guarantee",
			qualityDesc: "Authentic Products",
			support: "24/7 Support",
			supportDesc: "Always here to help",
		},

		footer: {
			about: "About Us",
			policies: "Policies",
			support: "Support",
			contact: "Contact",
			newsletter: "Newsletter",
			newsletterDesc: "Get the latest promotions",
			subscribe: "Subscribe",
			privacyPolicy: "Privacy Policy",
			termsOfService: "Terms of Service",
			returnPolicy: "Return Policy",
			shippingPolicy: "Shipping Policy",
			copyright: "© 2026 XuThi. All rights reserved.",
		},
	},
} as const;

// Current language setting
export const currentLanguage = "vi" as const;

// Get translations for current language
export function t(key: string): string {
	const keys = key.split(".");
	let value: unknown = translations[currentLanguage];
	
	for (const k of keys) {
		if (value && typeof value === "object" && k in value) {
			value = (value as Record<string, unknown>)[k];
		} else {
			// Fallback to English
			value = translations.en;
			for (const ek of keys) {
				if (value && typeof value === "object" && ek in value) {
					value = (value as Record<string, unknown>)[ek];
				} else {
					return key; // Return key if not found
				}
			}
			break;
		}
	}
	
	return typeof value === "string" ? value : key;
}

// Export specific translation sections for type safety
export const navT = translations[currentLanguage].nav;
export const cartT = translations[currentLanguage].cart;
export const productT = translations[currentLanguage].product;
export const commonT = translations[currentLanguage].common;
export const checkoutT = translations[currentLanguage].checkout;
export const orderT = translations[currentLanguage].order;
export const accountT = translations[currentLanguage].account;
export const authT = translations[currentLanguage].auth;
export const trustT = translations[currentLanguage].trust;
export const footerT = translations[currentLanguage].footer;
