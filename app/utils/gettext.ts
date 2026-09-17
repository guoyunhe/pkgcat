/**
 * Messages of a compiled gettext catalog (`.mo`). The format is a header of five 32 bit numbers —
 * magic, revision, number of messages and the offsets of the two string tables — followed by the
 * tables themselves: one length and one offset per message, the original on the left and its
 * translation on the right. Both are written in the byte order of the magic number.
 */
export function gettextMessages(content: Buffer): Map<string, string> {
  const littleEndian = content.readUInt32LE(0) === 0x950412de
  const read = littleEndian
    ? (offset: number) => content.readUInt32LE(offset)
    : (offset: number) => content.readUInt32BE(offset)

  const count = read(8)
  const originals = read(12)
  const translations = read(16)
  const messages = new Map<string, string>()
  for (let index = 0; index < count; index++) {
    const originalLength = read(originals + index * 8)
    const originalOffset = read(originals + index * 8 + 4)
    const translatedLength = read(translations + index * 8)
    const translatedOffset = read(translations + index * 8 + 4)

    const original = content.toString('utf8', originalOffset, originalOffset + originalLength)
    // The context of a message is written in front of it, and a plural form is one entry per
    // count, so the first translation of a message is the one a name is read from
    if (original.includes('\u0004') || messages.has(original)) continue

    const translated = content.toString(
      'utf8',
      translatedOffset,
      translatedOffset + translatedLength,
    )
    if (translated) messages.set(original, translated)
  }
  return messages
}
