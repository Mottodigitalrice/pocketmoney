"use client";

import { useState } from "react";
import { Child, ChildIcon } from "@/types";
import { CHILD_ICON_CONFIG } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ChildForm } from "./ChildForm";

interface ChildManagerProps {
  children: Child[];
  onAdd: (name: string, icon: string) => void;
  onEdit: (childId: string, name: string, icon: string) => void;
  onDelete: (childId: string) => void;
}

export function ChildManager({
  children,
  onAdd,
  onEdit,
  onDelete,
}: ChildManagerProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<{
    id: string;
    name: string;
    icon: string;
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
            Crew Members ({children.length})
          </h2>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-amber-600 font-bold text-white hover:bg-amber-700"
        >
          + Add Child
        </Button>
      </div>

      {/* Child list or empty state */}
      {children.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-700/30 bg-amber-900/30 p-10 text-center backdrop-blur-sm">
          <span className="text-5xl">🏴‍☠️</span>
          <p className="text-lg font-semibold text-amber-200">
            No crew members yet!
          </p>
          <p className="text-sm text-amber-300/60">
            Add your first little pirate to get started.
          </p>
          <Button
            onClick={handleAdd}
            className="mt-2 bg-amber-600 font-bold text-white hover:bg-amber-700"
          >
            + Add Crew Member
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {children.map((child) => {
            const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
            return (
              <div
                key={child._id}
                className="flex items-center gap-3 rounded-xl border border-amber-700/20 bg-amber-900/30 p-3 backdrop-blur-sm"
              >
                {/* Icon */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    iconConfig?.bgColor ?? "bg-amber-800/80"
                  } border-2 ${iconConfig?.borderColor ?? "border-amber-400"}`}
                >
                  <span className="text-2xl">
                    {iconConfig?.emoji ?? "🐟"}
                  </span>
                </div>

                {/* Name and label */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-amber-100">
                    {child.name}
                  </h3>
                  <p className="text-xs text-amber-300/60">
                    {iconConfig?.label ?? "Fish"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(child)}
                    className="text-amber-300 hover:bg-amber-800/40 hover:text-amber-100"
                  >
                    ✏️
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(child._id)}
                    className="text-red-400 hover:bg-red-900/40 hover:text-red-300"
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
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        editingChild={editingChild}
      />
    </div>
  );
}
