import { describe, expect, it } from "vitest"

import { cn } from "@/lib/utils"

describe("cn", () => {
  it("combina cadenas condicionales y elimina duplicados de Tailwind", () => {
    const result = cn("px-4", false && "py-2", "text-sm", "text-sm", { hidden: false, block: true })

    expect(result).toBe("px-4 text-sm block")
  })

  it("prioriza clases de utilidad mas especificas cuando hay conflicto", () => {
    const result = cn("grid", "grid-cols-2", "grid-cols-4", "sm:grid-cols-6")

    expect(result).toBe("grid grid-cols-4 sm:grid-cols-6")
  })
})
