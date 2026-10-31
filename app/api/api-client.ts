// -- /home/navho/.garage/projects/dash-navhocreatives-frontend/app/api/api-client.ts
import { operationMap } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function request<TRes, TParams extends Record<string, any>>(
  operationId: string,
  params?: TParams,
  token?: string,
): Promise<TRes> {
  const { path: templatePath, method } = operationMap[operationId];

  let finalPath = templatePath;
  const bodyPayload = params ? { ...params } : undefined;

  // 1. Detect path variables (e.g., {team_id}) and extract them from the payload
  const pathMatches = templatePath.match(/\{([^}]+)\}/g);
  if (pathMatches && bodyPayload) {
    pathMatches.forEach((match) => {
      const key = match.replace(/[{}]/g, "");
      if (bodyPayload[key] !== undefined) {
        finalPath = finalPath.replace(match, String(bodyPayload[key]));
        // Remove it from the payload so it doesn't get sent in body/query
        delete bodyPayload[key];
      }
    });
  }

  const isGet = method.toUpperCase() === "GET";
  const hasBody = bodyPayload && Object.keys(bodyPayload).length > 0;

  // 2. Append query parameters for GET requests (or requests without a body)
  if (isGet && hasBody) {
    const searchParams = new URLSearchParams();
    Object.entries(bodyPayload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      finalPath += `?${queryString}`;
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 3. Execute fetch
  const res = await fetch(`${API_BASE}${finalPath}`, {
    method,
    headers,
    body: !isGet && hasBody ? JSON.stringify(bodyPayload) : undefined,
  });

  // 4. Handle errors uniformly
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.message || "API Request Failed",
    );
  }

  return res.json();
}
