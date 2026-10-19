import type { GeneratedPost } from "@/lib/types";
export function CaptionEditor({ post, onChange }: { post: GeneratedPost; onChange: (patch: Pick<GeneratedPost, "caption" | "hashtags">) => void }) {
  const tags = [...post.hashtags.core, ...post.hashtags.topic, ...post.hashtags.viral].join(" ");
  return <section className="editor-section"><h3>캡션과 해시태그</h3><label><span>캡션</span><textarea rows={5} maxLength={1800} value={post.caption} onChange={(e) => onChange({ caption: e.target.value, hashtags: post.hashtags })} /></label><label><span>해시태그</span><textarea rows={3} value={tags} placeholder="#수능 #수험생" onChange={(e) => onChange({ caption: post.caption, hashtags: { core: e.target.value.split(/\s+/).filter(Boolean).map((tag) => tag.startsWith("#") ? tag : `#${tag}`), topic: [], viral: [] } })} /></label></section>;
}
