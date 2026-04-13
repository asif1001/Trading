import "server-only";

import { headers } from "next/headers";
import { adminAuth } from "@/lib/firebase/firebaseAdmin";

export async function requireIdToken() {
  const h = await headers();
  const authHeader = h.get("authorization") || "";
  const match = authHeader.match(/^Bearer (.+)$/i);
  if (!match) {
    throw new Error("Missing Authorization Bearer token");
  }

  const token = match[1]!;
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded;
}
