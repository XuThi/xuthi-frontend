"use client";

import { Component, type ReactNode } from "react";

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

/**
 * Error boundary that wraps the CartProviderWrapper.
 * If the cart fails to load (e.g., database cold start), the rest of the app
 * still renders — only the cart sidebar shows an error state.
 */
export class CartErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Cart loading error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex min-h-screen flex-col">
					<div className="flex-1">{/* Page content still renders */}</div>
					<div className="fixed bottom-4 right-4 rounded-lg border border-destructive bg-background p-4 shadow-lg z-50">
						<p className="text-sm text-destructive font-medium">
							Lỗi khi tải giỏ hàng
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							Vui lòng tải lại trang
						</p>
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="mt-2 text-xs underline text-foreground hover:text-primary"
						>
							Tải lại
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
