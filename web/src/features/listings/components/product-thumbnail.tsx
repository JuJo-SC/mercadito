"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useState } from "react";

export function ProductThumbnail({ photoUrl, title, className = "" }: {
  photoUrl: string | null;
  title: string;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const thumbUrl = photoUrl
    ? photoUrl.includes("variant=")
      ? photoUrl
      : photoUrl + (photoUrl.includes("?") ? "&" : "?") + "variant=thumb"
    : null;

  return (
    <span className={"product-thumbnail " + className}>
      {thumbUrl && failedUrl !== photoUrl ? (
        <Image
          src={thumbUrl}
          alt={title}
          width={144}
          height={144}
          loading="lazy"
          decoding="async"
          unoptimized
          onError={() => setFailedUrl(photoUrl)}
        />
      ) : (
        <span className="product-thumbnail-fallback">
          <ImageOff aria-hidden="true" size={22} strokeWidth={1.6} />
          <span>Sin foto</span>
        </span>
      )}
    </span>
  );
}
