import { Readable } from 'node:stream'
import { createGunzip, createZstdDecompress, gunzipSync, zstdDecompressSync } from 'node:zlib'

import { createDecompressStream, decompress as xzDecompress } from '@napi-rs/lzma/xz'

/** Compression extension of a metadata file, or an empty string when it carries none. */
export function compressionExtension(url: string) {
  return /\.(gz|zst|xz)$/.exec(url)?.[0] ?? ''
}

/**
 * Decompress the metadata a repository publishes, which is gzipped, zstd or xz compressed. Metadata
 * that carries no compression is returned as it is, since not every file is compressed.
 */
export async function decompress(data: Buffer, extension: string): Promise<Buffer> {
  if (extension === '.gz') return gunzipSync(data)
  if (extension === '.zst') return zstdDecompressSync(data)
  if (extension !== '.xz') return data

  return xzDecompress(data)
}

/**
 * Decompress metadata as a stream, which is what the documents a repository publishes need: they
 * are far larger than any string a JavaScript program can hold — the file list of the AlmaLinux 8
 * `BaseOS` repository unpacks to 625 MB, the one of Fedora 42 to 875 MB, against a limit of 512 MB
 * per string — so they can only be read and searched in pieces.
 *
 * Xz is not part of `node:zlib`; xz metadata and the xz payloads of RPM packages are decompressed
 * by `@napi-rs/lzma`. It replaced `xz-decompress`, whose WebAssembly build cannot read an xz stream
 * that carries a SHA-256 check, which is what the Enterprise Linux rebuilds compress with.
 */
export function decompressStream(data: Buffer, extension: string): Readable {
  const compressed = Readable.from([data])
  if (extension === '.gz') return compressed.pipe(createGunzip())
  if (extension === '.zst') return compressed.pipe(createZstdDecompress())
  if (extension !== '.xz') return compressed

  return compressed.pipe(createDecompressStream())
}
