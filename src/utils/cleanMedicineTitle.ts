/**
 * Sanitizes medicine display titles by removing company names, packing quantities, and bracket postfixes like (Tablet 10 TAB...)
 */
export function sanitizeMedicineDisplayTitle(rawName: string): string {
  if (!rawName) return '';
  let name = rawName.trim();

  // 1. Remove all nested/repeated bracket postfixes e.g. (Tablet 10 TAB...), (Cipla), (Sun Pharma), (Tablet), (Tab)
  let prev;
  do {
    prev = name;
    name = name.replace(/\s*\([^)]*\)?/gi, '');
  } while (name !== prev);

  // Remove orphan closing/opening brackets
  name = name.replace(/[\(\)]+/g, ' ');

  // 2. Remove company/brand postfixes
  name = name.replace(/[\s\-\,]+(sun pharma|cipla|lupin|torrent|glenmark|mankind|alkem|intas|abbott|zydus|micro labs|ipca|cadila|dr reddy|pfizer|glaxo|sanofi|bayer|macleods|leeford|hetero|emcure|cachet|blue cross|apex|aristo|troikaa|biocon|astrazeneca)\b.*/gi, '');

  // 3. Remove packing quantities like "10 TAB", "10 Caps", "10'S", "15'S", "100 ML", "20 GM", "1 KIT"
  name = name.replace(/\b\d+\s*(x\d+|\'s|s|tab|tabs|tablet|tablets|cap|caps|capsule|capsules|strip|strips|ml|gm|gram|grams|kit|kits|vial|vials|amp|ampoule|amp-2ml|amp-1ml)\b.*/gi, '');

  // 4. Clean up multiple spaces and trailing punctuation
  name = name.replace(/\s+/g, ' ').replace(/^[\s\-./\\]+/, '').replace(/[\s\-./\\:]+$/, '').trim();

  return name.trim();
}
