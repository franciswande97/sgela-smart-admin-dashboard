// app/components/ui/floating-dock.tsx
"use client";

import { cn } from "~/lib/utils";
import { IconPower, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export interface DockLink {
  title: string;
  icon: React.ReactNode;
  href: string;
}

export interface DockAction {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "success" | "destructive" | "warning";
}

export interface FloatingDockProps {
  links: DockLink[];
  actions: DockAction[];
  isServerRunning?: boolean;
  desktopClassName?: string;
  mobileClassName?: string;
}

export const FloatingDock = ({
  links,
  actions,
  isServerRunning = false,
  desktopClassName,
  mobileClassName,
}: FloatingDockProps) => {
  return (
    <>
      <FloatingDockDesktop
        links={links}
        actions={actions}
        isServerRunning={isServerRunning}
        className={desktopClassName}
      />
      <FloatingDockMobile
        links={links}
        actions={actions}
        isServerRunning={isServerRunning}
        className={mobileClassName}
      />
    </>
  );
};

// --- MOBILE (Shrink-Wrapped Swap) ---
const FloatingDockMobile = ({
  links,
  actions,
  isServerRunning,
  className,
}: {
  links: DockLink[];
  actions: DockAction[];
  isServerRunning: boolean;
  className?: string;
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={cn(
        // w-fit hugs the contents tightly, eliminating ghost space
        "mx-auto flex h-16 w-fit items-center gap-3 rounded-2xl bg-card border border-border shadow-md px-4 md:hidden z-50",
        className,
      )}
    >
      <div className="flex h-full items-center relative">
        {/* popLayout prevents container stretching during the swap */}
        <AnimatePresence mode="popLayout">
          {!showActions ? (
            <motion.div
              key="links"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              {links.map((link) => (
                <IconContainer key={link.title} {...link} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              {actions.map((action) => (
                <IconContainer key={action.title} {...action} isAction />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-px h-8 bg-border shrink-0" />

      {/* Mobile uses the morphing Trigger */}
      <MobileTriggerButton
        isOpen={showActions}
        isServerRunning={isServerRunning}
        onClick={() => setShowActions(!showActions)}
      />
    </div>
  );
};

// --- DESKTOP (Slow In-Place Reveal) ---
const FloatingDockDesktop = ({
  links,
  actions,
  isServerRunning,
  className,
}: {
  links: DockLink[];
  actions: DockAction[];
  isServerRunning: boolean;
  className?: string;
}) => {
  const [isActionsHovered, setIsActionsHovered] = useState(false);

  return (
    <div
      onMouseLeave={() => setIsActionsHovered(false)}
      className={cn(
        "mx-auto hidden h-16 w-fit items-center gap-3 rounded-2xl bg-card border border-border shadow-md px-4 md:flex z-50",
        className,
      )}
    >
      {/* Primary Links */}
      {links.map((link) => (
        <IconContainer key={link.title} {...link} />
      ))}

      <div className="w-px h-8 bg-border self-center mx-2 rounded-full shrink-0" />

      {/* Expandable Action Group */}
      <motion.div
        className="flex items-center gap-3 overflow-hidden"
        layout
        // Slowed down, smoother easing for premium feel
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Desktop trigger does not morph on hover */}
        <button
          onMouseEnter={() => setIsActionsHovered(true)}
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-transparent hover:bg-accent transition-colors outline-none shrink-0"
        >
          <LivePowerIcon isLive={isServerRunning} />
        </button>

        <AnimatePresence>
          {isActionsHovered &&
            actions.map((action, idx) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 0.8 }}
                exit={{ opacity: 0, scale: 0.8, width: 0, margin: 0 }}
                // Staggered fade in
                transition={{
                  duration: 0.3,
                  delay: idx * 0.05,
                  ease: "easeOut",
                }}
                layout
                className="shrink-0"
              >
                <IconContainer {...action} isAction />
              </motion.div>
            ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// --- SHARED COMPONENTS ---

// The morphing button strictly for mobile
function MobileTriggerButton({
  isOpen,
  isServerRunning,
  onClick,
}: {
  isOpen: boolean;
  isServerRunning: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-transparent hover:bg-accent transition-colors outline-none shrink-0"
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center text-foreground"
          >
            <IconX className="h-5 w-5" />
          </motion.div>
        ) : (
          <motion.div
            key="power"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center h-full w-full"
          >
            <LivePowerIcon isLive={isServerRunning} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

// Reusable glowing power icon
function LivePowerIcon({ isLive }: { isLive: boolean }) {
  return (
    <motion.div
      animate={{
        opacity: isLive ? [1, 0.5, 1] : 1,
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={cn(
        "flex items-center justify-center h-5 w-5 transition-colors duration-500",
        isLive
          ? "text-success drop-shadow-[0_0_8px_var(--color-success)]"
          : "text-foreground",
      )}
    >
      <IconPower className="h-full w-full" />
    </motion.div>
  );
}

function getVariantClasses(variant: string) {
  switch (variant) {
    case "success":
      return "bg-background border-border text-success hover:border-success hover:bg-success/10";
    case "destructive":
      return "bg-background border-border text-destructive hover:border-destructive hover:bg-destructive/10";
    case "warning":
      return "bg-background border-border text-warning hover:border-warning hover:bg-warning/10";
    default:
      return "bg-background border-border text-foreground hover:border-primary hover:bg-accent";
  }
}

function IconContainer({
  title,
  icon,
  href,
  onClick,
  disabled,
  variant = "default",
  isAction,
}: any) {
  const [hovered, setHovered] = useState(false);
  const Component = isAction ? "button" : "a";

  return (
    <Component
      href={!isAction ? href : undefined}
      onClick={isAction ? onClick : undefined}
      disabled={disabled}
      className={cn(
        "block outline-none",
        disabled && "opacity-40 pointer-events-none grayscale",
      )}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-colors",
          getVariantClasses(variant),
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              transition={{ duration: 0.2 }}
              className="absolute -top-12 left-1/2 w-fit rounded-md bg-primary text-primary-foreground shadow-glow border border-border px-3 py-1.5 text-xs font-medium tracking-wide whitespace-pre pointer-events-none"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex h-5 w-5 items-center justify-center text-inherit">
          {icon}
        </div>
      </motion.div>
    </Component>
  );
}
