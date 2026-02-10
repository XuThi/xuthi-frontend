"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/lib/api/types";

// Extended variant type that includes YNS combination format
type Variant = ProductVariant & {
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
	selectedVariant: Variant | undefined;
	onVariantChange: (variant: Variant | undefined) => void;
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

export type { Variant };

export function VariantSelector({ variants, selectedVariant, onVariantChange }: VariantSelectorProps) {
	const variantGroups = processVariants(variants);

	// Check which format we're using
	const hasAttributes = variants.some((v) => v.attributes && Object.keys(v.attributes).length > 0);

	// Track selected options (label -> value)
	const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
		// Initialize from first variant or selected variant
		const variant = selectedVariant || variants[0];
		if (!variant) return {};
		
		if (hasAttributes && variant.attributes) {
			return { ...variant.attributes };
		}
		
		if (variant.combinations) {
			const options: Record<string, string> = {};
			for (const c of variant.combinations) {
				options[c.variantValue.variantType.label] = c.variantValue.value;
			}
			return options;
		}
		
		return {};
	});

	// Find matching variant based on selected options
	const findMatchingVariant = useMemo(() => {
		return (options: Record<string, string>): Variant | undefined => {
			if (hasAttributes) {
				return variants.find((v) => {
					if (!v.attributes) return false;
					return Object.entries(options).every(
						([key, value]) => v.attributes?.[key] === value
					);
				});
			} else {
				return variants.find((v) =>
					v.combinations?.every(
						(c) => options[c.variantValue.variantType.label] === c.variantValue.value
					)
				);
			}
		};
	}, [variants, hasAttributes]);

	const handleOptionSelect = (label: string, value: string) => {
		const newOptions = { ...selectedOptions, [label]: value };
		setSelectedOptions(newOptions);
		
		// Find and notify parent of matching variant
		const matchingVariant = findMatchingVariant(newOptions);
		onVariantChange(matchingVariant);
	};

	if (variantGroups.length === 0) {
		return null;
	}

	return (
		<div className="space-y-8">
			{variantGroups.map((group) => {
				const selectedValue = selectedOptions[group.label];

				return (
					<div key={group.label}>
						{group.type === "color" ? (
							<>
								<div className="mb-3 flex items-center justify-between">
									<span className="text-sm font-medium">{group.label}</span>
									{selectedValue && (
										<span className="text-sm text-muted-foreground">{selectedValue}</span>
									)}
								</div>
								<div className="flex gap-3">
									{group.options.map((option) => {
										const isSelected = selectedValue === option.value;
										const isLightColor =
											option.colorValue?.toUpperCase() === "#FFFFFF" ||
											option.colorValue?.toUpperCase() === "#FFFFF0" ||
											option.colorValue?.toUpperCase() === "#FFF";

										return (
											<button
												key={option.id}
												type="button"
												onClick={() => handleOptionSelect(group.label, option.value)}
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
										const isSelected = selectedValue === option.value;

										return (
											<button
												key={option.id}
												type="button"
												onClick={() => handleOptionSelect(group.label, option.value)}
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
