"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils";

/**
 * AppLink - Enhanced Next.js Link component with active state and eager prefetching
 */
export const AppLink = ({
	exactHrefMatch,
	activeClassName,
	className,
	prefetch,
	...props
}: Omit<ComponentPropsWithRef<typeof Link>, "prefetch"> & {
	exactHrefMatch?: boolean;
	activeClassName?: string;
	prefetch?: boolean | "eager";
}) => {
	const router = useRouter();
	const strHref = typeof props.href === "string" ? props.href : props.href.href;

	const pathname = usePathname();
	const isActive = strHref && (exactHrefMatch ? pathname === strHref : pathname.startsWith(strHref));

	const conditionalPrefetch = () => {
		if (strHref && prefetch === "eager") {
			void router.prefetch(strHref);
		}
	};

	return (
		<Link
			{...props}
			prefetch={!!prefetch}
			className={cn(className, isActive && activeClassName)}
			{...(strHref &&
				prefetch === "eager" && {
					onMouseEnter: (e) => {
						conditionalPrefetch();
						return props.onMouseEnter?.(e);
					},
					onPointerEnter: (e) => {
						conditionalPrefetch();
						return props.onPointerEnter?.(e);
					},
					onTouchStart: (e) => {
						conditionalPrefetch();
						return props.onTouchStart?.(e);
					},
					onFocus: (e) => {
						conditionalPrefetch();
						return props.onFocus?.(e);
					},
				})}
		/>
	);
};

// Backward compatibility alias
export const YnsLink = AppLink;
