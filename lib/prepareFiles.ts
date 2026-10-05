// Runs in the browser. Shrinks photos so a phone picture (often 4–8 MB) fits under
// the 4.5 MB request limit, and turns everything into base64 for the API.

export const MAX_IMAGES = 4;
export const MAX_PDF_BYTES = 4 * 1024 * 1024;
const MAX_SIDE = 1600;

export type PreparedFile = { mediaType: string; data: string; name: string };
export type PrepareResult = { ok: true; files: PreparedFile[] } | { ok: false; error: 'too_long' | 'bad_input' };

function toBase64(buf: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function shrinkImage(file: File): Promise<PreparedFile> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', 0.82),
  );
  return { mediaType: 'image/jpeg', data: toBase64(await blob.arrayBuffer()), name: file.name };
}

export async function prepareFiles(list: FileList | File[]): Promise<PrepareResult> {
  const files = Array.from(list);
  if (files.length === 0) return { ok: false, error: 'bad_input' };

  const pdfs = files.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
  if (pdfs.length > 0) {
    if (files.length > 1) return { ok: false, error: 'too_long' };
    if (pdfs[0].size > MAX_PDF_BYTES) return { ok: false, error: 'too_long' };
    return {
      ok: true,
      files: [{ mediaType: 'application/pdf', data: toBase64(await pdfs[0].arrayBuffer()), name: pdfs[0].name }],
    };
  }

  if (files.length > MAX_IMAGES) return { ok: false, error: 'too_long' };
  try {
    return { ok: true, files: await Promise.all(files.map(shrinkImage)) };
  } catch {
    // e.g. a HEIC photo the browser can't decode
    return { ok: false, error: 'bad_input' };
  }
}
