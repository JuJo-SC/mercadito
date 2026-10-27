export type MarketplaceListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  imageUrls: string[];
  isDemo: boolean;
  createdAt: string;
  seller: { id: string; name: string | null; facultyName?: string | null };
};

export const conditionNames: Record<string, string> = {
  NEW: "Nuevo",
  LIKE_NEW: "Usado · Como nuevo",
  GOOD: "Usado · Buen estado",
  FAIR: "Usado · Con detalles",
};

export function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return "$" + price.toFixed(2);
  }
}

export function formatListingDate(value: string, includeYear = false) {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" as const } : {}),
  }).format(new Date(value)).replace(".", "");
}

export function fullListingDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "America/Mexico_City" }).format(new Date(value));
}
