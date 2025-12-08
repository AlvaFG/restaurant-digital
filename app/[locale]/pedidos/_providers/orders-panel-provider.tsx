"use client"

import { createContext, useContext, type PropsWithChildren } from "react"

import { useOrdersPanel, type UseOrdersPanelResult } from "@/app/[locale]/pedidos/_hooks/use-orders-panel"

const OrdersPanelContext = createContext<UseOrdersPanelResult | null>(null)

export function OrdersPanelProvider({ children }: PropsWithChildren) {
  const value = useOrdersPanel()
  return <OrdersPanelContext.Provider value={value}>{children}</OrdersPanelContext.Provider>
}

export function useOrdersPanelContext(): UseOrdersPanelResult {
  const context = useContext(OrdersPanelContext)
  if (!context) {
    throw new Error("useOrdersPanelContext must be used within an OrdersPanelProvider")
  }

  return context
}

