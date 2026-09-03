import { next } from "@vercel/functions";
import { createSiteAccess, privateHeaders } from "@yami/site-access";

const gate = createSiteAccess("storybook");

export default async function proxy(request: Request) {
  return await gate(request) ?? next({ headers: privateHeaders });
}
