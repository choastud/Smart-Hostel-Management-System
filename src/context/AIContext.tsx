"use client";

import React, { createContext, useContext, ReactNode } from 'react';

interface AIContextProps {
  apiKey: string;
}

const AIContext = createContext<AIContextProps | undefined>(undefined);

export function AIProvider({ apiKey, children }: { apiKey: string; children: ReactNode }) {
  return <AIContext.Provider value={{ apiKey }}>{children}</AIContext.Provider>;
}

export function useAI() {
  const ctx = useContext(AIContext);
  if (!ctx) {
    throw new Error('useAI must be used within AIProvider');
  }
  return ctx;
}
