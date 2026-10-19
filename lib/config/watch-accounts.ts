export type WatchAccountsConfig = { instagram: { accounts: Record<string, string[]> }; youtube: { channels: string[] }; tiktok: { accounts: string[] } };
const safeAccount = /^[A-Za-z0-9._-]+$/;

export function parseWatchAccounts(yaml: string): WatchAccountsConfig {
  const result: WatchAccountsConfig = { instagram: { accounts: {} }, youtube: { channels: [] }, tiktok: { accounts: [] } };
  let section = ""; let subsection = ""; let group = "";
  for (const raw of yaml.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, ""); if (!line.trim()) continue;
    const indent = line.match(/^\s*/)?.[0].length ?? 0; const text = line.trim();
    if (indent === 0 && text.endsWith(":")) { section = text.slice(0, -1); subsection = ""; group = ""; continue; }
    if (indent === 2 && text.endsWith(":")) { subsection = text.slice(0, -1); group = ""; continue; }
    if (indent === 4 && section === "instagram" && subsection === "accounts" && text.endsWith(":")) { group = text.slice(0, -1); result.instagram.accounts[group] ??= []; continue; }
    if (indent === 4 && section === "instagram" && subsection === "accounts" && text.endsWith("[]")) { group = text.slice(0, text.indexOf(":")); result.instagram.accounts[group] = []; continue; }
    if (text.startsWith("- ")) {
      const value = text.slice(2).trim().replace(/^['"]|['"]$/g, "");
      if (!safeAccount.test(value)) throw new Error(`허용되지 않은 계정 또는 채널 값: ${value}`);
      if (section === "instagram" && subsection === "accounts" && group) result.instagram.accounts[group].push(value);
      if (section === "youtube" && subsection === "channels") result.youtube.channels.push(value);
      if (section === "tiktok" && subsection === "accounts") result.tiktok.accounts.push(value);
    }
  }
  return result;
}

export function instagramAccounts(config: WatchAccountsConfig) { return [...new Set(Object.values(config.instagram.accounts).flat())]; }
