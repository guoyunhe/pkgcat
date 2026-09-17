import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

import decode, { init } from '@jsquash/jxl/decode.js'
import sharp from 'sharp'

const require = createRequire(import.meta.url)

/** Signature of a JPEG XL codestream, and the box that introduces a JPEG XL container file. */
const codestreamMagic = [0xff, 0x0a]
const containerMagic = [0x00, 0x00, 0x00, 0x0c, 0x4a, 0x58, 0x4c, 0x20]

/** Whether the bytes given are a JPEG XL image, in either of the two forms it is stored in. */
export function isJpegXl(data: Buffer) {
  const matches = (magic: number[]) => magic.every((byte, index) => data[index] === byte)
  return matches(codestreamMagic) || matches(containerMagic)
}

/**
 * Decode a JPEG XL image into a PNG, which is the format the catalog stores its images in: the
 * AppStream catalog of a pacman repository publishes its icons as JPEG XL, and neither the browser
 * nor the image library of the catalog reads that format.
 *
 * The decoder is a WebAssembly build of libjxl, which looks its binary up over `fetch` — a request
 * the module cannot resolve outside a browser — so the binary next to it is read once and handed to
 * the module, which is then reused for every icon.
 */
export async function decodeJpegXl(data: Buffer): Promise<Buffer> {
  await loadDecoder()

  const image = await decode(
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer,
  )
  const pixels = Buffer.from(image.data.buffer, image.data.byteOffset, image.data.byteLength)

  return sharp(pixels, {
    raw: { width: image.width, height: image.height, channels: 4 },
  })
    .png()
    .toBuffer()
}

let decoder: Promise<unknown> | null = null

async function loadDecoder() {
  if (!decoder) {
    const binary = await readFile(require.resolve('@jsquash/jxl/codec/dec/jxl_dec.wasm'))
    decoder = init({ wasmBinary: binary })
  }

  await decoder
}
