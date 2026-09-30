import sharp from "sharp";
import {
  MAX_LISTING_PHOTOS,
  MAX_LISTING_PHOTO_BYTES,
  MAX_TOTAL_LISTING_PHOTO_BYTES,
} from "@/lib/listing-photo-limits";

const MAX_REQUEST_BYTES = MAX_TOTAL_LISTING_PHOTO_BYTES + 1024 * 1024;
const MAX_OUTPUT_BYTES = 1_200_000;
const MAX_INPUT_PIXELS = 40_000_000;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

export class ListingPhotoInputError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "ListingPhotoInputError";
  }
}

export async function parseListingMultipart(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    throw new ListingPhotoInputError("Envía los datos de la publicación en un formulario válido.", 415);
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const bytes = Number(declaredLength);
    if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > MAX_REQUEST_BYTES) {
      throw new ListingPhotoInputError("Las fotos y los datos no pueden superar 21 MB.", 413);
    }
  }

  const reader = request.body?.getReader();
  if (!reader) throw new ListingPhotoInputError("No recibimos los datos de la publicación.");

  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new ListingPhotoInputError("Las fotos y los datos no pueden superar 21 MB.", 413);
      }
      const copy = new Uint8Array(value.byteLength);
      copy.set(value);
      chunks.push(copy);
    }
  } finally {
    reader.releaseLock();
  }

  try {
    const replay = new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: new Blob(chunks),
    });
    return await replay.formData();
  } catch {
    throw new ListingPhotoInputError("No pudimos leer el formulario. Intenta de nuevo.");
  }
}

export async function parseListingPhotos(formData: FormData) {
  const entries = formData.getAll("photo");
  if (entries.length > MAX_LISTING_PHOTOS) {
    throw new ListingPhotoInputError("Puedes agregar hasta 5 fotos por publicación.");
  }

  const files: File[] = [];
  for (const entry of entries) {
    if (entry === "") continue;
    if (!(entry instanceof File)) {
      throw new ListingPhotoInputError("Uno de los archivos seleccionados no es una imagen válida.");
    }
    if (entry.size === 0) continue;
    if (entry.size > MAX_LISTING_PHOTO_BYTES) {
      throw new ListingPhotoInputError("Cada foto puede pesar hasta 8 MB.", 413);
    }
    files.push(entry);
  }

  if (files.length > MAX_LISTING_PHOTOS) {
    throw new ListingPhotoInputError("Puedes agregar hasta 5 fotos por publicación.");
  }
  const totalUploadBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalUploadBytes > MAX_TOTAL_LISTING_PHOTO_BYTES) {
    throw new ListingPhotoInputError("Las fotos pueden sumar hasta 20 MB. Quita una foto o elige archivos más ligeros.", 413);
  }

  const photos: { position: number; data: Uint8Array<ArrayBuffer>; width: number; height: number }[] = [];
  for (const file of files) {
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      throw new ListingPhotoInputError("Usa fotos JPG, PNG o WebP.");
    }

    const input = Buffer.from(await file.arrayBuffer());
    try {
      const metadata = await sharp(input, {
        failOn: "error",
        limitInputPixels: MAX_INPUT_PIXELS,
      }).metadata();
      if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
        throw new ListingPhotoInputError("Usa fotos JPG, PNG o WebP.");
      }
      if (!metadata.width || !metadata.height || (metadata.pages ?? 1) > 1) {
        throw new ListingPhotoInputError("Cada archivo debe ser una foto fija y legible.");
      }

      const output = await sharp(input, {
        failOn: "error",
        limitInputPixels: MAX_INPUT_PIXELS,
      })
        .rotate()
        .resize({ width: 1440, height: 1440, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer({ resolveWithObject: true });

      if (output.info.size > MAX_OUTPUT_BYTES) {
        throw new ListingPhotoInputError("Una foto sigue siendo muy pesada después de optimizarla.", 413);
      }

      photos.push({
        position: photos.length,
        data: new Uint8Array(output.data),
        width: output.info.width,
        height: output.info.height,
      });
    } catch (error) {
      if (error instanceof ListingPhotoInputError) throw error;
      throw new ListingPhotoInputError("No pudimos procesar una de esas fotos. Elige otra imagen.");
    }
  }

  return photos;
}
