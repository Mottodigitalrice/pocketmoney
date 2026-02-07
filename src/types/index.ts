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
