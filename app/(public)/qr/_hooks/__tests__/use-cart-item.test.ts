import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import { useCartItem } from "../use-cart-item"
import type { CartItemModifier, ModifierGroup, ModifierSelection } from "../../_types/modifiers"

describe("useCartItem", () => {
  // Helper to get hook functions
  const getHookFunctions = () => {
    const { result } = renderHook(() => useCartItem())
    return result.current
  }

  describe("calculateItemTotal", () => {
    it("should calculate correctly with base price and no modifiers", () => {
      const { calculateItemTotal } = getHookFunctions()
      const result = calculateItemTotal(2500, [])
      expect(result).toBe(2500)
    })

    it("should add positive modifier prices", () => {
      const { calculateItemTotal } = getHookFunctions()
      const modifiers: CartItemModifier[] = [
        { groupId: "g1", groupName: "Extras", optionId: "o1", optionName: "Queso", priceCents: 300 },
        { groupId: "g1", groupName: "Extras", optionId: "o2", optionName: "Bacon", priceCents: 400 },
      ]
      const result = calculateItemTotal(2500, modifiers)
      expect(result).toBe(3200) // 2500 + 300 + 400
    })

    it("should subtract negative modifier prices", () => {
      const { calculateItemTotal } = getHookFunctions()
      const modifiers: CartItemModifier[] = [
        { groupId: "g1", groupName: "Tamaño", optionId: "small", optionName: "Chica", priceCents: -200 },
      ]
      const result = calculateItemTotal(600, modifiers)
      expect(result).toBe(400) // 600 - 200
    })

    it("should handle mixed positive and negative modifiers", () => {
      const { calculateItemTotal } = getHookFunctions()
      const modifiers: CartItemModifier[] = [
        { groupId: "g1", groupName: "Tamaño", optionId: "small", optionName: "Chica", priceCents: -200 },
        { groupId: "g2", groupName: "Extras", optionId: "extra", optionName: "Extra queso", priceCents: 300 },
      ]
      const result = calculateItemTotal(1000, modifiers)
      expect(result).toBe(1100) // 1000 - 200 + 300
    })

    it("should handle modifiers with zero price", () => {
      const { calculateItemTotal } = getHookFunctions()
      const modifiers: CartItemModifier[] = [
        { groupId: "g1", groupName: "Cocción", optionId: "medium", optionName: "A punto", priceCents: 0 },
      ]
      const result = calculateItemTotal(3500, modifiers)
      expect(result).toBe(3500)
    })
  })

  describe("validateModifiers", () => {
    it("should validate required group with valid selection", () => {
      const { validateModifiers } = getHookFunctions()
      const groups: ModifierGroup[] = [
        {
          id: "size",
          name: "Tamaño",
          required: true,
          minSelection: 1,
          maxSelection: 1,
          options: [
            { id: "small", name: "Chica", priceCents: -200, available: true },
            { id: "medium", name: "Mediana", priceCents: 0, available: true },
          ],
        },
      ]
      const selections: ModifierSelection[] = [
        { groupId: "size", selectedOptionIds: ["medium"] },
      ]
      const result = validateModifiers(groups, selections)
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it("should fail if required group has no selection", () => {
      const { validateModifiers } = getHookFunctions()
      const groups: ModifierGroup[] = [
        {
          id: "size",
          name: "Tamaño",
          required: true,
          minSelection: 1,
          maxSelection: 1,
          options: [{ id: "small", name: "Chica", priceCents: 0, available: true }],
        },
      ]
      const selections: ModifierSelection[] = []
      const result = validateModifiers(groups, selections)
      expect(result.isValid).toBe(false)
      expect(result.errors.size).toContain("Debes seleccionar al menos 1 opción")
    })

    it("should fail if selection is less than minSelection", () => {
      const { validateModifiers } = getHookFunctions()
      const groups: ModifierGroup[] = [
        {
          id: "toppings",
          name: "Toppings",
          required: false,
          minSelection: 2,
          maxSelection: 4,
          options: [
            { id: "t1", name: "Topping 1", priceCents: 100, available: true },
            { id: "t2", name: "Topping 2", priceCents: 100, available: true },
            { id: "t3", name: "Topping 3", priceCents: 100, available: true },
          ],
        },
      ]
      const selections: ModifierSelection[] = [
        { groupId: "toppings", selectedOptionIds: ["t1"] },
      ]
      const result = validateModifiers(groups, selections)
      expect(result.isValid).toBe(false)
      expect(result.errors.toppings).toContain("al menos 2")
    })

    it("should fail if selection exceeds maxSelection", () => {
      const { validateModifiers } = getHookFunctions()
      const groups: ModifierGroup[] = [
        {
          id: "extras",
          name: "Extras",
          required: false,
          minSelection: 0,
          maxSelection: 2,
          options: [
            { id: "e1", name: "Extra 1", priceCents: 100, available: true },
            { id: "e2", name: "Extra 2", priceCents: 100, available: true },
            { id: "e3", name: "Extra 3", priceCents: 100, available: true },
          ],
        },
      ]
      const selections: ModifierSelection[] = [
        { groupId: "extras", selectedOptionIds: ["e1", "e2", "e3"] },
      ]
      const result = validateModifiers(groups, selections)
      expect(result.isValid).toBe(false)
      expect(result.errors.extras).toContain("máximo 2")
    })

    it("should validate optional groups correctly", () => {
      const { validateModifiers } = getHookFunctions()
      const groups: ModifierGroup[] = [
        {
          id: "extras",
          name: "Extras",
          required: false,
          minSelection: 0,
          maxSelection: 3,
          options: [{ id: "e1", name: "Extra 1", priceCents: 100, available: true }],
        },
      ]
      const selections: ModifierSelection[] = []
      const result = validateModifiers(groups, selections)
      expect(result.isValid).toBe(true)
    })

    it("should detect unavailable options as warnings", () => {
      const { validateModifiers } = getHookFunctions()
      const groups: ModifierGroup[] = [
        {
          id: "size",
          name: "Tamaño",
          required: true,
          minSelection: 1,
          maxSelection: 1,
          options: [
            { id: "small", name: "Chica", priceCents: 0, available: false },
            { id: "large", name: "Grande", priceCents: 300, available: true },
          ],
        },
      ]
      const selections: ModifierSelection[] = [
        { groupId: "size", selectedOptionIds: ["small"] },
      ]
      const result = validateModifiers(groups, selections)
      expect(result.warnings).toBeDefined()
      expect(result.warnings![0]).toContain("no están disponibles")
    })

    it("should return multiple errors for multiple invalid groups", () => {
      const { validateModifiers } = getHookFunctions()
      const groups: ModifierGroup[] = [
        {
          id: "size",
          name: "Tamaño",
          required: true,
          minSelection: 1,
          maxSelection: 1,
          options: [{ id: "s", name: "S", priceCents: 0, available: true }],
        },
        {
          id: "type",
          name: "Tipo",
          required: true,
          minSelection: 1,
          maxSelection: 1,
          options: [{ id: "t", name: "T", priceCents: 0, available: true }],
        },
      ]
      const selections: ModifierSelection[] = []
      const result = validateModifiers(groups, selections)
      expect(result.isValid).toBe(false)
      expect(Object.keys(result.errors)).toHaveLength(2)
    })
  })

  describe("selectionsToModifiers", () => {
    it("should convert selections to CartItemModifiers correctly", () => {
      const { selectionsToModifiers } = getHookFunctions()
      const groups: ModifierGroup[] = [
        {
          id: "size",
          name: "Tamaño",
          required: true,
          minSelection: 1,
          maxSelection: 1,
          options: [
            { id: "medium", name: "Mediana", priceCents: 0, available: true },
          ],
        },
      ]
      const selections: ModifierSelection[] = [
        { groupId: "size", selectedOptionIds: ["medium"] },
      ]
      const result = selectionsToModifiers(groups, selections)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        groupId: "size",
        groupName: "Tamaño",
        optionId: "medium",
        optionName: "Mediana",
        priceCents: 0,
      })
    })

    it("should handle multiple selections in one group", () => {
      const { selectionsToModifiers } = getHookFunctions()
      const groups: ModifierGroup[] = [
        {
          id: "extras",
          name: "Extras",
          required: false,
          minSelection: 0,
          maxSelection: 3,
          options: [
            { id: "e1", name: "Extra 1", priceCents: 100, available: true },
            { id: "e2", name: "Extra 2", priceCents: 200, available: true },
          ],
        },
      ]
      const selections: ModifierSelection[] = [
        { groupId: "extras", selectedOptionIds: ["e1", "e2"] },
      ]
      const result = selectionsToModifiers(groups, selections)
      expect(result).toHaveLength(2)
    })

    it("should return empty array if no selections", () => {
      const { selectionsToModifiers } = getHookFunctions()
      const groups: ModifierGroup[] = [
        {
          id: "size",
          name: "Tamaño",
          required: false,
          minSelection: 0,
          maxSelection: 1,
          options: [{ id: "s", name: "S", priceCents: 0, available: true }],
        },
      ]
      const selections: ModifierSelection[] = []
      const result = selectionsToModifiers(groups, selections)
      expect(result).toHaveLength(0)
    })

    it("should ignore groups that do not exist", () => {
      const { selectionsToModifiers } = getHookFunctions()
      const groups: ModifierGroup[] = []
      const selections: ModifierSelection[] = [
        { groupId: "nonexistent", selectedOptionIds: ["opt1"] },
      ]
      const result = selectionsToModifiers(groups, selections)
      expect(result).toHaveLength(0)
    })

    it("should ignore options that do not exist", () => {
      const { selectionsToModifiers } = getHookFunctions()
      const groups: ModifierGroup[] = [
        {
          id: "size",
          name: "Tamaño",
          required: false,
          minSelection: 0,
          maxSelection: 1,
          options: [{ id: "small", name: "Chica", priceCents: 0, available: true }],
        },
      ]
      const selections: ModifierSelection[] = [
        { groupId: "size", selectedOptionIds: ["nonexistent"] },
      ]
      const result = selectionsToModifiers(groups, selections)
      expect(result).toHaveLength(0)
    })
  })

  describe("generateCustomizationId", () => {
    it("should generate ID based on menuItemId", () => {
      const { generateCustomizationId } = getHookFunctions()
      const id = generateCustomizationId("item-123", [], undefined)
      expect(id).toBe("item-123:")
    })

    it("should include modifiers in sorted order", () => {
      const { generateCustomizationId } = getHookFunctions()
      const modifiers: CartItemModifier[] = [
        { groupId: "g2", groupName: "G2", optionId: "o2", optionName: "O2", priceCents: 0 },
        { groupId: "g1", groupName: "G1", optionId: "o1", optionName: "O1", priceCents: 0 },
      ]
      const id = generateCustomizationId("item-1", modifiers, undefined)
      expect(id).toBe("item-1:g1:o1|g2:o2")
    })

    it("should include notes in the hash if they exist", () => {
      const { generateCustomizationId } = getHookFunctions()
      const id1 = generateCustomizationId("item-1", [], "Sin cebolla")
      const id2 = generateCustomizationId("item-1", [], undefined)
      expect(id1).toContain(":notes:")
      expect(id1).not.toBe(id2)
    })

    it("should generate same ID for same modifiers in different order", () => {
      const { generateCustomizationId } = getHookFunctions()
      const mods1: CartItemModifier[] = [
        { groupId: "g1", groupName: "G1", optionId: "o1", optionName: "O1", priceCents: 0 },
        { groupId: "g2", groupName: "G2", optionId: "o2", optionName: "O2", priceCents: 0 },
      ]
      const mods2: CartItemModifier[] = [
        { groupId: "g2", groupName: "G2", optionId: "o2", optionName: "O2", priceCents: 0 },
        { groupId: "g1", groupName: "G1", optionId: "o1", optionName: "O1", priceCents: 0 },
      ]
      const id1 = generateCustomizationId("item-1", mods1, undefined)
      const id2 = generateCustomizationId("item-1", mods2, undefined)
      expect(id1).toBe(id2)
    })

    it("should generate different IDs for different modifiers", () => {
      const { generateCustomizationId } = getHookFunctions()
      const mods1: CartItemModifier[] = [
        { groupId: "g1", groupName: "G1", optionId: "o1", optionName: "O1", priceCents: 0 },
      ]
      const mods2: CartItemModifier[] = [
        { groupId: "g1", groupName: "G1", optionId: "o2", optionName: "O2", priceCents: 0 },
      ]
      const id1 = generateCustomizationId("item-1", mods1, undefined)
      const id2 = generateCustomizationId("item-1", mods2, undefined)
      expect(id1).not.toBe(id2)
    })

    it("should generate different IDs if notes are different", () => {
      const { generateCustomizationId } = getHookFunctions()
      const id1 = generateCustomizationId("item-1", [], "Sin sal")
      const id2 = generateCustomizationId("item-1", [], "Con extra sal")
      expect(id1).not.toBe(id2)
    })
  })

  describe("areCustomizationsEqual", () => {
    it("should return true for same modifiers and notes", () => {
      const { areCustomizationsEqual } = getHookFunctions()
      const mods: CartItemModifier[] = [
        { groupId: "g1", groupName: "G1", optionId: "o1", optionName: "O1", priceCents: 0 },
      ]
      const result = areCustomizationsEqual(mods, "Sin sal", mods, "Sin sal")
      expect(result).toBe(true)
    })

    it("should return false if modifiers differ", () => {
      const { areCustomizationsEqual } = getHookFunctions()
      const mods1: CartItemModifier[] = [
        { groupId: "g1", groupName: "G1", optionId: "o1", optionName: "O1", priceCents: 0 },
      ]
      const mods2: CartItemModifier[] = [
        { groupId: "g1", groupName: "G1", optionId: "o2", optionName: "O2", priceCents: 0 },
      ]
      const result = areCustomizationsEqual(mods1, undefined, mods2, undefined)
      expect(result).toBe(false)
    })

    it("should return false if notes differ", () => {
      const { areCustomizationsEqual } = getHookFunctions()
      const mods: CartItemModifier[] = []
      const result = areCustomizationsEqual(mods, "Sin sal", mods, "Con sal")
      expect(result).toBe(false)
    })

    it("should return true if modifier order is different but content is same", () => {
      const { areCustomizationsEqual } = getHookFunctions()
      const mods1: CartItemModifier[] = [
        { groupId: "g1", groupName: "G1", optionId: "o1", optionName: "O1", priceCents: 0 },
        { groupId: "g2", groupName: "G2", optionId: "o2", optionName: "O2", priceCents: 0 },
      ]
      const mods2: CartItemModifier[] = [
        { groupId: "g2", groupName: "G2", optionId: "o2", optionName: "O2", priceCents: 0 },
        { groupId: "g1", groupName: "G1", optionId: "o1", optionName: "O1", priceCents: 0 },
      ]
      const result = areCustomizationsEqual(mods1, undefined, mods2, undefined)
      expect(result).toBe(true)
    })

    it("should handle undefined vs empty string notes correctly", () => {
      const { areCustomizationsEqual } = getHookFunctions()
      const mods: CartItemModifier[] = []
      const result1 = areCustomizationsEqual(mods, undefined, mods, "")
      const result2 = areCustomizationsEqual(mods, "", mods, undefined)
      expect(result1).toBe(true)
      expect(result2).toBe(true)
    })

    it("should return false if modifier lengths differ", () => {
      const { areCustomizationsEqual } = getHookFunctions()
      const mods1: CartItemModifier[] = [
        { groupId: "g1", groupName: "G1", optionId: "o1", optionName: "O1", priceCents: 0 },
      ]
      const mods2: CartItemModifier[] = []
      const result = areCustomizationsEqual(mods1, undefined, mods2, undefined)
      expect(result).toBe(false)
    })
  })
})
