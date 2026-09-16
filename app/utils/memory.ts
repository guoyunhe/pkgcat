import { setFlagsFromString } from 'node:v8'
import { runInNewContext } from 'node:vm'

/**
 * Run the garbage collector, which Node only exposes when it is started with `--expose-gc`.
 *
 * A repository is synchronized by reading thousands of metadata files and packages one after
 * another, and the memory of the ones the run is done with — including the native memory of the
 * decompressors and of the images, which is not part of the JavaScript heap — is otherwise only
 * released once V8 decides that the heap has to grow, which a long run has to avoid.
 */
export const collectGarbage = createCollector()

function createCollector(): () => void {
  try {
    setFlagsFromString('--expose-gc')
    const gc: unknown = runInNewContext('gc')
    if (typeof gc === 'function') return gc as () => void
  } catch {
    // The collector is a hint: a runtime that does not expose one keeps its own schedule
  }

  return () => {}
}
