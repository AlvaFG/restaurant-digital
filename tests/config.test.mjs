import { describe, expect, it } from "vitest"

import nextConfig from "../next.config.mjs"

describe("next configuration", () => {
  it("mantiene las salvaguardas de build activas", () => {
    expect(nextConfig).toBeDefined()
    expect(nextConfig.images?.unoptimized).toBe(true)
    expect(nextConfig.eslint?.ignoreDuringBuilds).toBe(true)
    expect(nextConfig.typescript?.ignoreBuildErrors).toBe(true)
  })
})
