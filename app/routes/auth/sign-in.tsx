// -- /home/navho/.garage/projects/dash-navhocreatives-frontend/app/routes/auth/sign-in.tsx
import { useState } from "react";
import { useFetcher, redirect } from "react-router";
import { api } from "~/api/types";
import { getSession, commitSession } from "~/sessions";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import type { Route } from "./+types/sign-in";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const rawUsername = formData.get("username") as string;
  const username = rawUsername ? rawUsername.toLowerCase().trim() : "";
  const password = formData.get("password") as string;

  try {
    const data = await api.signIn({ username, password });

    const session = await getSession(request.headers.get("Cookie"));
    session.set("token", data.access_token);
    session.set("username", data.user.username);

    return redirect("/", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  } catch (error: any) {
    return { error: error.message || "Invalid credentials" };
  }
}

export default function SignIn() {
  const fetcher = useFetcher();
  const [showPwd, setShowPwd] = useState(false);
  const isSubmitting = fetcher.state === "submitting";

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <fetcher.Form
        method="post"
        className="w-full max-w-md space-y-6 animate-slide-in"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
            Navho Creatives
          </h1>
          <p className="text-[var(--color-muted-foreground)]">
            Sign in to the internal development platform
          </p>
        </div>

        <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-xl shadow-glow">
          {fetcher.data?.error && (
            <div className="mb-4 p-3 rounded bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm border border-[var(--color-destructive)]/20">
              {fetcher.data.error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-[var(--color-muted-foreground)]" />
                <input
                  name="username"
                  className="w-full pl-10 pr-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-[var(--color-foreground)]"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-[var(--color-muted-foreground)]" />
                <input
                  name="password"
                  type={showPwd ? "text" : "password"}
                  className="w-full pl-10 pr-12 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-[var(--color-foreground)]"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-3 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              disabled={isSubmitting}
              className="w-full py-3 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-md font-bold hover:opacity-90 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? "Authenticating..." : "Login to Dashboard"}
            </button>
          </div>
        </div>
      </fetcher.Form>
    </div>
  );
}
