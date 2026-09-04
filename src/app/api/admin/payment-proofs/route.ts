import { getAdminInfo } from "@/lib/admin-session";
import { getPaymentProof } from "@/lib/netlify-storage";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await getAdminInfo())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!key || key.includes("..")) return Response.json({ error: "Invalid object key" }, { status: 400 });

  try {
    const result = await getPaymentProof(key);
    if (!result) return Response.json({ error: "File not found" }, { status: 404 });

    const contentType = typeof result.metadata.contentType === "string"
      ? result.metadata.contentType
      : result.data.type || "application/octet-stream";

    return new Response(result.data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("getPaymentProof route error:", error);
    return Response.json({ error: "Storage unavailable" }, { status: 503 });
  }
}
