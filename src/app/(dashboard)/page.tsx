"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckCircle, Archive } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function DashboardPage() {
  const { user } = useUser();

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

  const activeCount = items?.filter((i) => i.status === "active").length ?? 0;
  const completedCount = items?.filter((i) => i.status === "completed").length ?? 0;
  const archivedCount = items?.filter((i) => i.status === "archived").length ?? 0;
  const totalCount = items?.length ?? 0;

  const isLoading = convexUser === undefined || items === undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalCount}</div>
                <p className="text-xs text-muted-foreground">
                  {totalCount === 0 ? "Start adding items" : "items total"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeCount}</div>
                <p className="text-xs text-muted-foreground">in progress</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-2xl font-bold">{completedCount}</div>
                <p className="text-xs text-muted-foreground">done</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-2xl font-bold">{archivedCount}</div>
                <p className="text-xs text-muted-foreground">archived</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This is your demo dashboard. Start by adding some items to track.
          </p>
          <Link href={ROUTES.items}>
            <Button>Go to Items</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
