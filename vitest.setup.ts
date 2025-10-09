import "@testing-library/jest-dom/vitest"

if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture ||= () => false
  Element.prototype.setPointerCapture ||= () => {}
  Element.prototype.releasePointerCapture ||= () => {}
  Element.prototype.scrollIntoView ||= () => {}
}

if (typeof window !== "undefined") {
  window.HTMLElement.prototype.hasPointerCapture ||= () => false
  window.HTMLElement.prototype.setPointerCapture ||= () => {}
  window.HTMLElement.prototype.releasePointerCapture ||= () => {}
  window.HTMLElement.prototype.scrollIntoView ||= () => {}

  if (typeof window.ResizeObserver === "undefined") {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
}
