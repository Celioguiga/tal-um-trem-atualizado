export type Booklet = {
  slug: string; name: string; filename: string;
  size: number; mtime: number; free: boolean; price: string;
};

export type Campaign = {
  name: string; path: string; size: number; mtime: number;
};

export type Reference = {
  name: string; path: string; size: number; mtime: number;
};

export type Stats = {
  booklets: number; cantigas: string[];
  campanhas: number; pdf_total: number;
  angles_total: number; angles_used: number;
};

export type Angle = {
  text: string; used: boolean; raw: string;
};

const BASE = "/api";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, init);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  stats: () => fetchJson<Stats>("/stats"),

  booklets: () => fetchJson<Booklet[]>("/booklets"),
  regenerateBooklets: () =>
    fetch(`${BASE}/booklets/regenerate`, { method: "POST" }).then((r) => r.json()),
  pdfUrl: (filename: string) => `${BASE}/pdfs/${filename}`,

  campanhas: () => fetchJson<Campaign[]>("/campanhas"),
  getCampanha: (name: string) => fetchJson<{ name: string; content: string }>(`/campanhas/${name}`),
  saveCampanha: (name: string, content: string) =>
    fetchJson<any>(`/campanhas/${name}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }),
  createCampanha: (name: string, content: string) =>
    fetchJson<any>("/campanhas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content }),
    }),
  deleteCampanha: (name: string) =>
    fetchJson<any>(`/campanhas/${name}`, { method: "DELETE" }),
  generateCampanha: (theme: string, pillar: string, target: string) =>
    fetchJson<{ name: string; saved: boolean }>("/campanhas/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme, pillar, target }),
    }),

  references: () => fetchJson<Reference[]>("/references"),
  getReference: (name: string) => fetchJson<{ name: string; content: string }>(`/references/${name}`),
  saveReference: (name: string, content: string) =>
    fetchJson<any>(`/references/${name}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }),

  angles: () => fetchJson<Angle[]>("/angles"),
  toggleAngle: (index: number, used: boolean) =>
    fetchJson<any>("/angles/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index, used }),
    }),
};
