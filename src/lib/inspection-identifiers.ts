export interface InspectionIdentifiers {
  assetNumber: string;
  osNumber: string | null;
}

/**
 * Older records may have the asset and work order stored in the opposite
 * columns. Work orders are larger than asset numbers in this system, so use
 * that rule to normalize numeric pairs and numeric/non-numeric reversals.
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

  if (assetIsNumeric && !osIsNumeric) {
    return { assetNumber: os, osNumber: asset };
  }

  if (assetIsNumeric && osIsNumeric && Number(os) <= Number(asset)) {
    return { assetNumber: os, osNumber: asset };
  }

  return { assetNumber: asset, osNumber: os };
}
