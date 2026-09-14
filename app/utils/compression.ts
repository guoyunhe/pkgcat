import { createRequire } from 'node:module'
import { Readable } from 'node:stream'
import type { ReadableStream as WebReadableStream } from 'node:stream/web'
import { gunzipSync, zstdDecompressSync } from 'node:zlib'

const require = createRequire(import.meta.url)
const { XzReadableStream } = require('xz-decompress') as typeof import('xz-decompress')

/**
 * Decompress the metadata a repository publishes, which is gzipped, zstd or xz compressed. Metadata
 * that carries no compression is returned as it is, since not every file is compressed.
 */
export async function decompress(data: Buffer, extension: string): Promise<Buffer> {
  if (extension === '.gz') return gunzipSync(data)
  if (extension === '.zst') return zstdDecompressSync(data)
  if (extension !== '.xz') return data

  // "xz-decompress" expects the global (WHATWG) ReadableStream type, which differs from the
  // "node:stream/web" one once the DOM lib is part of the program (client project).
  const compressed = Readable.toWeb(Readable.from([data])) as unknown as ReadableStream<Uint8Array>
  const stream = new XzReadableStream(compressed)
  const chunks: Buffer[] = []
  for await (const chunk of Readable.fromWeb(stream as unknown as WebReadableStream<Uint8Array>)) {
    chunks.push(Buffer.from(chunk as Uint8Array))
  }
  return Buffer.concat(chunks)
}
