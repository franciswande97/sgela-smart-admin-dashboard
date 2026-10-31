import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

// 1. Accept the token directly via props instead of context
export function SocketProvider({
  children,
  token,
}: {
  children: React.ReactNode;
  token: string;
}) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // 2. Depend directly on the passed prop
    if (!token) return;

    const socketInstance = io(import.meta.env.VITE_API_BASE_URL, {
      auth: {
        token: token,
      },
      transports: ["websocket"],
    });

    socketInstance.on("connect", () => {
      console.log("🟢 [Socket] Connected to /temple namespace");
    });

    socketInstance.on("connect_error", (error) => {
      console.error("🔴 [Socket] Connection error:", error.message);

      if (error.message.includes("Token expired")) {
        console.warn(
          "🔄 [Socket] Token expired. Triggering middleware refresh cycle...",
        );
        window.location.reload();
      }
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🟠 [Socket] Disconnected:", reason);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]); // 3. Re-run if the token prop changes

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
