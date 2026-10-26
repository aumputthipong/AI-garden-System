// อ่านรายชื่ออีเมล admin จาก env ADMIN_EMAILS (คั่นด้วย comma)
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}
