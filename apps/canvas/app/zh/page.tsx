import { redirect } from "next/navigation";
import { previewRoute, type PreviewSearchParams } from "../lib/preview-routes";

export default async function ChineseHomePage({ searchParams }: { searchParams: Promise<PreviewSearchParams> }) {
  redirect(previewRoute(await searchParams, "zh"));
}
