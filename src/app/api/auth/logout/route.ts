import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const opts = { path: "/", maxAge: 0 } as const;
  res.cookies.set("access_token", "", opts);
  res.cookies.set("refresh_token", "", opts);
  res.cookies.set("admin_access_token", "", opts);
  res.cookies.set("admin_refresh_token", "", opts);
  res.cookies.set("leiturista_access_token", "", opts);
  res.cookies.set("mfa_pending", "", opts);
  return res;
}
export async function GET() {
  return POST();
}
