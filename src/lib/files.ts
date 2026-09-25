import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { PhotoFile } from "@/lib/photo";

function extension(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  return "jpg";
}

function publicBase() {
  return (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
}

function objectKey(candidateId: number, contentType: string) {
  return `candidates/${candidateId}.${extension(contentType)}`;
}

async function putWithBinding(key: string, photo: PhotoFile) {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.FILES) return null;
  await env.FILES.put(key, photo.data, {
    httpMetadata: { contentType: photo.contentType },
  });
  const base = (env.R2_PUBLIC_URL || publicBase()).replace(/\/$/, "");
  if (!base) throw new Error("R2_PUBLIC_URL est vide.");
  return `${base}/${key}`;
}

async function putWithS3(key: string, photo: PhotoFile) {
  const account = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const base = publicBase();
  if (!account || !accessKeyId || !secretAccessKey || !bucket || !base) {
    throw new Error("Les variables R2 sont incomplètes dans .env.");
  }
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${account}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: photo.data,
      ContentType: photo.contentType,
    }),
  );
  return `${base}/${key}`;
}

export async function storeCandidatePhoto(candidateId: number, photo: PhotoFile) {
  const key = objectKey(candidateId, photo.contentType);
  if (process.env.NODE_ENV === "development") {
    const stored = await putWithBinding(key, photo);
    if (!stored) throw new Error("Le stockage local de la photo a échoué.");
    return `/candidats/${candidateId}/photo`;
  }
  try {
    const fromBinding = await putWithBinding(key, photo);
    if (fromBinding) return fromBinding;
  } catch {
    // Le binding peut manquer : on passe par les clés S3.
  }
  return putWithS3(key, photo);
}
