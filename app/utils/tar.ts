import { Readable } from 'node:stream'

import { ChunkReader, collectChunks } from '#utils/streams'

/**
 * Minimal reader for the tar archives found next to package metadata: deb control archives,
 * AppStream icon archives, and the databases and packages of a pacman repository. Long names are
 * supported through the GNU `L` header, which is what apt, createrepo and pacman write for deeply
 * nested entries.
 */
export type TarEntry = {
  name: string
  data: Buffer
}

/** One entry of a tar archive that is still being read, with the payload it declares. */
export type TarStreamEntry = {
  name: string
  size: number
  /** Payload of the entry; whatever the caller does not read is skipped by the walk. */
  data: AsyncIterable<Buffer>
}

const tarBlockSize = 512
const tarNameOffset = 0
const tarNameSize = 100
const tarSizeOffset = 124
const tarSizeSize = 12
const tarTypeOffset = 156
const tarPrefixOffset = 345
const tarPrefixSize = 155
/** Entry type of the header that carries the name of an entry too long for the fixed field. */
const tarLongNameFlag = 'L'

function readTarString(header: Buffer, offset: number, length: number) {
  const value = header.subarray(offset, offset + length)
  const end = value.indexOf(0)
  return value
    .subarray(0, end === -1 ? value.length : end)
    .toString('utf8')
    .trim()
}

/**
 * Walk the entries of a tar archive that is still being read, one at a time. The payload of an
 * entry is handed over as a stream, so that an archive of hundreds of megabytes — the file list of
 * a repository is one — is never held as a whole: an entry that is not wanted is skipped, and the
 * payload of the others is read in pieces.
 */
export async function* eachTarEntry(chunks: AsyncIterable<Buffer>): AsyncGenerator<TarStreamEntry> {
  const reader = new ChunkReader(chunks[Symbol.asyncIterator]())
  let longName: string | null = null

  while (true) {
    const header = await reader.collect(tarBlockSize)
    // The archive ends with a block of zeroes instead of a header
    if (!header || header.every((byte) => byte === 0)) return

    const declaredSize = Number.parseInt(
      readTarString(header, tarSizeOffset, tarSizeSize) || '0',
      8,
    )
    const size = Number.isInteger(declaredSize) && declaredSize > 0 ? declaredSize : 0
    const paddedSize = Math.ceil(size / tarBlockSize) * tarBlockSize
    const typeFlag = String.fromCharCode(header[tarTypeOffset] ?? 0)
    const prefix = readTarString(header, tarPrefixOffset, tarPrefixSize)
    let name = readTarString(header, tarNameOffset, tarNameSize)
    if (prefix) name = `${prefix}/${name}`

    if (typeFlag === tarLongNameFlag) {
      const payload = await reader.collect(size)
      if (!payload) return
      longName = payload.toString('utf8').replace(/\0+$/, '')
      if (!(await reader.skip(paddedSize - size))) return
      continue
    }

    const entryName = (longName ?? name).replace(/^\.\/+/, '')
    longName = null

    // Only regular files are entries; directories, links and the padding of the archive are skipped
    if (typeFlag === '0' || typeFlag === '\0' || !typeFlag) {
      let read = 0
      const data = (async function* () {
        while (read < size) {
          const piece = await reader.collect(size - read)
          if (!piece) return
          read += piece.length
          yield piece
        }
      })()

      yield { name: entryName, size, data }
      // The payload is skipped from wherever the caller stopped reading it
      if (!(await reader.skip(size - read))) return
    }

    if (!(await reader.skip(paddedSize - size))) return
  }
}

/** Read a tar archive that is already in memory, keeping the payload of every entry. */
export async function readTarEntries(data: Buffer): Promise<TarEntry[]> {
  const entries: TarEntry[] = []

  for await (const entry of eachTarEntry(Readable.from([data]))) {
    entries.push({ name: entry.name, data: await collectChunks(entry.data) })
  }

  return entries
}
