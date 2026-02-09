import type { Metadata } from "next";
import { LandingPage } from "./LandingPage";

export const metadata: Metadata = {
  title: "PocketMoney — Turn Chores Into Treasure",
  description:
    "Kids earn real pocket money by completing household chores. A fun, bilingual (English & Japanese) family app. Free to use.",
};

export default function LandingPageRoute() {
  return <LandingPage />;
}
