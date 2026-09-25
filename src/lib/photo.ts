const MAX_BYTES = 700 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type PhotoFile = { contentType: string; data: Buffer };

export async function readPhoto(formData: FormData): Promise<PhotoFile | null> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!TYPES.has(file.type)) {
    throw new Error("La photo doit être un JPEG, PNG, WebP ou GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La photo dépasse 700 Ko.");
  }
  return { contentType: file.type, data: Buffer.from(await file.arrayBuffer()) };
}
