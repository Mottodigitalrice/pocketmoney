import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { APP_NAME, APP_DESCRIPTION, ROUTES } from "@/lib/constants";

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const { userId } = await auth();
    // If logged in, redirect to dashboard
    if (userId) {
      redirect(ROUTES.dashboard);
    }
  } catch {
    // Auth not configured yet, show landing page
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          {APP_NAME}
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          {APP_DESCRIPTION}
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link href={ROUTES.signIn}>
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
