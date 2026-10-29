"use client";

import Image from "next/image";
import { useState } from "react";
import type { ImageProps } from "next/image";

const FALLBACK_IMAGE = "/cars/car-image-fallback.svg";

type CarImageProps = Omit<ImageProps, "src"> & {
  alt: string;
  src?: string | null;
};

export function CarImage({ alt, src, ...props }: CarImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const imageSource = src?.trim() || FALLBACK_IMAGE;

  return (
    <Image
      {...props}
      alt={alt}
      onError={() => setFailedSource(imageSource)}
      src={failedSource === imageSource ? FALLBACK_IMAGE : imageSource}
    />
  );
}
