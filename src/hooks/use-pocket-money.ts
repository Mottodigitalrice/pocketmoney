"use client";

import { useContext } from "react";
import { PocketMoneyContext } from "@/components/providers/PocketMoneyProvider";

export function usePocketMoney() {
  const context = useContext(PocketMoneyContext);
  if (!context) {
    throw new Error("usePocketMoney must be used within a PocketMoneyProvider");
  }
  return context;
}
