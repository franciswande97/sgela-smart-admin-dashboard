// app/components/project-dock.tsx
import {
  FloatingDock,
  DockLink,
  DockAction,
} from "~/components/ui/floating-dock";
import {
  IconHome,
  IconTerminal2,
  IconCode,
  IconPlayerPlayFilled,
  IconPlayerStopFilled,
  IconRefresh,
} from "@tabler/icons-react";

interface ProjectDockProps {
  slug: string;
  status: "offline" | "starting" | "running" | "stopping";
  onAction: (intent: "start" | "stop" | "restart") => void;
}

export function ProjectDock({ slug, status, onAction }: ProjectDockProps) {
  const isOnline = status === "running";
  const isTransitioning = status === "starting" || status === "stopping";

  // --- NAVIGATION LINKS ---
  const links: DockLink[] = [
    {
      title: "Project Home",
      icon: <IconHome className="h-full w-full" />,
      href: `/private/${slug}`,
    },
    {
      title: "Environment",
      icon: <IconTerminal2 className="h-full w-full" />,
      href: `/private/${slug}/env`,
    },
    {
      title: "Git Editor",
      icon: <IconCode className="h-full w-full" />,
      href: `/private/${slug}/code`,
    },
  ];

  // --- ACTION BUTTONS ---
  const actions: DockAction[] = [
    {
      title: "Start",
      icon: <IconPlayerPlayFilled className="h-full w-full" />,
      variant: "success",
      disabled: isOnline || isTransitioning,
      onClick: () => onAction("start"),
    },
    {
      title: "Restart",
      icon: <IconRefresh className="h-full w-full" />,
      variant: "warning",
      disabled: !isOnline || isTransitioning,
      onClick: () => onAction("restart"),
    },
    {
      title: "Stop",
      icon: <IconPlayerStopFilled className="h-full w-full" />,
      variant: "destructive",
      disabled: !isOnline || isTransitioning,
      onClick: () => onAction("stop"),
    },
  ];

  return (
    <div className="fixed bottom-6 inset-x-0 flex items-center justify-center pointer-events-none z-[100]">
      <div className="pointer-events-auto px-4 w-full md:w-auto flex justify-end md:justify-center">
        <FloatingDock links={links} actions={actions} />
      </div>
    </div>
  );
}
