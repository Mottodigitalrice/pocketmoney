"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Archive, Trash2 } from "lucide-react";
import { useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";

export default function ItemsPage() {
  const { user } = useUser();
  const [newTitle, setNewTitle] = useState("");

  // Get Convex user from Clerk ID
  const convexUser = useQuery(
    api.functions.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get items for user
  const items = useQuery(
    api.functions.items.getByUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const createItem = useMutation(api.functions.items.create);
  const updateItem = useMutation(api.functions.items.update);
  const removeItem = useMutation(api.functions.items.remove);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !convexUser?._id) return;

    await createItem({
      userId: convexUser._id,
      title: newTitle.trim(),
    });
    setNewTitle("");
  };

  const handleStatusChange = async (
    id: Id<"items">,
    status: "active" | "completed" | "archived"
  ) => {
    await updateItem({ id, status });
  };

  const handleDelete = async (id: Id<"items">) => {
    await removeItem({ id });
  };

  // Loading state
  if (convexUser === undefined || items === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  // User not synced yet
  if (!convexUser) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Items</h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Setting up your account...
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeItems = items.filter((i) => i.status === "active");
  const completedItems = items.filter((i) => i.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Items</h1>
        <p className="text-muted-foreground">Manage your items</p>
      </div>

      {/* Add new item */}
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          placeholder="Add a new item..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={!newTitle.trim()}>
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </form>

      {/* Active items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Active
            <Badge variant="secondary">{activeItems.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No active items. Add one above!
            </p>
          ) : (
            <ul className="space-y-2">
              {activeItems.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span>{item.title}</span>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleStatusChange(item._id, "completed")}
                      title="Mark complete"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleStatusChange(item._id, "archived")}
                      title="Archive"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(item._id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Completed items */}
      {completedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              Completed
              <Badge variant="outline">{completedItems.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {completedItems.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center justify-between rounded-lg border p-3 opacity-60"
                >
                  <span className="line-through">{item.title}</span>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleStatusChange(item._id, "active")}
                      title="Restore"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(item._id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
