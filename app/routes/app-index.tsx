// -- /home/navho/.garage/projects/dash-navhocreatives-frontend/app/routes/app-index.tsx
import React from "react";
import { Link, useLoaderData, useOutletContext } from "react-router";
import { getSession } from "~/sessions";
import { api } from "~/api/types";
import {
  ActivityLogIcon,
  GlobeIcon,
  LockClosedIcon,
  PersonIcon,
  LightningBoltIcon,
  ComponentInstanceIcon,
  GearIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { cn } from "~/lib/utils";
import { FloatingDock } from "~/components/ui/floating-dock";
import type { Route } from "./+types/app-index";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");

  if (!token) return { isHealthy: false, teams: [] };

  try {
    const [healthRes, teams] = await Promise.all([
      api
        .health_check_health_get(undefined, token)
        .then(() => true)
        .catch(() => false),
      api.discoverProjects({}, token).catch(() => []),
    ]);

    return { isHealthy: healthRes, teams };
  } catch (error) {
    return { isHealthy: false, teams: [] };
  }
}

export default function AppIndex() {
  const { isHealthy, teams } = useLoaderData<typeof loader>();
  const { user } = useOutletContext<any>();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 animate-fade-in text-[var(--color-foreground)] p-4 md:p-0">
      {/* --- ZONE A: Developer Profile & Health --- */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-[var(--color-card)] p-8 rounded-xl border border-[var(--color-border)] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-[var(--color-primary)] opacity-5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-[var(--color-muted-foreground)] text-xs font-bold font-mono uppercase tracking-widest">
            <ActivityLogIcon className="w-4 h-4 text-[var(--color-primary)]" />
            Global Command Center
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, {user?.full_name || "Developer"}
          </h1>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-md">
              <PersonIcon className="w-3.5 h-3.5" />
              {user?.role || "USER"}
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex items-center gap-3 bg-[var(--color-background)] border border-[var(--color-border)] px-5 py-2.5 rounded-full shadow-sm">
            <span className="relative flex h-3 w-3">
              {isHealthy && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75"></span>
              )}
              <span
                className={cn(
                  "relative inline-flex rounded-full h-3 w-3",
                  isHealthy
                    ? "bg-[var(--color-success)]"
                    : "bg-[var(--color-destructive)]",
                )}
              ></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
              Cloud Hub {isHealthy ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </header>

      {/* --- ZONE B: Global Project Registry --- */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-4">
          <ComponentInstanceIcon className="w-5 h-5 text-[var(--color-primary)]" />
          <h2 className="text-xl font-bold">Active Environments</h2>
        </div>

        {teams.length === 0 ? (
          <div className="text-center p-12 border border-[var(--color-border)] border-dashed rounded-xl text-[var(--color-muted-foreground)]">
            You do not have access to any projects yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teams.flatMap((team) =>
              team.projects.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-primary)]/50 transition-all group"
                >
                  <div className="mb-4 sm:mb-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-1">
                      {team.team_name}
                    </div>
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                      to={`/private/${project.project_slug}/env/`}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] rounded-md text-xs font-bold transition-all"
                    >
                      <LockClosedIcon className="w-3.5 h-3.5" />
                      Private
                    </Link>

                    <Link
                      to={`/collab/${project.project_slug}/env/`}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90 rounded-md text-xs font-bold transition-all shadow-sm"
                    >
                      <GlobeIcon className="w-3.5 h-3.5" />
                      Collab
                    </Link>
                  </div>
                </div>
              )),
            )}
          </div>
        )}
      </section>

      {/* --- ZONE C: Platform Quick Actions (Admin Only) --- */}
      {user?.role === "admin" && (
        <section className="space-y-6 pt-8 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2 pb-2">
            <GearIcon className="w-5 h-5 text-[var(--color-muted-foreground)]" />
            <h2 className="text-lg font-bold text-[var(--color-muted-foreground)]">
              System Administration
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 p-4 bg-[var(--color-background)] border border-[var(--color-border)] border-dashed rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all text-left">
              <div className="p-2 bg-[var(--color-primary)]/10 rounded-md text-[var(--color-primary)]">
                <PlusIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Onboard Developer</h4>
                <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
                  Create new platform user
                </p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-4 bg-[var(--color-background)] border border-[var(--color-border)] border-dashed rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all text-left">
              <div className="p-2 bg-[var(--color-primary)]/10 rounded-md text-[var(--color-primary)]">
                <GlobeIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Create Team</h4>
                <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
                  Setup new organization
                </p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-4 bg-[var(--color-background)] border border-[var(--color-border)] border-dashed rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all text-left">
              <div className="p-2 bg-[var(--color-primary)]/10 rounded-md text-[var(--color-primary)]">
                <LightningBoltIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Sync Frameworks</h4>
                <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
                  Update Python/Node binaries
                </p>
              </div>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
