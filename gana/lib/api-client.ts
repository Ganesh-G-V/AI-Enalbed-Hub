export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const base = process.env.NEXT_PUBLIC_APP_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
  return res.json();
}
