/// -- /home/navho/.garage/projects/dash-navhocreatives-frontend/app/routes/logout.tsx
import { redirect } from "react-router";
import { getSession, destroySession } from "~/sessions";
import type { Route } from "./+types/logout";

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/auth", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export default function Logout() {
  return null;
}
