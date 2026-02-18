import Image from "next/image"
import { notFound } from "next/navigation"
import { commerce } from "@/lib/commerce"
import { AppLink } from "@/components/app-link"

export default async function CollectionsPage() {
    const { data: categories } = await commerce.collectionBrowse({})

    if (!categories || categories.length === 0) {
        notFound()
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-10">
                <h1 className="text-3xl sm:text-4xl font-semibold">
                    Bo suu tap
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Kham pha cac danh muc san pham noi bat.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((category) => (
                    <AppLink
                        prefetch={false}
                        key={category.id}
                        href={`/collection/${category.slug}`}
                        className="group rounded-2xl border border-border overflow-hidden bg-background"
                    >
                        <div className="relative aspect-[4/3] bg-secondary">
                            {category.image ? (
                                <Image
                                    src={category.image}
                                    alt={category.name}
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="h-full w-full bg-secondary" />
                            )}
                        </div>
                        <div className="p-5">
                            <h2 className="text-lg font-semibold text-foreground">
                                {category.name}
                            </h2>
                            {category.description && (
                                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                    {typeof category.description === "string"
                                        ? category.description
                                        : ""}
                                </p>
                            )}
                            <p className="mt-3 text-sm text-muted-foreground">
                                {category.productCount ?? 0} san pham
                            </p>
                        </div>
                    </AppLink>
                ))}
            </div>
        </main>
    )
}
