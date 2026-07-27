"use client";

import { createContext, useContext, type MouseEvent } from "react";

export type FloralClickHandler = (e: MouseEvent<HTMLImageElement>) => void;

const FloralClickContext = createContext<FloralClickHandler | null>(null);

export function FloralClickProvider({
  value,
  children,
}: {
  value: FloralClickHandler;
  children: React.ReactNode;
}) {
  return (
    <FloralClickContext.Provider value={value}>
      {children}
    </FloralClickContext.Provider>
  );
}

export function useFloralClick(): FloralClickHandler {
  const ctx = useContext(FloralClickContext);
  if (!ctx) {
    throw new Error("useFloralClick must be used within a FloralClickProvider");
  }
  return ctx;
}
