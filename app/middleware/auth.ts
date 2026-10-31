// -- /home/navho/.garage/projects/dash-navhocreatives-frontend/app/middleware/auth.ts
import { createContext, redirect } from "react-router";
import type { Schemas } from "~/api/types";
import { getSession, destroySession } from "~/sessions";
import { api } from "~/api/types"; // Make sure this points to your generated API client
import type { Route } from "../routes/+types/app-layout";

// Extract the exact type generated from your FastAPI UserProfile model
type UserProfile = Schemas["UserProfile"];

// Define the exact shape of the data we'll inject into the route context
export interface AuthContextData {
  user: UserProfile; // <-- Updated to match FastAPI UserProfile schema
  teams: any[]; // Update to Schemas["TeamResponse"] or similar if you add that endpoint later
  token: string;
}

// Create the context key
export const authContext = createContext<AuthContextData>("auth");

export async function authMiddleware(
  { request, context }: Route.MiddlewareArgs,
  next: () => Promise<Response>,
) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");

  // Gate 1: Fast-fail if no token exists
  if (!token) {
    return redirect("/auth"); // Matches the auth flow route you provided
  }

  try {
    // Verify token and fetch teams concurrently
    // getMe now resolves to UserProfile based on your FastAPI endpoint
    const [user, teams] = await Promise.all([
      api.getMe(undefined, token),
      api.discoverProjects({}, token),
    ]);

    // Inject the validated data into the React Router context
    context.set(authContext, { user, teams, token });
  } catch (error) {
    console.warn("Middleware Gate 1: Token verification failed.", error);
    // Destroy the invalid session and redirect
    return redirect("/auth", {
      headers: { "Set-Cookie": await destroySession(session) },
    });
  }

  // Proceed to the loader / next middleware in the chain
  return await next();
}
