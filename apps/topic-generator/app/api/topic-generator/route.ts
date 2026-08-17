import { handleTopicGeneratorPost } from "@yami/topic-generator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function POST(request: Request) {
  return handleTopicGeneratorPost(request);
}
