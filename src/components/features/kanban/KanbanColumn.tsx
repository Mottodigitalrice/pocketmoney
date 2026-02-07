"use client";

import { ReactNode } from "react";

interface KanbanColumnProps {
  title: string;
  icon: string;
  count: number;
  color: string;
  children: ReactNode;
}

export function KanbanColumn({ title, icon, count, color, children }: KanbanColumnProps) {
  return (
    <div className="flex flex-col">
      {/* Column header */}
      <div className={`mb-4 flex items-center gap-2 rounded-2xl px-4 py-3 ${color}`}>
        <span className="text-2xl">{icon}</span>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <span className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/30 text-sm font-bold text-white">
          {count}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4">
        {children}
      </div>

      {/* Empty state */}
      {count === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/30 py-8 text-white/60">
          <span className="text-3xl mb-2">
            {title === "Available Jobs" ? "🎯" : title === "I'm Doing It!" ? "🏃" : "🎉"}
          </span>
          <p className="text-sm font-medium">
            {title === "Available Jobs"
              ? "All jobs taken!"
              : title === "I'm Doing It!"
              ? "Pick a job to start!"
              : "Complete jobs to see them here!"}
          </p>
        </div>
      )}
    </div>
  );
}
