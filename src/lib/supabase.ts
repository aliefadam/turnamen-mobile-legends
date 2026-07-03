import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const PROOF_BUCKET = "payment-proofs";

let cached: SupabaseClient | null | undefined;

/** Server-side admin client (service role). Returns null if not configured. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    cached = null;
    return null;
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tim"
  );
}

/**
 * Upload a payment proof file to Supabase Storage.
 * Returns the stored object path, or null on failure / not configured.
 */
export async function uploadPaymentProof(
  file: File,
  teamName: string
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const ext = (file.name.split(".").pop() || "png")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const path = `${Date.now()}-${slug(teamName)}.${ext || "png"}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(PROOF_BUCKET)
      .upload(path, buffer, {
        contentType: file.type || "image/png",
        upsert: false,
      });
    if (error) {
      console.error("uploadPaymentProof failed:", error.message);
      return null;
    }
    return path;
  } catch (error) {
    console.error("uploadPaymentProof error:", error);
    return null;
  }
}

/** Remove a payment proof object from storage (no-op if not configured). */
export async function removePaymentProof(path: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !path) return;
  try {
    await supabase.storage.from(PROOF_BUCKET).remove([path]);
  } catch (error) {
    console.error("removePaymentProof error:", error);
  }
}

/**
 * Create short-lived signed URLs for a set of proof object paths.
 * Returns a map { path -> signedUrl }.
 */
export async function getSignedProofUrls(
  paths: string[]
): Promise<Record<string, string>> {
  const supabase = getSupabaseAdmin();
  if (!supabase || paths.length === 0) return {};

  try {
    const { data, error } = await supabase.storage
      .from(PROOF_BUCKET)
      .createSignedUrls(paths, 60 * 60); // 1 hour
    if (error || !data) return {};
    const map: Record<string, string> = {};
    for (const item of data) {
      if (item.signedUrl && item.path) map[item.path] = item.signedUrl;
    }
    return map;
  } catch (error) {
    console.error("getSignedProofUrls error:", error);
    return {};
  }
}
