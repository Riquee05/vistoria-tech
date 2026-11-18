export interface InspectionIdentifiers {
  assetNumber: string;
  osNumber: string | null;
}

/**
 * Older records may have the asset and work order stored in opposite columns.
 * Keep alphanumeric work orders intact, while recognizing clear service-order
 * labels left in the asset column by the old reversal behavior.
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

  const assetLooksLikeWorkOrder = /^(?:chamado|ordem\s+de\s+servi[cç]o|o\.?s\.?|os\b|ch[-\s:#])/i.test(asset);
  if (assetLooksLikeWorkOrder && osIsNumeric) {
    return { assetNumber: os, osNumber: asset };
  }

  if (assetIsNumeric && osIsNumeric && Number(os) <= Number(asset)) {
    return { assetNumber: os, osNumber: asset };
  }

  return { assetNumber: asset, osNumber: os };
}
