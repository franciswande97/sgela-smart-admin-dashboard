// -- /home/navho/.garage/projects/dash-navhocreatives-frontend/app/routes/auth/auth-layout.tsx
import { api } from "~/api/types";
import { getSession } from "~/sessions";
import { redirect, Outlet } from "react-router";
import type { Route } from "./+types/auth-layout";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");

  // If we have a token, try to verify it
  if (token) {
    try {
      // POST to /auth/me with no body and the Bearer token
      await api.getMe(undefined, token);

      // If server responds 200, user is valid -> Redirect to App Index
      return redirect("/");
    } catch (e) {
      // If API throws (401/500), the token is bad. Stay on auth pages.
      console.warn("Gate 1: Session invalid or expired.");
    }
  }

  return null;
}

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] font-sans antialiased text-[var(--color-foreground)]">
      <Outlet />
    </div>
  );
}
