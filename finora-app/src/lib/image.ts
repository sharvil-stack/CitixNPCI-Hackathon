// The Spring Boot service accepts uploads of about 1 MB by default (its multipart limit is not raised in application.properties).
// Larger screenshots are downscaled / re-encoded in the browser so the upload does not fail.
export const SAFE_UPLOAD_BYTES = 900 * 1024;

export async function shrinkImage(file: File, maxBytes = SAFE_UPLOAD_BYTES): Promise<{ blob: Blob; name: string; resized: boolean }> {
  if (file.size <= maxBytes) return { blob: file, name: file.name, resized: false };
  const bmp = await createImageBitmap(file);
  let scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
  for (let attempt = 0; attempt < 6; attempt++) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * scale)); c.height = Math.max(1, Math.round(bmp.height * scale));
    const ctx = c.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(bmp, 0, 0, c.width, c.height);
    for (const q of [0.9, 0.8, 0.7, 0.6]) {
      const blob: Blob | null = await new Promise((r) => c.toBlob(r, 'image/jpeg', q));
      if (blob && blob.size <= maxBytes) return { blob, name: file.name.replace(/\.\w+$/, '') + '.jpg', resized: true };
    }
    scale *= 0.75;
  }
  throw new Error('This image is too large to upload. Please crop it or use a smaller screenshot.');
}
