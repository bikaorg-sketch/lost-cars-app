import { prisma } from './prisma';

/**
 * Create a notification for a user.
 * Safe to call from any flow - failures are logged but don't break the parent operation.
 */
export async function createNotification({ userId, type, title, body, link }) {
  if (!userId) return null;
  try {
    return await prisma.notification.create({
      data: { userId, type, title, body: body || null, link: link || null },
    });
  } catch (err) {
    console.error('createNotification failed:', err);
    return null;
  }
}

export function truncate(s, n = 80) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}
