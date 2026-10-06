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
  return (
    <span className={"product-thumbnail " + className}>
      {photoUrl && failedUrl !== photoUrl ? (
        <Image src={photoUrl} alt={title} width={144} height={144}
          unoptimized onError={() => setFailedUrl(photoUrl)} />
      ) : (
        <span className="product-thumbnail-fallback">
          <ImageOff aria-hidden="true" size={22} strokeWidth={1.6} />
          <span>Sin foto</span>
        </span>
      )}
    </span>
  );
}
