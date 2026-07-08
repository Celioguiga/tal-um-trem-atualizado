export type VersionEntry = {
  label: string;
  url: string;
  desc: string;
};

const VERSIONS: VersionEntry[] = [
  { label: "v1.0 (Studio)",  url: "http://localhost:4242/", desc: "Interface original Cromus Studio" },
  { label: "v1.1 (NFP)",     url: "http://localhost:4243/", desc: "Primeira versão Note Form Pro" },
  { label: "v1.2 (atual)",   url: "http://localhost:5173/", desc: "NFP com layout novo, TOM, figuras rítmicas" },
];

export function getVersions(): VersionEntry[] {
  return VERSIONS;
}

export function getCurrentVersion(): VersionEntry {
  const host = window.location.host;
  for (const v of VERSIONS) {
    try {
      if (new URL(v.url).host === host) return v;
    } catch {}
  }
  return VERSIONS[VERSIONS.length - 1];
}
