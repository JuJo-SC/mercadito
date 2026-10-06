import { cache } from "react";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { getActiveCommunity } from "@/features/community/lib/active-community";

// Public preview: only published items in the active campus, never seller data.
export const getLandingProducts = cache(async () => {
  const community = await getActiveCommunity();
  if (!community) return [];
  const listings = await prisma.listing.findMany({
    where: {
      universityId: community.id,
      status: "PUBLISHED",
      ...(community.isTest ? {} : { isDemo: false }),
    },
    orderBy: [{ isDemo: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: 8,
    select: {
      id: true, title: true, price: true, currency: true, isDemo: true,
      photos: { orderBy: { position: "asc" }, take: 1, select: { data: true } },
    },
  });
  return Promise.all(listings.map(async (listing) => {
    let image: string | null = null;
    if (listing.photos[0]) {
      try {
        const thumbnail = await sharp(listing.photos[0].data)
          .rotate().resize(440, 330, { fit: "cover", withoutEnlargement: true })
          .webp({ quality: 70 }).toBuffer();
        image = `data:image/webp;base64,${thumbnail.toString("base64")}`;
      } catch {
        // An invalid photo must not prevent the public landing from rendering.
      }
    }
    return {
      id: listing.id, title: listing.title, image, isDemo: listing.isDemo,
      price: new Intl.NumberFormat("es-MX", {
        style: "currency", currency: listing.currency, minimumFractionDigits: 0, maximumFractionDigits: 2,
      }).format(listing.price.toNumber()),
    };
  }));
});
