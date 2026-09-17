/**
 * Helpers for reading a stream that is larger than memory: the payload of a package is decompressed
 * and walked through instead of being held, and the file list of a repository is scanned on the
 * way.
 */

/**
 * Reads a stream of chunks piece by piece, so that a payload that is larger than memory can be
 * walked through: an entry that is not wanted is skipped instead of being held.
 */
export class ChunkReader {
  private chunk: Buffer = Buffer.alloc(0)
  private offset = 0

  constructor(private readonly chunks: AsyncIterator<Buffer>) {}

  /** Exactly `size` bytes of the stream, or `null` when it ends before them. */
  async collect(size: number): Promise<Buffer | null> {
    const parts: Buffer[] = []
    let missing = size

    while (missing > 0) {
      const piece = await this.read(missing)
      if (!piece) return null
      parts.push(piece)
      missing -= piece.length
    }

    if (parts.length === 0) return Buffer.alloc(0)
    return parts.length === 1 ? parts[0] : Buffer.concat(parts, size)
  }

  /** Advance the stream by `size` bytes, or report that it ends before them. */
  async skip(size: number): Promise<boolean> {
    let missing = size

    while (missing > 0) {
      const piece = await this.read(missing)
      if (!piece) return false
      missing -= piece.length
    }

    return true
  }

  /** Put bytes back at the front of the stream, which the caller did not need after all. */
  unread(piece: Buffer) {
    if (piece.length === 0) return

    const rest = this.chunk.subarray(this.offset)
    this.chunk = rest.length > 0 ? Buffer.concat([piece, rest]) : piece
    this.offset = 0
  }

  /** The bytes that have not been read yet, as a stream. */
  async *remaining(): AsyncGenerator<Buffer> {
    while (true) {
      const piece = await this.read(Number.MAX_SAFE_INTEGER)
      if (!piece) return
      yield piece
    }
  }

  /** At most `size` bytes of the stream, or `null` when it has ended. */
  private async read(size: number): Promise<Buffer | null> {
    while (this.offset >= this.chunk.length) {
      const next = await this.chunks.next()
      if (next.done) return null
      this.chunk = next.value
      this.offset = 0
    }

    const piece = this.chunk.subarray(this.offset, this.offset + size)
    this.offset += piece.length
    return piece
  }
}

/** The whole stream as one buffer, for the archives that have to be read as a whole. */
export async function collectChunks(chunks: AsyncIterable<Buffer>): Promise<Buffer> {
  const parts: Buffer[] = []
  for await (const piece of chunks) parts.push(piece)
  return Buffer.concat(parts)
}
