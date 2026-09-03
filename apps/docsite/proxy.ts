import { NextResponse, type NextRequest } from "next/server";
import { createSiteAccess, privateHeaders } from "@yami/site-access";

const gate = createSiteAccess("docsite");

export async function proxy(request: NextRequest) {
  return await gate(request) ?? NextResponse.next({ headers: privateHeaders });
}

// All paths, including RSC, search, Markdown downloads and static assets.
export const config = { matcher: "/:path*" };
