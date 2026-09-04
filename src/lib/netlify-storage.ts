import { getStore } from "@netlify/blobs";

export const PROOF_STORE = "payment-proofs";

function getProofStore() {
  return getStore({ name: PROOF_STORE, consistency: "strong" });
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tim";
}

export async function uploadPaymentProof(file: File, teamName: string): Promise<string | null> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const key = `${Date.now()}-${slug(teamName)}.${ext || "png"}`;

  try {
    const result = await getProofStore().set(key, file, {
      metadata: { contentType: file.type || "application/octet-stream" },
      onlyIfNew: true,
    });
    return result.modified ? key : null;
  } catch (error) {
    console.error("uploadPaymentProof error:", error);
    return null;
  }
}

export async function removePaymentProof(key: string): Promise<void> {
  if (!key) return;
  try {
    await getProofStore().delete(key);
  } catch (error) {
    console.error("removePaymentProof error:", error);
  }
}

export function getPaymentProofUrls(keys: string[]): Record<string, string> {
  return Object.fromEntries(keys.map((key) => [key, `/api/admin/payment-proofs?key=${encodeURIComponent(key)}`]));
}

export async function getPaymentProof(key: string) {
  if (!key) return null;
  return getProofStore().getWithMetadata(key, { type: "blob", consistency: "strong" });
}
