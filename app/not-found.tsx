import { AppLink } from "@/components/app-link";

export default function NotFound() {
	return (
		<main className="flex flex-col items-center justify-center min-h-[50vh] px-4">
			<div className="text-center space-y-6">
				<h1 className="text-6xl font-bold text-foreground">404</h1>
				<h2 className="text-2xl font-medium text-foreground">Page Not Found</h2>
				<p className="text-muted-foreground max-w-md">
					Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
				</p>
				<AppLink
					prefetch={"eager"}
					href="/"
					className="inline-flex items-center justify-center h-12 px-8 bg-foreground text-primary-foreground rounded-full text-base font-medium hover:bg-foreground/90 transition-colors"
				>
					Go Back Home
				</AppLink>
			</div>
		</main>
	);
}
