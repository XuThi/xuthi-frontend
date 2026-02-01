"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

// Support both old YNS format and new API format
type Variant = {
	id: string;
	// Old YNS format
	combinations?: {
		variantValue: {
			id: string;
			value: string;
			colorValue: string | null;
			variantType: {
				id: string;
				type: "string" | "color";
				label: string;
			};
		};
	}[];
	// New API format
	attributes?: Record<string, string>;
};

type VariantOption = {
	id: string;
	value: string;
	colorValue: string | null;
};

type VariantGroup = {
	label: string;
	type: "string" | "color";
	options: VariantOption[];
};

type VariantSelectorProps = {
	variants: Variant[];
	selectedVariantId: string | undefined;
};

function processVariants(variants: Variant[]): VariantGroup[] {
	// Check if we have new API format (attributes) or old format (combinations)
	const hasAttributes = variants.some((v) => v.attributes && Object.keys(v.attributes).length > 0);
	const hasCombinations = variants.some((v) => v.combinations && v.combinations.length > 0);

	if (hasAttributes) {
		// New API format - extract unique values per attribute key
		const attributeGroups = new Map<string, Set<string>>();

		for (const variant of variants) {
			if (variant.attributes) {
				for (const [key, value] of Object.entries(variant.attributes)) {
					if (!attributeGroups.has(key)) {
						attributeGroups.set(key, new Set());
					}
					attributeGroups.get(key)!.add(value);
				}
			}
		}

		// Convert to VariantGroup format
		return Array.from(attributeGroups.entries()).map(([label, values]) => ({
			label,
			type: "string" as const, // Default to string type for new format
			options: Array.from(values).map((value) => ({
				id: value, // Use value as ID for new format
				value,
				colorValue: null,
			})),
		}));
	}

	if (hasCombinations) {
		// Old YNS format - process combinations
		const allCombinations = variants.flatMap((variant) =>
			(variant.combinations || []).map((combination) => ({
				variantValue: combination.variantValue,
			})),
		);

		const seenOptionIds = new Map<string, Set<string>>();

		const groupedByLabel = allCombinations.reduce(
			(acc, { variantValue }) => {
				const { label, type } = variantValue.variantType;

				if (!acc[label]) {
					acc[label] = {
						label,
						type,
						options: [],
					};
					seenOptionIds.set(label, new Set());
				}

				const seenIds = seenOptionIds.get(label);
				if (seenIds && !seenIds.has(variantValue.id)) {
					seenIds.add(variantValue.id);
					acc[label].options.push({
						id: variantValue.id,
						value: variantValue.value,
						colorValue: variantValue.colorValue,
					});
				}

				return acc;
			},
			{} as Record<string, VariantGroup>,
		);

		return Object.values(groupedByLabel);
	}

	return [];
}

export function VariantSelector({ variants, selectedVariantId }: VariantSelectorProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const variantGroups = processVariants(variants);

	// Check which format we're using
	const hasAttributes = variants.some((v) => v.attributes && Object.keys(v.attributes).length > 0);

	// Build Maps for O(1) lookups
	const { optionsByValue, optionsById } = useMemo(() => {
		const optionsByValue = new Map(
			variantGroups.map((g) => [g.label, new Map(g.options.map((o) => [o.value, o]))]),
		);
		const optionsById = new Map(
			variantGroups.map((g) => [g.label, new Map(g.options.map((o) => [o.id, o]))]),
		);
		return { optionsByValue, optionsById };
	}, [variantGroups]);

	const selectedOptions = useMemo(() => {
		const paramsOptions: Record<string, string> = {};
		searchParams.forEach((valueName, key) => {
			const option = optionsByValue.get(key)?.get(valueName);
			if (option) {
				paramsOptions[key] = option.id;
			}
		});
		return paramsOptions;
	}, [searchParams, optionsByValue]);

	const handleOptionSelect = (label: string, optionId: string) => {
		const newSelectedOptions = { ...selectedOptions, [label]: optionId };

		const params = Object.entries(newSelectedOptions).reduce((acc, [key, value]) => {
			const option = optionsById.get(key)?.get(value);
			if (option) {
				acc.set(key, option.value);
			}
			return acc;
		}, new URLSearchParams());
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	};

	// Auto-redirect to first variant when no URL params exist (for multi-variant products)
	useEffect(() => {
		if (variants.length <= 1 || searchParams.size > 0) return;

		const firstVariant = variants[0];
		const params = new URLSearchParams();

		if (hasAttributes && firstVariant.attributes) {
			// New API format
			for (const [key, value] of Object.entries(firstVariant.attributes)) {
				params.set(key, value);
			}
		} else if (firstVariant.combinations) {
			// Old YNS format
			firstVariant.combinations.forEach((c) => {
				params.set(c.variantValue.variantType.label, c.variantValue.value);
			});
		}

		if (params.toString()) {
			router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		}
	}, [variants, searchParams.size, pathname, hasAttributes]);

	if (variantGroups.length === 0) {
		return null;
	}

	return (
		<div className="space-y-8">
			{variantGroups.map((group) => {
				const selectedOptionId = selectedOptions[group.label];
				const selectedOption = selectedOptionId
					? optionsById.get(group.label)?.get(selectedOptionId)
					: undefined;

				return (
					<div key={group.label}>
						{group.type === "color" ? (
							<>
								<div className="mb-3 flex items-center justify-between">
									<span className="text-sm font-medium">{group.label}</span>
									{selectedOption && (
										<span className="text-sm text-muted-foreground">{selectedOption.value}</span>
									)}
								</div>
								<div className="flex gap-3">
									{group.options.map((option) => {
										const isSelected = selectedOptions[group.label] === option.id;
										const isLightColor =
											option.colorValue?.toUpperCase() === "#FFFFFF" ||
											option.colorValue?.toUpperCase() === "#FFFFF0" ||
											option.colorValue?.toUpperCase() === "#FFF";

										return (
											<button
												key={option.id}
												type="button"
												onClick={() => handleOptionSelect(group.label, option.id)}
												className={cn(
													"relative h-12 w-12 rounded-full transition-all duration-200",
													isSelected
														? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
														: "hover:ring-2 hover:ring-muted-foreground hover:ring-offset-2 hover:ring-offset-background",
												)}
												style={{ backgroundColor: option.colorValue ?? "#fff" }}
												aria-label={option.value}
												title={option.value}
											>
												{isLightColor && (
													<span className="absolute inset-0 rounded-full border border-border" />
												)}
											</button>
										);
									})}
								</div>
							</>
						) : (
							<>
								<div className="mb-3 flex items-center justify-between">
									<span className="text-sm font-medium">{group.label}</span>
								</div>
								<div className="flex flex-wrap gap-3">
									{group.options.map((option) => {
										const isSelected = selectedOptions[group.label] === option.id;

										return (
											<button
												key={option.id}
												type="button"
												onClick={() => handleOptionSelect(group.label, option.id)}
												className={cn(
													"flex flex-col items-center rounded-lg border-2 px-6 py-3 transition-all duration-200",
													isSelected
														? "border-foreground bg-foreground text-primary-foreground"
														: "border-border bg-background hover:border-muted-foreground",
												)}
											>
												<span className="text-sm font-medium">{option.value}</span>
											</button>
										);
									})}
								</div>
							</>
						)}
					</div>
				);
			})}
		</div>
	);
}
