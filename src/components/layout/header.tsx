"use client";

import { UserButton } from "@clerk/nextjs";
import { APP_NAME } from "@/lib/constants";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">{APP_NAME}</h2>
      </div>
      <div className="flex items-center gap-4">
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
