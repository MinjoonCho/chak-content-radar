export const generatedPostSchema = {
  type: "object", properties: {
    title: { type: "string" }, slides: { type: "array", items: { type: "object", properties: {
      type: { type: "string", enum: ["cover", "content", "summary", "source"] }, headline: { type: "string" }, subtext: { type: "string" }, body: { type: "string" }, imageQueryKo: { type: "string" }, imageQueryEn: { type: "string" }, imageRequired: { type: "boolean" }, layoutVariant: { type: "string", enum: ["photo_top", "photo_bottom", "photo_right", "text_only", "number_large"] }, evidenceIds: { type: "array", items: { type: "string" } },
    }, required: ["type", "headline", "imageQueryKo", "imageQueryEn", "imageRequired", "layoutVariant", "evidenceIds"] } },
    caption: { type: "string" }, hashtags: { type: "object", properties: { core: { type: "array", items: { type: "string" } }, topic: { type: "array", items: { type: "string" } }, viral: { type: "array", items: { type: "string" } } }, required: ["core", "topic", "viral"] },
  }, required: ["title", "slides", "caption", "hashtags"],
} as const;
