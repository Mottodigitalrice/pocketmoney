"use client";

import { useState, useEffect } from "react";
import { Job, JobPriority, RecurrenceType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/use-translation";
import type { TranslationKey } from "@/lib/i18n/translations";
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
    icon: string;
    requiresPhotoProof?: boolean;
    recurrence?: {
      type: RecurrenceType;
      daysOfWeek?: number[];
      priority?: JobPriority;
    };
  }) => void;
  editingJob?: Job;
}

const ICONS = [
  "👕", "🧸", "🛏️", "🍽️", "🌱", "👟", "🐾", "📚", "🧹", "🧺",
  "🏠", "🛋️", "🪥", "🎒", "🛒", "🪟", "♻️", "👨‍🍳", "🧽", "🪣",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function JobForm({
  open,
  onClose,
  onSave,
  editingJob,
}: JobFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [yenAmount, setYenAmount] = useState(100);
  const [icon, setIcon] = useState("👕");
  const [recurrenceType, setRecurrenceType] =
    useState<RecurrenceType>("none");
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [recurrencePriority, setRecurrencePriority] =
    useState<JobPriority>("optional");
  const [requiresPhotoProof, setRequiresPhotoProof] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(editingJob?.title ?? "");
      setYenAmount(editingJob?.yenAmount ?? 100);
      setIcon(editingJob?.icon ?? "👕");
      setRecurrenceType(editingJob?.recurrence?.type ?? "none");
      setRecurrenceDays(editingJob?.recurrence?.daysOfWeek ?? []);
      setRecurrencePriority(editingJob?.recurrence?.priority ?? "optional");
      setRequiresPhotoProof(editingJob?.requiresPhotoProof ?? false);
    }
  }, [open, editingJob]);

  const toggleRecurrenceDay = (index: number) => {
    setRecurrenceDays((current) =>
      current.includes(index)
        ? current.filter((day) => day !== index)
        : [...current, index].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      onSave({
        title: title.trim(),
        yenAmount,
        icon,
        requiresPhotoProof,
        recurrence: {
          type: recurrenceType,
          daysOfWeek:
            recurrenceType === "specificDays" ? recurrenceDays : undefined,
          priority: recurrencePriority,
        },
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

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

          <div className="flex items-center justify-between rounded-xl border border-amber-700/25 bg-amber-900/25 p-3">
            <div className="space-y-1">
              <Label
                htmlFor="requires-photo-proof"
                className="text-amber-200"
              >
                {t("job_form_photo_proof_label")}
              </Label>
              <p className="text-xs text-amber-300/70">
                {t("job_form_photo_proof_hint")}
              </p>
            </div>
            <Switch
              id="requires-photo-proof"
              checked={requiresPhotoProof}
              onCheckedChange={setRequiresPhotoProof}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-amber-700/25 bg-amber-900/25 p-3">
            <Label className="text-amber-200">
              {t("job_form_recurrence_label")}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(["none", "daily", "weekdays", "specificDays"] as RecurrenceType[]).map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRecurrenceType(type)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                      recurrenceType === type
                        ? "border-amber-400 bg-amber-600 text-white"
                        : "border-amber-700/30 bg-amber-950/30 text-amber-300 hover:bg-amber-800/40"
                    }`}
                  >
                    {t(`recurrence_${type}` as TranslationKey)}
                  </button>
                )
              )}
            </div>

            {recurrenceType === "specificDays" && (
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day, index) => {
                  const selected = recurrenceDays.includes(index);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleRecurrenceDay(index)}
                      className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                        selected
                          ? "border-amber-400 bg-amber-600 text-white"
                          : "border-amber-700/30 bg-amber-950/30 text-amber-300 hover:bg-amber-800/40"
                      }`}
                    >
                      {t(`recurrence_day_${index}` as TranslationKey)}
                    </button>
                  );
                })}
              </div>
            )}

            {recurrenceType !== "none" && (
              <div className="grid grid-cols-2 gap-2">
                {(["optional", "mustDo"] as JobPriority[]).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setRecurrencePriority(priority)}
                    className={`rounded-lg border px-3 py-2 text-sm font-bold transition-all ${
                      recurrencePriority === priority
                        ? "border-amber-400 bg-amber-600 text-white"
                        : "border-amber-700/30 bg-amber-950/30 text-amber-300 hover:bg-amber-800/40"
                    }`}
                  >
                    {priority === "mustDo"
                      ? t("planner_priority_must")
                      : t("planner_priority_optional")}
                  </button>
                ))}
              </div>
            )}
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
