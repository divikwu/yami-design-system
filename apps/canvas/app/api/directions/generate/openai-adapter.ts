import { DirectionManifestV1Schema, type DirectionManifestV1 } from "@yami/contracts";
import OpenAI from "openai";
import { z } from "zod";

const system = `You generate a YAMI Ecommerce Home design direction. Return only DirectionManifestV1. The manifest extends current and may patch fixed header, hero, shortcutRail, footer slots and existing kinded sections. Never emit HTML, CSS statements, URLs, functions, component ids, assets, or fields outside the schema. Keep changes focused and renderable.`;

async function requestManifest(client: OpenAI, model: string, prompt: string, repair?: string) {
  const response = await client.responses.create({
    model,
    store: false,
    input: `${system}\nUser direction (${prompt.length} chars):\n${prompt}${repair ? `\nRepair this validation failure: ${repair}` : ""}`,
    text: { format: { type: "json_schema", name: "direction_manifest_v1", strict: true, schema: z.toJSONSchema(DirectionManifestV1Schema) } }
  });
  return DirectionManifestV1Schema.parse(JSON.parse(response.output_text));
}

export async function generateDirection(prompt: string, model: string): Promise<{ manifest: DirectionManifestV1; repairs: number }> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try { return { manifest: await requestManifest(client, model, prompt), repairs: 0 }; }
  catch (first) {
    const message = first instanceof Error ? first.message.slice(0, 500) : "Invalid manifest";
    return { manifest: await requestManifest(client, model, prompt, message), repairs: 1 };
  }
}
