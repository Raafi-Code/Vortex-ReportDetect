export const DEFAULT_ALLOWED_EMAIL = "vortex.ryurex@gmail.com";

export const allowedLoginEmail = (
  process.env.NEXT_PUBLIC_ALLOWED_LOGIN_EMAIL || DEFAULT_ALLOWED_EMAIL
)
  .trim()
  .toLowerCase();

export function isAllowedUserEmail(email) {
  return (email || "").trim().toLowerCase() === allowedLoginEmail;
}
