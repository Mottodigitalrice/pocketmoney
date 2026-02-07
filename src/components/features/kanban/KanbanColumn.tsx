"use client";

import { ReactNode } from "react";
import { useTranslation } from "@/hooks/use-translation";

interface KanbanColumnProps {
  title: string;
  icon: string;
  count: number;
  color: string;
  columnType: "available" | "doing" | "done";
  children: ReactNode;
}

export function KanbanColumn({ title, icon, count, color, columnType, children }: KanbanColumnProps) {
  const { t } = useTranslation();

  const emptyIcon = columnType === "available" ? "🎯" : columnType === "doing" ? "🏃" : "🎉";
  const emptyMessage =
    columnType === "available"
      ? t("kanban_empty_available")
      : columnType === "doing"
      ? t("kanban_empty_doing")
      : t("kanban_empty_done");

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
          <span className="text-3xl mb-2">{emptyIcon}</span>
          <p className="text-sm font-medium">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
