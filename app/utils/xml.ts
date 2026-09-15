import { StringDecoder } from 'node:string_decoder'

/** Characters that may follow the name of an element without becoming part of it. */
const nameEnd = new Set(['>', '/', ' ', '\t', '\r', '\n'])

/**
 * Read the elements named `tag` of a large XML document one at a time, without ever holding the
 * document as a whole. Repository metadata is far larger than any string a JavaScript program can
 * hold — the file list of Fedora 42 is 875 MB, against a limit of 512 MB per string — so a document
 * is consumed as a stream and only the element that is being read is materialized.
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
  const decoder = new StringDecoder('utf8')
  let content = ''

  for await (const chunk of chunks) {
    content += decoder.write(Buffer.from(chunk))
    // Where the text that has not been read yet starts within `content`
    let cursor = 0

    while (true) {
      const start = findElementStart(content, openTag, cursor)
      if (start < 0) {
        // No element begins in the text that was read, so everything but the beginning of one that
        // the next chunk completes can be dropped
        content = content.slice(Math.max(cursor, content.length - openTag.length))
        break
      }

      const end = content.indexOf(closeTag, start)
      if (end < 0) {
        // The element is not complete yet: keep it and wait for the rest of it
        content = content.slice(start)
        break
      }

      yield content.slice(start, end + closeTag.length)
      cursor = end + closeTag.length
    }
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
