import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  // Check onboarding status
  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    select: { onboardingDone: true },
  });

  if (!user?.onboardingDone) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
