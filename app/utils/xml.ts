import { StringDecoder } from 'node:string_decoder'

/** Characters that may follow the name of an element without becoming part of it. */
const nameEnd = new Set(['>', '/', ' ', '\t', '\r', '\n'])

/**
 * Read the elements named `tag` of a large XML document one at a time, without ever holding the
 * document as a whole. Repository metadata is far larger than any string a JavaScript program can
 * hold — the file list of Fedora 42 is 875 MB, against a limit of 512 MB per string — so a document
 * is consumed as a stream and only the element that is being read is materialized.
 *
 * Only the text that has just arrived is searched, so that reading a document neither copies nor
 * scans it again for every element it holds: searching the whole text read so far together with
 * every chunk makes the reader use as much memory as the document is large. The tail of the text is
 * carried over to the next chunk, because a tag can be split between two of them.
 *
 * An element that nests inside another element of the same name ends the outer one early; the
 * metadata a package repository publishes is flat, so the documents this is used for do not.
 */
export async function* eachXmlElement(
  chunks: AsyncIterable<Buffer>,
  tag: string,
): AsyncGenerator<string> {
  const openTag = `<${tag}`
  const closeTag = `</${tag}>`
  // A tag split between two chunks is found by searching the tail of the text read so far again
  const overlap = Math.max(openTag.length, closeTag.length)
  const decoder = new StringDecoder('utf8')

  // Text of the element that is being read, from its opening tag up to the last character read
  let parts: string[] = []
  // Tail of the text read so far, which the next chunk is searched together with
  let carry = ''

  for await (const chunk of chunks) {
    const window = carry + decoder.write(chunk)
    let cursor = 0
    // Index in `window` up to which the element being read is already in `parts`
    let covered = carry.length

    while (true) {
      if (parts.length > 0) {
        const end = window.indexOf(closeTag, cursor)
        if (end < 0) {
          // The element is not complete yet: keep what arrived and wait for the rest of it
          if (covered < window.length) {
            parts.push(window.slice(covered))
            covered = window.length
          }
          break
        }

        parts.push(window.slice(covered, end + closeTag.length))
        yield parts.join('')
        parts = []
        cursor = end + closeTag.length
        covered = window.length
        continue
      }

      const start = findElementStart(window, openTag, cursor)
      if (start < 0) break

      const end = window.indexOf(closeTag, start + openTag.length)
      if (end < 0) {
        // The element began but its end has not been read yet: keep it and wait for the rest of it
        parts.push(window.slice(start))
        covered = window.length
        break
      }

      yield window.slice(start, end + closeTag.length)
      cursor = end + closeTag.length
    }

    carry =
      parts.length > 0
        ? window.slice(window.length - overlap)
        : window.slice(Math.max(cursor, window.length - overlap))
  }
}

/** Index of the next `<tag` that begins an element, or `-1` when there is none. */
function findElementStart(content: string, openTag: string, from: number) {
  let index = content.indexOf(openTag, from)

  while (index >= 0) {
    const following = content[index + openTag.length]
    // The name is not complete yet, which the next chunk is expected to finish
    if (following === undefined) return -1
    if (nameEnd.has(following)) return index

    // An element of a longer name, such as `<packages>` for `package`
    index = content.indexOf(openTag, index + openTag.length)
  }

  return -1
}
