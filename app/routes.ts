// -- /home/navho/.garage/projects/dash-navhocreatives-frontend/app/routes.ts
import {
  type RouteConfig,
  index,
  route,
  prefix,
  layout,
} from "@react-router/dev/routes";

export default [
  // --- GATE 0: PUBLIC ---
  route("auth", "./routes/auth/auth-layout.tsx", [
    index("./routes/auth/sign-in.tsx"),
  ]),
  // --- LOGOUT ACTION ROUTE (Points to auth folder) ---
  route("logout", "./routes/auth/logout.tsx"),

  layout("./routes/app-layout.tsx", [index("./routes/app-index.tsx")]),
] satisfies RouteConfig;
