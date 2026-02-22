import { env } from "../env";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type ApiFetchOptions = {
  token?: string;
  body?: JsonValue;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const url = `${env.apiBaseUrl}${path}`;
  const headers = new Headers({ "Content-Type": "application/json" });

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(url, {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const responseText = await response.text();
    let parsedMessage: string | undefined;

    try {
      const payload = JSON.parse(responseText) as { message?: string };
      parsedMessage = payload.message;
    } catch {
      // Fall back to raw text.
    }

    if (parsedMessage) {
      throw new Error(parsedMessage);
    }

    throw new Error(responseText || `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
