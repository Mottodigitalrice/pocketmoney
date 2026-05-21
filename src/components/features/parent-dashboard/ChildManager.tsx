"use client";

import { useState } from "react";
import { Child, ChildIcon } from "@/types";
import { CHILD_ICON_CONFIG } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { ChildForm } from "./ChildForm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BudouXText } from "@/components/shared/BudouXText";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * G2: ChildManagerSkeleton — header + 2-3 child card placeholders.
 * Exported so the parent page can switch to it during hydration. ChildManager
 * itself receives data as a prop (not from context), so it can't gate
 * internally — the parent route owns the loading branch.
 */
export function ChildManagerSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-testid="child-manager-skeleton"
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="size-7 rounded bg-amber-900/40" />
          <Skeleton className="h-5 w-40 rounded bg-amber-900/40" />
        </div>
        <Skeleton className="h-11 w-32 rounded-xl bg-amber-900/40" />
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-amber-700/20 bg-amber-900/30 p-3"
          >
            <Skeleton className="size-12 rounded-full bg-amber-900/50" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32 rounded bg-amber-900/40" />
              <Skeleton className="h-3 w-20 rounded bg-amber-900/30" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="size-11 rounded bg-amber-900/30" />
              <Skeleton className="size-11 rounded bg-amber-900/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChildManagerProps {
  crewMembers: Child[];
  onAdd: (name: string, icon: string) => void;
  onEdit: (childId: string, name: string, icon: string) => void;
  onDelete: (childId: string) => void;
}

export function ChildManager({
  crewMembers,
  onAdd,
  onEdit,
  onDelete,
}: ChildManagerProps) {
  const { t, locale } = useTranslation();
  const [formOpen, setFormOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<{
    id: string;
    name: string;
    icon: string;
  } | null>(null);
  // F12: confirm-dialog state for the destructive delete path. Tracks the
  // specific child being deleted so the dialog can show their name.
  const [deletingChild, setDeletingChild] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleAdd = () => {
    setEditingChild(null);
    setFormOpen(true);
  };

  const handleEdit = (child: Child) => {
    setEditingChild({ id: child._id, name: child.name, icon: child.icon });
    setFormOpen(true);
  };

  const handleSave = (name: string, icon: string) => {
    if (editingChild) {
      onEdit(editingChild.id, name, icon);
    } else {
      onAdd(name, icon);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">👥</span>
          <h2 className="text-lg font-bold text-amber-100">
            {t("child_manager_header", { count: crewMembers.length })}
          </h2>
        </div>
        <Button
          onClick={handleAdd}
          className="min-h-11 bg-amber-600 font-bold text-white hover:bg-amber-700"
        >
          {t("child_manager_add_btn")}
        </Button>
      </div>

      {/* Child list or empty state */}
      {crewMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-amber-700/30 bg-amber-900/30 px-6 py-12 text-center backdrop-blur-sm">
          <span className="text-5xl">🏴‍☠️</span>
          <p className="text-lg font-semibold text-amber-200">
            {t("child_manager_empty_title")}
          </p>
          <p className="text-sm text-amber-300/70">
            {t("child_manager_empty_subtitle")}
          </p>
          <Button
            onClick={handleAdd}
            className="mt-2 min-h-11 bg-amber-600 font-bold text-white hover:bg-amber-700"
          >
            {t("child_manager_empty_cta")}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {crewMembers.map((child) => {
            const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
            // F12: locale-aware sea-creature label (was English-only).
            const iconLabel = iconConfig
              ? locale === "ja"
                ? iconConfig.labelJa
                : iconConfig.label
              : t("child_icon_fallback_label");
            return (
              <div
                key={child._id}
                data-testid="child-row"
                data-child-name={child.name}
                data-child-id={child._id}
                className="flex items-center gap-3 rounded-xl border border-amber-700/20 bg-amber-900/30 p-3 backdrop-blur-sm"
              >
                {/* Icon */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    iconConfig?.bgColor ?? "bg-amber-800/80"
                  } border-2 ${iconConfig?.borderColor ?? "border-amber-400"}`}
                >
                  <span className="text-2xl">{iconConfig?.emoji ?? "🐟"}</span>
                </div>

                {/* Name and label */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-amber-100">
                    {child.name}
                  </h3>
                  <p className="text-xs text-amber-300/60">{iconLabel}</p>
                </div>

                {/* Actions */}
                {/* F20: icon buttons bumped to size="icon" (h-9 w-9) +
                    min-h-11/min-w-11 floors so emoji actions hit ≥44px. */}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(child)}
                    aria-label={t("child_manager_edit_aria", {
                      name: child.name,
                    })}
                    className="min-h-11 min-w-11 text-base text-amber-300 hover:bg-amber-800/40 hover:text-amber-100"
                  >
                    ✏️
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    // F12: route delete through confirm dialog instead of
                    // calling onDelete immediately. The dialog confirms the
                    // cascade impact (wallet, history, scheduled jobs).
                    onClick={() =>
                      setDeletingChild({ id: child._id, name: child.name })
                    }
                    data-testid="child-row-delete"
                    aria-label={t("child_manager_delete_aria", {
                      name: child.name,
                    })}
                    className="min-h-11 min-w-11 text-base text-red-400 hover:bg-red-900/40 hover:text-red-300"
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Child form dialog */}
      <ChildForm
        key={`${editingChild?.id ?? "new"}-${formOpen ? "open" : "closed"}`}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        editingChild={editingChild}
      />

      {/* F12 — Delete-child confirmation dialog */}
      <ConfirmDialog
        open={!!deletingChild}
        onClose={() => setDeletingChild(null)}
        onConfirm={() => {
          if (deletingChild) onDelete(deletingChild.id);
        }}
        title={t("child_delete_confirm_title", {
          name: deletingChild?.name ?? "",
        })}
        body={<BudouXText>{t("child_delete_confirm_body")}</BudouXText>}
        confirmLabel={t("child_delete_confirm_cta")}
        cancelLabel={t("child_delete_confirm_cancel")}
        confirmTestId="child-delete-confirm"
      />
    </div>
  );
}
