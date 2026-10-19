export type ContentType = "info" | "viral" | "curation" | "breaking";
export type TemplateId = "A" | "B" | "C" | "D";
export type LayoutVariant = "photo_top" | "photo_bottom" | "photo_right" | "text_only" | "number_large";

export type SourceEvidence = {
  label: string;
  url: string;
  kind: "official" | "article" | "post" | "reel" | "video" | "hashtag" | "search" | "community";
  note?: string;
  publishedAt?: string;
  author?: string;
  metrics?: { views?: number; likes?: number; comments?: number };
};

export type SourceSignal = {
  label: string;
  value: string;
  official?: boolean;
  headline: string;
  detail: string;
  query?: string;
  capturedAt: string;
  sourceType: "official" | "search" | "community" | "social" | "video" | "manual";
  evidence: SourceEvidence[];
};

export type RadarItem = {
  id: string;
  title: string;
  summary: string;
  generationTopic: string;
  coverHook: string;
  cardPlan: string[];
  keywords: string[];
  sources: SourceSignal[];
  detectedAt: string;
  firstSeenAt: string;
  lastCollectedAt: string;
  trendDirection: "new" | "rising" | "steady" | "falling";
  engagementScore: number | null;
  evidenceScore: number;
  recencyScore: number;
  viralScore: number;
  infoScore: number;
  urgencyScore: number;
  officialSourceAvailable: boolean;
  recommendedContentType: ContentType;
  kind: "topic" | "format";
};

export type RadarScores = {
  engagementScore: number | null;
  evidenceScore: number;
  recencyScore: number;
};

export type RadarProviderId = "google-news-rss" | "naver-news" | "naver-blog" | "naver-cafe" | "naver-web" | "youtube" | "instagram";

export type RadarSignal = {
  id: string;
  provider: RadarProviderId;
  providerLabel: string;
  sourceType: SourceSignal["sourceType"];
  evidenceKind: SourceEvidence["kind"];
  clusterKey: string;
  query: string;
  title: string;
  description?: string;
  url: string;
  publishedAt?: string;
  collectedAt: string;
  author?: string;
  official: boolean;
  format?: "article" | "post" | "reel" | "video";
  metrics?: SourceEvidence["metrics"];
};

export type RadarProviderRun = {
  provider: RadarProviderId;
  label: string;
  status: "ok" | "skipped" | "error";
  collected: number;
  message: string;
};

export type RadarSnapshot = {
  version: 1;
  lastRunAt: string | null;
  topics: RadarItem[];
  signals: RadarSignal[];
  providers: RadarProviderRun[];
};

export type ImageAsset = {
  url: string;
  source: "upload" | "pexels" | "unsplash" | "pixabay" | "wikimedia" | "naver" | "placeholder";
  sourcePage: string;
  licenseStatus: "safe" | "unknown" | "restricted";
  usableForPublish: boolean;
  query: string;
};

export type Slide = {
  index: number;
  type: "cover" | "content" | "summary" | "source";
  headline: string;
  subtext?: string;
  body?: string;
  imageQueryKo: string;
  imageQueryEn: string;
  imageRequired: boolean;
  layoutVariant: LayoutVariant;
  image?: ImageAsset;
  dateLabel?: string;
  sourceLabel?: string;
  verificationStatus?: "verified" | "needs_review";
  evidenceIds?: string[];
  canvas?: CanvasScene;
};

export type GeneratedPost = {
  id: string;
  topic: string;
  title: string;
  contentType: ContentType;
  template: TemplateId;
  createdAt: string;
  slides: Slide[];
  caption: string;
  hashtags: { core: string[]; topic: string[]; viral: string[] };
  sourceLinks: string[];
  imageSources: ImageAsset[];
  status: "draft" | "needs_review" | "ready";
  officialSourceAvailable: boolean;
};

export type GenerateOptions = {
  topic: string;
  contentType: ContentType;
  template: TemplateId;
  slideCount: "auto" | 4 | 5 | 6 | 7 | 8;
  imageMode: "auto" | "minimal" | "photo";
  officialSourceAvailable?: boolean;
  sourceLinks?: string[];
};
import type { CanvasScene } from "@/lib/editor/scene";

