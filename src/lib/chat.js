import { prisma } from './prisma';

export async function canAccessConversation(conversation, currentUser) {
  if (!conversation || !currentUser) return false;
  if (currentUser.role === 'admin') return true;
  if (conversation.initiatorId === currentUser.id) return true;
  if (conversation.type === 'report' && conversation.report?.ownerId === currentUser.id) {
    return true;
  }
  return false;
}

export async function getOrCreateConversation({ type, reportId, currentUser }) {
  if (type === 'support') {
    let conv = await prisma.conversation.findFirst({
      where: { type: 'support', initiatorId: currentUser.id },
    });
    if (!conv) {
      conv = await prisma.conversation.create({
        data: { type: 'support', initiatorId: currentUser.id },
      });
    }
    return conv;
  }

  if (type === 'report') {
    if (!reportId) throw new Error('reportId required for report conversation');
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, ownerId: true },
    });
    if (!report) throw new Error('report not found');

    if (report.ownerId === currentUser.id) {
      throw new Error('OWN_REPORT');
    }

    let conv = await prisma.conversation.findFirst({
      where: { type: 'report', reportId, initiatorId: currentUser.id },
    });
    if (!conv) {
      conv = await prisma.conversation.create({
        data: { type: 'report', reportId, initiatorId: currentUser.id },
      });
    }
    return conv;
  }

  throw new Error('invalid conversation type');
}

export function conversationLabel(conversation, currentUserId) {
  if (conversation.type === 'support') {
    return conversation.initiator?.id === currentUserId
      ? 'دعم المنصة'
      : `محادثة دعم — ${conversation.initiator?.name || 'مستخدم'}`;
  }
  if (conversation.type === 'report') {
    const report = conversation.report;
    if (!report) return 'بلاغ';
    const car = `${report.brand} ${report.model}`;
    const identifier = report.plateNumber || report.chassisNumber || '';
    return identifier ? `${car} (${identifier})` : car;
  }
  return 'محادثة';
}
