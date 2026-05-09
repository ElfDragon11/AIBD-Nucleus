/**
 * Runs a navigation or DOM update inside the View Transitions API when available
 * so route changes cross-fade instead of snapping (Chrome / Edge).
 */
export function runWithViewTransition(callback: () => void): void {
  const doc = document as Document & {
    startViewTransition?: (update: () => void) => unknown
  }
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(() => {
      callback()
    })
    return
  }
  callback()
}
