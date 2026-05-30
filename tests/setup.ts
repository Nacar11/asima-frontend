import '@testing-library/jest-dom/vitest';

// jsdom doesn't ship these browser APIs that Radix UI primitives use.
// Polyfill globally so any component test that mounts a Radix Dialog,
// Sheet, Checkbox, Popover, etc. works without bespoke per-test stubs.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// Radix's `Element.hasPointerCapture` and `scrollIntoView` are also
// jsdom gaps that surface on Popover/Select interactions — stub them
// here pre-emptively so the next primitive doesn't trip on the same
// shape.
if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}
