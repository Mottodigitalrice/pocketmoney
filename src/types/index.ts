// Common types used across the application

export type Status = "active" | "completed" | "archived";

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name?: string;
  imageUrl?: string;
  createdAt: number;
}

export interface Item {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: Status;
  createdAt: number;
  updatedAt: number;
}

// PocketMoney types

export type ChildId = "jayden" | "tyler";

export type JobAssignment = "both" | ChildId;

export interface Job {
  id: string;
  title: string;
  yenAmount: number;
  assignedTo: JobAssignment;
  dailyLimit: number;
  weeklyLimit: number;
  icon: string;
}

export type JobStatus = "available" | "in_progress" | "completed" | "approved" | "rejected";

export interface KidJobInstance {
  id: string;
  jobId: string;
  childId: ChildId;
  status: JobStatus;
  startedAt?: number;
  completedAt?: number;
  approvedAt?: number;
}

export interface Child {
  id: ChildId;
  name: string;
  age: number;
  creature: "shark" | "dolphin";
}
