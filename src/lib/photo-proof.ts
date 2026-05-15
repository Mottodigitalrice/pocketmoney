const MAX_PROOF_DIMENSION = 800;
const JPEG_QUALITY = 0.82;

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    image.src = url;
  });
}

function getOutputType(file: File) {
  if (file.type === "image/png" || file.type === "image/webp") {
    return file.type;
  }
  return "image/jpeg";
}

function getOutputName(file: File, outputType: string) {
  const extension = outputType === "image/png" ? "png" : outputType === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo-proof";
  return `${baseName}.${extension}`;
}

export async function resizeImageForProof(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Photo proof must be an image");
  }

  const image = await loadImage(file);
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = longestSide > MAX_PROOF_DIMENSION ? MAX_PROOF_DIMENSION / longestSide : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not resize image");
  }

  context.drawImage(image, 0, 0, width, height);

  const outputType = getOutputType(file);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Could not prepare image"));
      },
      outputType,
      outputType === "image/jpeg" ? JPEG_QUALITY : undefined
    );
  });

  return new File([blob], getOutputName(file, outputType), {
    type: outputType,
    lastModified: Date.now(),
  });
}

/**
 * F12 — Resilient upload error type.
 *
 * Thrown from `uploadProofWithRetry` when the storage URL returns a
 * retryable status (>= 500). Callers (JobCard) should catch and show a
 * Retry UI rather than a generic error.
 */
export class RetryablePhotoUploadError extends Error {
  readonly retryable = true;
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "RetryablePhotoUploadError";
    this.status = status;
  }
}

/** Detect aborts in a TypeScript-safe way (no `any`). */
export function isAbortError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (typeof err === "object" && "name" in err && (err as { name?: unknown }).name === "AbortError") {
    return true;
  }
  return false;
}

/**
 * F12 — In-flight upload registry.
 *
 * If complete is tapped twice quickly, the second call resolves to the same
 * promise the first call returned. Keyed by jobInstanceId.
 */
const inFlightUploads = new Map<string, Promise<UploadResult>>();

export interface UploadResult {
  storageId: string;
  fileName: string;
  contentType: string;
  size: number;
}

interface UploadProofOpts {
  /** AbortSignal — pass `controller.signal` from the caller. */
  signal?: AbortSignal;
  /** Used as the in-flight dedupe key. Typically `instanceId`. */
  dedupeKey: string;
  /** Resolves the destination upload URL (Convex generateProofUploadUrl). */
  getUploadUrl: () => Promise<string>;
}

/**
 * Upload a (already resized) proof file with:
 *   - AbortController support — abort cleanly without throwing back.
 *   - Retryable 5xx detection — throw `RetryablePhotoUploadError`.
 *   - In-flight dedupe — double-tap will await the same promise.
 *
 * The caller (JobCard) typically does:
 *   const resized = await resizeImageForProof(file);
 *   const result = await uploadProofWithRetry(resized, {
 *     dedupeKey: instanceId,
 *     getUploadUrl: () => generateProofUploadUrlMutation(),
 *     signal: controller.signal,
 *   });
 */
export async function uploadProofWithRetry(
  file: File,
  opts: UploadProofOpts
): Promise<UploadResult> {
  const existing = inFlightUploads.get(opts.dedupeKey);
  if (existing) return existing;

  const promise = (async (): Promise<UploadResult> => {
    const uploadUrl = await opts.getUploadUrl();
    let response: Response;
    try {
      response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
        signal: opts.signal,
      });
    } catch (err) {
      // AbortError: caller already unmounted. Fire-and-forget, no throw.
      if (isAbortError(err)) {
        // Resolve with a sentinel that the caller can detect, but since this
        // promise is awaited inside JobCard's try/catch we let it reject as
        // abort — JobCard treats abort as "no-op" specifically.
        throw err;
      }
      // Network-layer failure (no DNS / offline / TLS) — surface as retryable.
      throw new RetryablePhotoUploadError(
        err instanceof Error ? err.message : "network failure",
        0
      );
    }

    if (!response.ok) {
      // Convex storage URLs return 200/201 on success. Anything >= 500 is
      // server-side and retryable. 4xx is client-side (auth, size, bad URL)
      // and not retryable — surface as plain Error so the standard error
      // mapper handles it.
      if (response.status >= 500) {
        throw new RetryablePhotoUploadError(
          `Upload failed (${response.status})`,
          response.status
        );
      }
      throw new Error(`Photo proof upload rejected (${response.status})`);
    }

    const { storageId } = (await response.json()) as { storageId: string };
    return {
      storageId,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    };
  })();

  inFlightUploads.set(opts.dedupeKey, promise);
  try {
    return await promise;
  } finally {
    inFlightUploads.delete(opts.dedupeKey);
  }
}
