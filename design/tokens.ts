export const designTokens = {
  colors: {
    canvas: "#efebe4",
    surface: "#fbf9f5",
    raised: "#ffffff",
    ink: "#1e1b18",
    text: "#292722",
    muted: "#6f6961",
    border: "#d9d1c7",
    brand: "#d93a1f",
    brandPressed: "#bd2e15",
    brandSoft: "#ffd9cf",
    success: "#3f7659",
    successSoft: "#e3eee6",
    warning: "#8a661c",
    warningSoft: "#f8edc9",
    blue: "#2f6bff",
    blueSoft: "#d6e2ff",
    butter: "#ffc21a",
    lilac: "#7b5cff",
  },
  typography: {
    ui: "Pretendard Variable, Pretendard, Noto Sans KR, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    titleWeight: 750,
    bodyWeight: 450,
  },
  radius: { card: 14, control: 10, pill: 999 },
  canvas: { width: 1080, height: 1350, squareHeight: 1080 },
} as const;

export type DesignTokens = typeof designTokens;
