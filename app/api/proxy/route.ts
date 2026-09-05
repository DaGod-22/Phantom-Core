import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isPrivateHost(hostname: string) {
  const h = hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(h) || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (/^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true;
  return false;
}

function proxify(value: string, base: URL) {
  try {
    const u = new URL(value, base);
    if (!/^https?:$/.test(u.protocol)) return value;
    return `/api/proxy?url=${encodeURIComponent(u.href)}`;
  } catch {
    return value;
  }
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  let target: URL;
  try { target = new URL(raw); } catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }
  if (!/^https?:$/.test(target.protocol) || isPrivateHost(target.hostname)) {
    return NextResponse.json({ error: "Only public HTTP(S) destinations are allowed." }, { status: 403 });
  }

  try {
    const response = await fetch(target.href, {
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; PhantomCore/1.0; +https://vercel.com)",
        accept: "text/html,application/xhtml+xml,application/json,text/plain,*/*",
      },
      signal: AbortSignal.timeout(15000),
    });
    const type = response.headers.get("content-type") || "text/plain";
    const body = await response.text();

    if (type.includes("text/html") || body.trimStart().startsWith("<!doctype") || body.includes("<html")) {
      const $ = cheerio.load(body, { decodeEntities: false });
      $("meta[http-equiv='Content-Security-Policy'], meta[http-equiv='content-security-policy']").remove();
      $("base").remove();
      $("script").each((_, el) => {
        const src = $(el).attr("src");
        if (src) $(el).attr("src", proxify(src, target));
      });
      $("img,iframe,video,audio,source").each((_, el) => {
        for (const attr of ["src", "poster"]) {
          const v = $(el).attr(attr); if (v) $(el).attr(attr, proxify(v, target));
        }
      });
      $("link").each((_, el) => { const v = $(el).attr("href"); if (v) $(el).attr("href", proxify(v, target)); });
      $("a").each((_, el) => { const v = $(el).attr("href"); if (v && !v.startsWith("#")) $(el).attr("href", proxify(v, target)); });
      $("form").each((_, el) => { const v = $(el).attr("action"); if (v) $(el).attr("action", proxify(v, target)); });
      $("head").prepend(`<meta name="referrer" content="no-referrer"><style>body{max-width:1400px;margin:auto}</style>`);
      return new NextResponse($.html(), { status: response.status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }

    return new NextResponse(body, { status: response.status, headers: { "content-type": type, "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Proxy request failed" }, { status: 502 });
  }
}
