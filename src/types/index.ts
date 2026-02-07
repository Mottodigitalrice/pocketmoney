// Common types used across the application

export type Status = "active" | "completed" | "archived";

export interface User {
  _id: string;
  clerkId: string;
  email: string;
  name?: string;
  imageUrl?: string;
  createdAt: number;
}

// PocketMoney types

export type ChildIcon =
  | "shark"
  | "dolphin"
  | "turtle"
  | "octopus"
  | "starfish"
  | "whale"
  | "crab"
  | "fish";

export interface Child {
  _id: string;
  userId: string;
  name: string;
  icon: ChildIcon;
  createdAt: number;
}

export type JobAssignment = "all" | string; // "all" or child _id

export interface Job {
  _id: string;
  userId: string;
  title: string;
  titleJa?: string;
  titleKey?: string;
  yenAmount: number;
  assignedTo: JobAssignment;
  dailyLimit: number;
  weeklyLimit: number;
  icon: string;
  createdAt: number;
}

export type JobStatus =
  | "in_progress"
  | "completed"
  | "approved"
  | "rejected";

export interface JobInstance {
  _id: string;
  userId: string;
  jobId: string;
  childId: string;
  status: JobStatus;
  startedAt?: number;
  completedAt?: number;
  approvedAt?: number;
  createdAt: number;
}

export interface JobInstanceWithJob extends JobInstance {
  job: Job;
}
