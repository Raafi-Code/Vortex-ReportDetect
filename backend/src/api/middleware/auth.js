import { createClient } from "@supabase/supabase-js";
import config from "../../config.js";

/**
 * Validate Supabase JWT from Authorization header.
 */
const authClient = createClient(config.supabase.url, config.supabase.anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing bearer token. Provide Authorization: Bearer <token>.",
    });
  }

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token.",
    });
  }

  const allowedEmail = config.auth.allowedEmail;
  const userEmail = (data.user.email || "").trim().toLowerCase();
  if (allowedEmail && userEmail !== allowedEmail) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Your account is not allowed to access this API.",
    });
  }

  req.user = data.user;
  next();
}
