/**
 * G4 — RTL test setup.
 *
 * - `@testing-library/jest-dom/vitest` extends `expect` with DOM matchers
 *   (toBeInTheDocument, toHaveTextContent, …).
 * - `cleanup()` runs after each test so the jsdom container doesn't leak
 *   between specs. RTL ≥ 13 cleans up automatically when `globals: true`,
 *   but we register it defensively so behavior is identical regardless of
 *   the auto-cleanup heuristic.
 * - Global `convex/react` mock so components calling `useQuery` / `useMutation`
 *   don't try to hit a real Convex client. Each component test is responsible
 *   for *what* it does with usePocketMoney — these mocks just keep the import
 *   chain (provider → convex/react) from blowing up.
 * - Clerk hooks are mocked the same way for components that import them.
 *
 * Per-test files can `vi.mock(...)` to override these defaults.
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => vi.fn().mockResolvedValue(undefined)),
  useConvexAuth: vi.fn(() => ({ isAuthenticated: true, isLoading: false })),
  useAction: vi.fn(() => vi.fn().mockResolvedValue(undefined)),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: vi.fn(() => ({ user: null, isLoaded: true, isSignedIn: false })),
  useAuth: vi.fn(() => ({ isLoaded: true, isSignedIn: false, userId: null })),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
}));
