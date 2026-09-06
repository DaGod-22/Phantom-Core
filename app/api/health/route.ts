import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "phantom-core",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
}
