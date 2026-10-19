import type { ContentType, ImageAsset, Slide, SourceEvidence, TemplateId } from "@/lib/types";

export type ReviewState = { copy: boolean; sources: boolean; images: boolean };
export type ProjectStatus = "draft" | "needs_review" | "ready";

export type WorkspaceProject = {
  version: 1;
  id: string;
  topic: string;
  title: string;
  contentType: ContentType;
  template: TemplateId;
  createdAt: string;
  updatedAt: string;
  slides: Slide[];
  caption: string;
  hashtags: { core: string[]; topic: string[]; viral: string[] };
  sourceLinks: string[];
  evidence: SourceEvidence[];
  imageSources: ImageAsset[];
  officialSourceAvailable: boolean;
  review: ReviewState;
  status: ProjectStatus;
};

export type WorkspacePreferences = { radarRefreshMinutes: 0 | 30 | 60 | 180 };
