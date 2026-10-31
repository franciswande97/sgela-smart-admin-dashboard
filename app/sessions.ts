import { createCookieSessionStorage } from "react-router";

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "idp_session",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: ["sfjdlaebfhlsfjdsaf"], // In production, move to env vars
      maxAge: 60 * 60 * 24 * 30, // 30 days, allowing the refresh token to persist
    },
  });

export { getSession, commitSession, destroySession };
