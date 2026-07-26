import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GenerateInput = z.object({
  clientId: z.string().uuid().nullable().optional(),
  platform: z.string().min(1),
  contentType: z.string().min(1),
  prompt: z.string().min(1),
  tone: z.string().optional(),
  save: z.boolean().optional().default(true),
});

export const generateSocialContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    let clientBrief = "";
    if (data.clientId) {
      const { data: client } = await context.supabase
        .from("clients")
        .select(
          "business_name, industry, target_audience, brand_voice, tone, usp, mission, keywords, hashtags, preferred_languages",
        )
        .eq("id", data.clientId)
        .maybeSingle();
      if (client) {
        clientBrief = `\n\nBRAND DNA:\n- Business: ${client.business_name}\n- Industry: ${client.industry ?? "—"}\n- Audience: ${client.target_audience ?? "—"}\n- Voice: ${client.brand_voice ?? "—"}\n- Tone: ${client.tone ?? data.tone ?? "warm, confident"}\n- USP: ${client.usp ?? "—"}\n- Mission: ${client.mission ?? "—"}\n- Keywords: ${client.keywords ?? "—"}\n- Preferred hashtags: ${client.hashtags ?? "—"}\n- Language: ${client.preferred_languages ?? "English"}`;
      }
    }

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-2.5-flash");

    const system = `You are SocialPilot AI, an expert senior social media strategist. You write on-brand, scroll-stopping content that respects the client's Brand DNA. Output MUST be valid JSON with keys: caption (string), hashtags (string, space-separated with #), cta (string, one line), image_brief (string, one paragraph describing a visual for this post). No markdown, no code fences, no commentary.`;

    const user = `Create a ${data.contentType} for ${data.platform}.\nTopic / prompt: ${data.prompt}${clientBrief}\n\nReturn only JSON.`;

    const { text } = await generateText({
      model,
      system,
      prompt: user,
    });

    let parsed: { caption: string; hashtags: string; cta: string; image_brief: string };
    try {
      const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { caption: text, hashtags: "", cta: "", image_brief: "" };
    }

    let contentId: string | null = null;
    if (data.save) {
      const { data: inserted } = await context.supabase.from("generated_content").insert({
        owner_id: context.userId,
        client_id: data.clientId ?? null,
        platform: data.platform,
        content_type: data.contentType,
        prompt: data.prompt,
        caption: parsed.caption ?? "",
        hashtags: parsed.hashtags ?? "",
        cta: parsed.cta ?? "",
        image_brief: parsed.image_brief ?? "",
        status: "draft",
      }).select("id").maybeSingle();
      contentId = inserted?.id ?? null;
    }

    return { ...parsed, contentId };
  });