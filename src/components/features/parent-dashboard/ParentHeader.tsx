"use client";

import Link from "next/link";
import { PirateAvatar } from "@/components/features/avatars/PirateAvatar";

export function ParentHeader() {
  return (
    <header className="flex items-center justify-between border-b border-amber-800/30 px-4 py-4 sm:px-8">
      <Link href="/" className="flex items-center gap-2 text-amber-300/80 transition-colors hover:text-amber-200">
        <span className="text-2xl">🏠</span>
        <span className="hidden text-sm font-medium sm:inline">Home</span>
      </Link>

      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-amber-100 drop-shadow-lg sm:text-3xl">
            Captain&apos;s Bridge
          </h1>
          <p className="text-right text-sm text-amber-300/70">
            Mummy & Daddy&apos;s Command Center
          </p>
        </div>
        <div className="h-12 w-12">
          <PirateAvatar />
        </div>
      </div>
    </header>
  );
}
