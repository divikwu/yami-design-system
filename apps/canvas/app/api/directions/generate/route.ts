import { GenerateDirectionRequestSchema } from "@yami/contracts";
import { NextResponse } from "next/server";
import { generateDirection } from "./openai-adapter";
import { acquire } from "./rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const parsed = GenerateDirectionRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "请求内容无效", requestId }, { status: 400 });
  const limit = acquire(parsed.data.clientId);
  if (!limit.ok) return NextResponse.json({ error: "请求过于频繁", requestId }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  const model = process.env.OPENAI_MODEL ?? "gpt-5.6-luna";
  try {
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "服务端尚未配置 OPENAI_API_KEY", requestId }, { status: 503 });
    const result = await generateDirection(parsed.data.prompt, model);
    console.info(JSON.stringify({ requestId, model, durationMs: Date.now() - startedAt, status: 200, repairs: result.repairs }));
    return NextResponse.json({ manifest: result.manifest, requestId });
  } catch {
    console.error(JSON.stringify({ requestId, model, durationMs: Date.now() - startedAt, status: 422, repairs: 1 }));
    return NextResponse.json({ error: "模型未能生成有效方向，现有草稿未改变", requestId }, { status: 422 });
  } finally { limit.release(); }
}
