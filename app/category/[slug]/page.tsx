import { redirect } from "next/navigation"

export default async function CategoryAliasPage(props: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await props.params

    if (!slug || slug === "undefined") {
        redirect("/collection")
    }

    redirect(`/collection/${slug}`)
}
