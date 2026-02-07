"use client";

import { useState } from "react";
import { Job, JobAssignment } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface JobFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (job: Omit<Job, "id">) => void;
  editingJob?: Job;
}

const ICONS = ["👕", "🧸", "🛏️", "🍽️", "🌱", "👟", "🐾", "📚", "🧹", "🧺", "🏠", "🛋️", "🪥", "🎒", "🛒", "🪟", "♻️", "👨‍🍳", "🧽", "🪣"];

export function JobForm({ open, onClose, onSave, editingJob }: JobFormProps) {
  const [title, setTitle] = useState(editingJob?.title ?? "");
  const [yenAmount, setYenAmount] = useState(editingJob?.yenAmount ?? 100);
  const [assignedTo, setAssignedTo] = useState<JobAssignment>(editingJob?.assignedTo ?? "both");
  const [dailyLimit, setDailyLimit] = useState(editingJob?.dailyLimit ?? 1);
  const [weeklyLimit, setWeeklyLimit] = useState(editingJob?.weeklyLimit ?? 7);
  const [icon, setIcon] = useState(editingJob?.icon ?? "👕");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, yenAmount, assignedTo, dailyLimit, weeklyLimit, icon });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-amber-700/50 bg-amber-950 text-amber-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-100">
            {editingJob ? "Edit Job" : "Add New Job"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-amber-200">Job Name</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Clean up toys"
              className="border-amber-700/50 bg-amber-900/50 text-amber-100 placeholder:text-amber-500"
            />
          </div>

          <div>
            <Label className="text-amber-200">Icon</Label>
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
            <Label className="text-amber-200">Yen Amount (¥)</Label>
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
            <Label className="text-amber-200">Assigned To</Label>
            <div className="mt-1 flex gap-2">
              {[
                { value: "both" as const, label: "Both Kids" },
                { value: "jayden" as const, label: "🦈 Jayden" },
                { value: "tyler" as const, label: "🐬 Tyler" },
              ].map((opt) => (
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
              <Label className="text-amber-200">Daily Limit</Label>
              <Input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                min={1}
                className="border-amber-700/50 bg-amber-900/50 text-amber-100"
              />
            </div>
            <div>
              <Label className="text-amber-200">Weekly Limit</Label>
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
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-amber-600 font-bold text-white hover:bg-amber-700"
            >
              {editingJob ? "Save Changes" : "Add Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
