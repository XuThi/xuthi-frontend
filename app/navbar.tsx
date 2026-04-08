import { cacheLife } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import { commerce } from "@/lib/commerce";
import { NavbarClient } from "@/app/navbar-client";

export async function Navbar() {
	"use cache";
	cacheLife("hours");

	const [categoriesResult, salesResult] = await Promise.all([
		commerce.collectionBrowse({ limit: 20 }),
		commerce.saleCampaignBrowse({ isActive: true, pageSize: 10 }),
	]);

	const categories = categoriesResult.data;
	const saleCampaigns = salesResult.data;

	return (
		<NavbarClient
			categories={categories}
			saleCampaigns={saleCampaigns}
		/>
	);
}
