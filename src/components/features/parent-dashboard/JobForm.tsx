"use client";

import { useState, useEffect } from "react";
import { Job, Child } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/use-translation";
import { CHILD_ICON_CONFIG } from "@/lib/constants";
import type { ChildIcon } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface JobFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (job: {
    title: string;
    titleJa?: string;
    yenAmount: number;
    assignedTo: string;
    dailyLimit: number;
    weeklyLimit: number;
    icon: string;
  }) => void;
  editingJob?: Job;
  children: Child[];
}

const ICONS = [
  "👕", "🧸", "🛏️", "🍽️", "🌱", "👟", "🐾", "📚", "🧹", "🧺",
  "🏠", "🛋️", "🪥", "🎒", "🛒", "🪟", "♻️", "👨‍🍳", "🧽", "🪣",
];

export function JobForm({
  open,
  onClose,
  onSave,
  editingJob,
  children: familyChildren,
}: JobFormProps) {
  const { t, locale } = useTranslation();
  const [title, setTitle] = useState("");
  const [yenAmount, setYenAmount] = useState(100);
  const [assignedTo, setAssignedTo] = useState("all");
  const [dailyLimit, setDailyLimit] = useState(1);
  const [weeklyLimit, setWeeklyLimit] = useState(7);
  const [icon, setIcon] = useState("👕");
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when opening/closing or when editingJob changes
  useEffect(() => {
    if (open) {
      setTitle(editingJob?.title ?? "");
      setYenAmount(editingJob?.yenAmount ?? 100);
      setAssignedTo(editingJob?.assignedTo ?? "all");
      setDailyLimit(editingJob?.dailyLimit ?? 1);
      setWeeklyLimit(editingJob?.weeklyLimit ?? 7);
      setIcon(editingJob?.icon ?? "👕");
    }
  }, [open, editingJob]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      let titleEn = title.trim();
      let titleJa: string | undefined;

      // Auto-translate the title to the other language
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: title.trim(), from: locale }),
        });
        if (res.ok) {
          const { translated } = await res.json();
          if (locale === "ja") {
            // User typed in Japanese - translated is English
            titleJa = title.trim();
            titleEn = translated;
          } else {
            // User typed in English - translated is Japanese
            titleJa = translated;
          }
        }
      } catch {
        // Translation failed silently - save with original title only
      }

      onSave({
        title: titleEn,
        titleJa,
        yenAmount,
        assignedTo,
        dailyLimit,
        weeklyLimit,
        icon,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Build assignment options: "All Children" + each child
  const assignmentOptions = [
    { value: "all", label: t("job_form_assigned_both") },
    ...familyChildren.map((child) => {
      const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
      return {
        value: child._id,
        label: `${iconConfig?.emoji ?? ""} ${child.name}`,
      };
    }),
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-amber-700/50 bg-amber-950 text-amber-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-100">
            {editingJob ? t("job_form_edit_title") : t("job_form_add_title")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-amber-200">
              {t("job_form_name_label")}
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("job_form_name_placeholder")}
              className="border-amber-700/50 bg-amber-900/50 text-amber-100 placeholder:text-amber-500"
            />
          </div>

          <div>
            <Label className="text-amber-200">
              {t("job_form_icon_label")}
            </Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {ICONS.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`rounded-lg p-2 text-xl transition-all ${
                    icon === ic
                      ? "bg-amber-600 ring-2 ring-amber-400"
                      : "bg-amber-800/40 hover:bg-amber-800/60"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-amber-200">
              {t("job_form_yen_label")}
            </Label>
            <Input
              type="number"
              value={yenAmount}
              onChange={(e) => setYenAmount(Number(e.target.value))}
              min={10}
              step={10}
              className="border-amber-700/50 bg-amber-900/50 text-amber-100"
            />
          </div>

          <div>
            <Label className="text-amber-200">
              {t("job_form_assigned_label")}
            </Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {assignmentOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setAssignedTo(opt.value)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                    assignedTo === opt.value
                      ? "bg-amber-600 text-white"
                      : "bg-amber-800/40 text-amber-300 hover:bg-amber-800/60"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-amber-200">
                {t("job_form_daily_label")}
              </Label>
              <Input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                min={1}
                className="border-amber-700/50 bg-amber-900/50 text-amber-100"
              />
            </div>
            <div>
              <Label className="text-amber-200">
                {t("job_form_weekly_label")}
              </Label>
              <Input
                type="number"
                value={weeklyLimit}
                onChange={(e) => setWeeklyLimit(Number(e.target.value))}
                min={1}
                className="border-amber-700/50 bg-amber-900/50 text-amber-100"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-amber-700/50 text-amber-300 hover:bg-amber-800/40"
            >
              {t("job_form_cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-amber-600 font-bold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {isSaving
                ? "..."
                : editingJob
                  ? t("job_form_save")
                  : t("job_form_add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
