"use client";

import { useState } from "react";
import { ChildIcon } from "@/types";
import { CHILD_ICON_CONFIG } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/use-translation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChildFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, icon: string) => void;
  editingChild?: { name: string; icon: string } | null;
}

const iconKeys = Object.keys(CHILD_ICON_CONFIG) as ChildIcon[];

export function ChildForm({ open, onClose, onSave, editingChild }: ChildFormProps) {
  const { t, locale } = useTranslation();
  const [name, setName] = useState(() => editingChild?.name ?? "");
  const [selectedIcon, setSelectedIcon] = useState<ChildIcon>(
    () => (editingChild?.icon as ChildIcon | undefined) ?? "shark"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), selectedIcon);
    onClose();
  };

  const isEditing = !!editingChild;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-amber-700/50 bg-amber-950 text-amber-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-100">
            {isEditing ? t("child_form_edit_title") : t("child_form_add_title")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name field */}
          <div>
            <Label htmlFor="child-form-name" className="text-amber-200">
              {t("child_form_name_label")}
            </Label>
            <Input
              id="child-form-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("child_form_name_placeholder")}
              className="mt-1 border-amber-700/50 bg-amber-900/50 text-amber-100 placeholder:text-amber-500 focus-visible:ring-2 focus-visible:ring-amber-400"
              autoFocus
            />
          </div>

          {/* Icon selection grid */}
          <div>
            {/* F19 a11y: heading for the toggle-button group below. Use a
                non-form span (not Label) — the buttons each have their own
                aria-label, and the radiogroup wraps the lot. */}
            <span className="text-sm font-medium leading-none text-amber-200">
              {t("child_form_icon_label")}
            </span>
            <div
              role="radiogroup"
              aria-label={t("child_form_icon_label")}
              className="mt-2 grid grid-cols-4 gap-2"
            >
              {iconKeys.map((key) => {
                const config = CHILD_ICON_CONFIG[key];
                const isSelected = selectedIcon === key;
                // F12: locale-aware sea creature labels — `labelJa` is in
                // CHILD_ICON_CONFIG and was previously ignored on this form.
                const iconLabel = locale === "ja" ? config.labelJa : config.label;
                return (
                  <button
                    type="button"
                    key={key}
                    role="radio"
                    onClick={() => setSelectedIcon(key)}
                    aria-label={iconLabel}
                    aria-checked={isSelected}
                    className={`flex flex-col items-center gap-1 rounded-xl p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      isSelected
                        ? "bg-amber-600 ring-2 ring-amber-400"
                        : "bg-amber-800/40 hover:bg-amber-800/60"
                    }`}
                  >
                    <span className="text-2xl" aria-hidden="true">{config.emoji}</span>
                    <span className="text-xs font-medium text-amber-200">
                      {iconLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-amber-700/50 text-amber-300 hover:bg-amber-800/40"
            >
              {t("child_form_cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-amber-600 font-bold text-white hover:bg-amber-700"
            >
              {isEditing ? t("child_form_save_edit") : t("child_form_save_add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
