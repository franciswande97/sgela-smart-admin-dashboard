import { cn } from "~/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { NavLink } from "react-router";
import { HamburgerMenuIcon, Cross1Icon } from "@radix-ui/react-icons";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined,
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();

  return (
    <>
      <motion.div
        className={cn(
          "h-full hidden md:flex md:flex-col bg-card shrink-0 z-20 relative",
          "border-r border-border",
          // TOKENIZED: Widths and Radius
          "w-[var(--sidebar-width-collapsed)] hover:w-[var(--sidebar-width-expanded)] transition-[width] duration-normal",
          "rounded-r-[var(--radius-3xl)]",
          className,
        )}
        style={{
          // TOKENIZED: Min-width ensures it doesn't collapse before CSS loads
          minWidth: "var(--sidebar-width-collapsed)",
        }}
        initial={false}
        animate={{
          // TOKENIZED: Motion values mapped to CSS variables
          width: animate
            ? open
              ? "var(--sidebar-width-expanded)"
              : "var(--sidebar-width-collapsed)"
            : "var(--sidebar-width-expanded)",
          borderTopRightRadius: "var(--radius-3xl)",
          borderBottomRightRadius: "var(--radius-3xl)",
        }}
        transition={{
          duration: 0.3, // Matches --duration-normal
          ease: "easeInOut",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        <div className="flex flex-col h-full py-6 overflow-hidden">
          {children}
        </div>
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-card w-full",
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <HamburgerMenuIcon
            className="text-foreground w-6 h-6"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-card p-10 z-[100] flex flex-col justify-between",
                className,
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-foreground"
                onClick={() => setOpen(!open)}
              >
                <Cross1Icon className="w-6 h-6" />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLabel = ({
  icon,
  label,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
}) => {
  const { open, animate } = useSidebar();

  return (
    <div
      className={cn(
        "flex items-center justify-start w-full cursor-default group/label",
        className,
      )}
    >
      <div
        className="flex items-center justify-center shrink-0 h-10 text-primary z-20 bg-card w-20"
        // TOKENIZED: Widths
        style={{
          minWidth: "var(--sidebar-width-collapsed)",
          width: "var(--sidebar-width-collapsed)",
        }}
      >
        <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
      </div>

      <motion.span
        initial={false}
        animate={{
          display: animate ? (open ? "block" : "none") : "block",
          opacity: animate ? (open ? 1 : 0) : 1,
          transition: { duration: 0.2, delay: open ? 0.1 : 0 },
        }}
        className="font-medium whitespace-pre font-sans text-foreground overflow-hidden"
        style={{ display: open ? "block" : "none", opacity: open ? 1 : 0 }}
      >
        {label}
      </motion.span>
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  const isExact = link.href === "/";

  return (
    <NavLink
      to={link.href}
      end={isExact}
      className={({ isActive }) =>
        cn(
          "flex items-center justify-start w-full group/sidebar py-1 transition-colors duration-200",
          isActive ? "text-[var(--color-primary)]" : "text-muted-foreground",
          className,
        )
      }
      {...props}
    >
      {({ isActive }) => (
        <>
          <div
            className={cn(
              "flex items-center justify-center shrink-0 h-8 transition-colors z-20 bg-card w-20",
              open ? "" : "scale-110",
              isActive
                ? "text-[var(--color-primary)]"
                : "text-muted-foreground group-hover/sidebar:text-primary",
            )}
            style={{
              minWidth: "var(--sidebar-width-collapsed)",
              width: "var(--sidebar-width-collapsed)",
            }}
          >
            <div
              className={cn(
                "w-6 h-6 flex items-center justify-center rounded-md transition-all",
                isActive && "bg-[var(--color-primary)]/10 shadow-glow",
              )}
            >
              {link.icon}
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
              "text-sm transition duration-150 whitespace-nowrap overflow-hidden font-medium",
              isActive
                ? "font-bold text-foreground"
                : "text-muted-foreground group-hover/sidebar:translate-x-1 group-hover/sidebar:text-foreground",
            )}
            style={{ display: open ? "block" : "none", opacity: open ? 1 : 0 }}
          >
            {link.label}
          </motion.span>
        </>
      )}
    </NavLink>
  );
};
