export interface InspectionIdentifiers {
  assetNumber: string;
  osNumber: string | null;
}

/**
 * Older records with numeric identifiers may have the asset and work order
 * stored in the opposite columns. Never infer a swap from letters in the OS:
 * work orders and service calls can contain both letters and numbers.
 */
export function normalizeInspectionIdentifiers(
  assetNumber: string | null | undefined,
  osNumber: string | null | undefined,
): InspectionIdentifiers {
  const asset = String(assetNumber ?? '').trim();
  const os = String(osNumber ?? '').trim();

  if (!os) return { assetNumber: asset, osNumber: null };

  const assetIsNumeric = /^\d+$/.test(asset);
  const osIsNumeric = /^\d+$/.test(os);

  if (assetIsNumeric && osIsNumeric && Number(os) <= Number(asset)) {
    return { assetNumber: os, osNumber: asset };
  }

  return { assetNumber: asset, osNumber: os };
}
