// -- /home/navho/.garage/projects/dash-navhocreatives-frontend/app/routes/app-layout.tsx
import React, { useEffect } from "react";
import {
  useLoaderData,
  useParams,
  useLocation,
  useNavigate,
  Form,
  Outlet,
  NavLink,
  redirect,
} from "react-router";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarLabel,
  useSidebar,
} from "~/components/ui/ace-sidebar";
import {
  HomeIcon,
  GearIcon,
  CubeIcon,
  DotFilledIcon,
  LockClosedIcon,
  ExitIcon,
  GlobeIcon,
} from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "~/lib/utils";
import Logo from "~/components/ui/logo";
import { ThemeToggle } from "~/components/theme"; // <-- Imported ThemeToggle
import type { Route } from "./+types/app-layout";
import { SocketProvider } from "~/socket";
import { authMiddleware, authContext } from "~/middleware/auth";

// 2. Mount the middleware to this route
export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
  // 3. Extract the guaranteed data injected by the middleware
  const authData = context.get(authContext);

  if (!authData) {
    throw new Error(
      "Authentication context is missing. Middleware failed to execute.",
    );
  }

  return authData;
}
const ModeToggle = ({
  isCollab,
  onToggle,
}: {
  isCollab: boolean;
  onToggle: () => void;
}) => {
  const { open } = useSidebar();

  return (
    <div className={cn("px-4 mb-4 transition-all", !open && "px-2")}>
      <button
        onClick={onToggle}
        className="relative flex w-full items-center p-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg cursor-pointer hover:border-[var(--color-primary)]/50 transition-colors"
      >
        <div
          className={cn(
            "absolute inset-y-1 w-[calc(50%-4px)] bg-[var(--color-card)] shadow-sm border border-[var(--color-border)]/50 rounded-md transition-all duration-300 ease-in-out",
            isCollab ? "left-[calc(50%+2px)]" : "left-1",
          )}
        />

        <div
          className={cn(
            "relative z-10 flex flex-1 items-center justify-center gap-2 py-1.5 text-xs font-bold transition-colors",
            !isCollab
              ? "text-[var(--color-foreground)]"
              : "text-[var(--color-muted-foreground)]",
          )}
        >
          <LockClosedIcon className="w-3.5 h-3.5" />
          {open && <span>Private</span>}
        </div>

        <div
          className={cn(
            "relative z-10 flex flex-1 items-center justify-center gap-2 py-1.5 text-xs font-bold transition-colors",
            isCollab
              ? "text-[var(--color-primary)]"
              : "text-[var(--color-muted-foreground)]",
          )}
        >
          <GlobeIcon className="w-3.5 h-3.5" />
          {open && <span>Collab</span>}
        </div>
      </button>
    </div>
  );
};

const LabLink = ({
  project,
  isActive,
  basePath,
}: {
  project: any;
  isActive: boolean;
  basePath: string;
}) => {
  const { open, animate } = useSidebar();

  return (
    <NavLink
      to={`${basePath}/${project.project_slug}/env/`}
      className={cn(
        "flex items-center justify-start w-full group/sidebar py-1 transition-colors duration-200",
        isActive
          ? "text-[var(--color-primary)]"
          : "text-[var(--color-muted-foreground)]",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center shrink-0 h-8 transition-all z-20 bg-transparent",
          !open && "scale-110",
        )}
        style={{ minWidth: "80px", width: "80px" }}
      >
        <div
          className={cn(
            "w-6 h-6 flex items-center justify-center rounded-md transition-all",
            isActive && "bg-[var(--color-primary)]/10 shadow-glow",
          )}
        >
          <CubeIcon className="w-4 h-4" />
        </div>
      </div>

      <motion.span
        initial={false}
        animate={{
          display: animate ? (open ? "block" : "none") : "block",
          opacity: animate ? (open ? 1 : 0) : 1,
          transition: { duration: 0.2, delay: open ? 0.1 : 0 },
        }}
        className={cn(
          "text-sm whitespace-nowrap overflow-hidden transition-all duration-150",
          isActive
            ? "font-bold text-[var(--color-foreground)]"
            : "group-hover/sidebar:text-[var(--color-foreground)] group-hover/sidebar:translate-x-1",
        )}
      >
        <div className="flex items-center gap-2">
          {project.name}
          {isActive && (
            <DotFilledIcon className="w-3 h-3 text-[var(--color-primary)] animate-pulse" />
          )}
        </div>
      </motion.span>
    </NavLink>
  );
};

export default function DashboardLayout() {
  const { teams, user, token } = useLoaderData<typeof loader>();
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isCollab = location.pathname.startsWith("/collab");
  const activeMode = isCollab ? "collab" : "private";
  const basePath = `/${activeMode}`;

  const allProjects = teams.flatMap((t) => t.projects);

  const handleModeToggle = () => {
    const currentModePrefix = isCollab ? "/collab" : "/private";
    const targetModePrefix = isCollab ? "/private" : "/collab";

    if (location.pathname.startsWith(currentModePrefix)) {
      // Swaps the leading segment and preserves :slug and any nested sub-routes
      const nextPath = location.pathname.replace(
        currentModePrefix,
        targetModePrefix,
      );
      navigate(nextPath);
    } else {
      // Fallback if currently on root / or /settings
      navigate(targetModePrefix);
    }
  };

  const navLinks = [
    { label: "Dashboard", href: "/", icon: <HomeIcon className="h-4 w-4" /> },
    {
      label: "Settings",
      href: "/settings",
      icon: <GearIcon className="h-4 w-4" />,
    },
  ];

  return (
    <SocketProvider token={token}>
      <div className="flex w-full flex-1 flex-col overflow-hidden border border-[var(--color-border)] bg-[var(--color-background)] md:flex-row h-screen font-sans">
        <Sidebar>
          <SidebarBody className="justify-between gap-10 bg-[var(--color-card)] border-r border-[var(--color-border)]">
            <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
              <SidebarLabel
                label="Navho Creatives"
                icon={
                  <Logo size={24} className="text-[var(--color-primary)]" />
                }
              />

              <div className="mt-8 flex flex-col gap-2">
                <ModeToggle isCollab={isCollab} onToggle={handleModeToggle} />

                {navLinks.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}

                <div className="my-4 h-px bg-[var(--color-border)]/50 mx-4" />

                <div className="flex flex-col space-y-4">
                  {teams.map((team) => (
                    <div key={team.team_id} className="flex flex-col">
                      <SectionHeader label={team.team_name} />
                      {team.projects.map((project) => (
                        <LabLink
                          key={project.id}
                          project={project}
                          basePath={basePath}
                          isActive={slug === project.project_slug}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* --- NEW: Global Sidebar Footer for Theme Toggle --- */}
            <div className="mt-auto pt-4 border-t border-[var(--color-border)]/50 flex flex-col gap-2 px-4 pb-4">
              <div className="w-full flex justify-center">
                <ThemeToggle />
              </div>
              <Form method="post" action="/logout" className="w-full">
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-md text-xs font-bold text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <ExitIcon className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </Form>
            </div>{" "}
          </SidebarBody>
        </Sidebar>

        <main className="flex-1 overflow-hidden bg-[var(--color-background)]">
          <div className="h-full overflow-auto p-4 md:p-8 flex flex-col">
            <div className="mx-auto max-w-7xl w-full flex-1 flex flex-col">
              <Outlet
                context={{
                  user,
                  token,
                  activeMode,
                  activeProject: allProjects.find(
                    (p) => p.project_slug === slug,
                  ),
                }}
              />
            </div>
          </div>
        </main>
      </div>
    </SocketProvider>
  );
}

const SectionHeader = ({ label }: { label: string }) => {
  const { open } = useSidebar();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 0.6, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-[28px] mb-1"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
            {label}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
