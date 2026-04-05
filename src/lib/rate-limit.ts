import { PrismaClient } from "@prisma/client";

const MAX_MESSAGES_PER_HOUR = 50;
const ONE_HOUR_MS = 60 * 60 * 1000;

export async function checkRateLimit(
  userId: string,
  prisma: PrismaClient
): Promise<{ allowed: boolean; remainingMinutes?: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      chatCount: true,
      chatCountReset: true,
    },
  });

  if (!user) {
    return { allowed: false };
  }

  const now = new Date();
  const resetTime = user.chatCountReset ? new Date(user.chatCountReset) : null;

  // If no reset time set or the hour window has passed, reset the counter
  if (!resetTime || now.getTime() - resetTime.getTime() >= ONE_HOUR_MS) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        chatCount: 1,
        chatCountReset: now,
        lastChatAt: now,
      },
    });
    return { allowed: true };
  }

  // Within the hour window
  if (user.chatCount >= MAX_MESSAGES_PER_HOUR) {
    const msRemaining = ONE_HOUR_MS - (now.getTime() - resetTime.getTime());
    const remainingMinutes = Math.ceil(msRemaining / 60000);
    return { allowed: false, remainingMinutes };
  }

  // Increment counter
  await prisma.user.update({
    where: { id: userId },
    data: {
      chatCount: { increment: 1 },
      lastChatAt: now,
    },
  });

  return { allowed: true };
}
