"use client";

import { useState, useEffect } from "react";
import { ChildIcon } from "@/types";
import { CHILD_ICON_CONFIG } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<ChildIcon>("shark");

  // Pre-fill form when editing or reset when adding
  useEffect(() => {
    if (open) {
      if (editingChild) {
        setName(editingChild.name);
        setSelectedIcon(editingChild.icon as ChildIcon);
      } else {
        setName("");
        setSelectedIcon("shark");
      }
    }
  }, [open, editingChild]);

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
            {isEditing ? "Edit Crew Member" : "Add Crew Member"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name field */}
          <div>
            <Label className="text-amber-200">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter their name..."
              className="mt-1 border-amber-700/50 bg-amber-900/50 text-amber-100 placeholder:text-amber-500"
              autoFocus
            />
          </div>

          {/* Icon selection grid */}
          <div>
            <Label className="text-amber-200">Choose an icon</Label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {iconKeys.map((key) => {
                const config = CHILD_ICON_CONFIG[key];
                const isSelected = selectedIcon === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setSelectedIcon(key)}
                    className={`flex flex-col items-center gap-1 rounded-xl p-3 transition-all ${
                      isSelected
                        ? "bg-amber-600 ring-2 ring-amber-400"
                        : "bg-amber-800/40 hover:bg-amber-800/60"
                    }`}
                  >
                    <span className="text-2xl">{config.emoji}</span>
                    <span className="text-xs font-medium text-amber-200">
                      {config.label}
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
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-amber-600 font-bold text-white hover:bg-amber-700"
            >
              {isEditing ? "Save Changes" : "Add to Crew"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
