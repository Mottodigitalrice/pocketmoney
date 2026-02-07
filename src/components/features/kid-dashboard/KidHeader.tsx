"use client";

import { ChildId } from "@/types";
import { CHILDREN } from "@/lib/constants";
import { SharkAvatar } from "@/components/features/avatars/SharkAvatar";
import { DolphinAvatar } from "@/components/features/avatars/DolphinAvatar";
import Link from "next/link";

interface KidHeaderProps {
  childId: ChildId;
}

export function KidHeader({ childId }: KidHeaderProps) {
  const child = CHILDREN[childId];

  return (
    <header className="flex items-center justify-between px-4 py-4 sm:px-8">
      <Link href="/" className="flex items-center gap-2 text-white/80 transition-colors hover:text-white">
        <span className="text-2xl">🏠</span>
        <span className="hidden text-sm font-medium sm:inline">Home</span>
      </Link>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12">
          {childId === "jayden" ? <SharkAvatar /> : <DolphinAvatar />}
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-extrabold text-white drop-shadow-lg sm:text-3xl">
            {child.name}&apos;s Jobs
          </h1>
          <p className="text-sm text-white/70">
            {childId === "jayden" ? "Great White Shark" : "Dolphin"} - Age {child.age}
          </p>
        </div>
      </div>
    </header>
  );
}
