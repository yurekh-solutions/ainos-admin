// Platform admin emails — only these accounts get the platform-wide view
// Read from ADMIN_EMAILS env var (comma-separated), with fallback defaults.
export const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}