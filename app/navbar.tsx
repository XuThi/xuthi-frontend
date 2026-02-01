import { cacheLife } from "next/cache";
import { AppLink } from "@/components/app-link";
import { commerce } from "@/lib/commerce";

export async function Navbar() {
	"use cache";
	cacheLife("hours");

	const categories = await commerce.collectionBrowse({ limit: 5 });

	if (categories.data.length === 0) {
		return null;
	}

	return (
		<nav className="hidden sm:flex items-center gap-6">
			<AppLink
				prefetch={"eager"}
				href="/"
				className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
			>
				Home
			</AppLink>
			{categories.data.map((category) => (
				<AppLink
					prefetch={"eager"}
					key={category.id}
					href={`/collection/${category.slug}`}
					className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
				>
					{category.name}
				</AppLink>
			))}
		</nav>
	);
}
