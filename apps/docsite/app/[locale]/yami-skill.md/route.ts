import { isLocale, locales } from "../../../lib/locales";
import { readYamiSkill } from "../../../lib/yami-skill";

export const dynamic = "force-static";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });
  return new Response(readYamiSkill(locale), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
