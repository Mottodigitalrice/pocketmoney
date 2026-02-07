"use client";

import { useState, useEffect } from "react";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CHILD_ICON_CONFIG } from "@/lib/constants";
import type { ChildIcon } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OneOffTaskFormProps {
  open: boolean;
  onClose: () => void;
}

const ICONS = [
  "👕", "🧸", "🛏️", "🍽️", "🌱", "👟", "🐾", "📚", "🧹", "🧺",
  "🏠", "🛋️", "🪥", "🎒", "🛒", "🪟", "♻️", "👨‍🍳", "🧽", "🪣",
];

export function OneOffTaskForm({ open, onClose }: OneOffTaskFormProps) {
  const { t, locale } = useTranslation();
  const { familyChildren, createOneOff } = usePocketMoney();

  const [title, setTitle] = useState("");
  const [yenAmount, setYenAmount] = useState(100);
  const [icon, setIcon] = useState("🧹");
  const [childId, setChildId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setYenAmount(100);
      setIcon("🧹");
      setChildId(familyChildren[0]?._id ?? "");
    }
  }, [open, familyChildren]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !childId || isSaving) return;

    setIsSaving(true);
    try {
      let titleEn = title.trim();
      let titleJa: string | undefined;

      // Auto-translate
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: title.trim(), from: locale }),
        });
        if (res.ok) {
          const { translated } = await res.json();
          if (locale === "ja") {
            titleJa = title.trim();
            titleEn = translated;
          } else {
            titleJa = translated;
          }
        }
      } catch {
        // Translation failed silently
      }

      await createOneOff(titleEn, titleJa, yenAmount, icon, childId);
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
            {t("oneoff_title")}
          </DialogTitle>
          <p className="text-sm text-amber-300/60">{t("oneoff_subtitle")}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-amber-200">
              {t("job_form_name_label")}
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("oneoff_name_placeholder")}
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
              {t("oneoff_assign_to")}
            </Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {familyChildren.map((child) => {
                const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
                return (
                  <button
                    type="button"
                    key={child._id}
                    onClick={() => setChildId(child._id)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                      childId === child._id
                        ? "bg-amber-600 text-white"
                        : "bg-amber-800/40 text-amber-300 hover:bg-amber-800/60"
                    }`}
                  >
                    {iconConfig?.emoji ?? ""} {child.name}
                  </button>
                );
              })}
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
              disabled={isSaving || !title.trim() || !childId}
              className="flex-1 bg-amber-600 font-bold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {isSaving ? "..." : t("oneoff_create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
