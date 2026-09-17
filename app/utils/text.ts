/** Bytes a `TEXT` column of the database holds, which is what the package metadata is stored in. */
export const textByteLimit = 65_535

/**
 * Text cut to what its column holds. Repository metadata is written by upstream maintainers and a
 * description that runs past the limit of the column makes the whole row fail to write, so the
 * value is shortened instead. The cut is made on a character boundary, so the text that is stored
 * stays valid UTF-8 rather than ending in half a character.
 */
export function truncateText(value: string | null, maximum: number = textByteLimit) {
  if (value === null || Buffer.byteLength(value) <= maximum) return value

  const bytes = Buffer.from(value)
  // A byte that continues a character means the limit lands inside one, so the cut moves back to
  // where that character starts
  let end = maximum
  while (end > 0 && (bytes[end] & 0xc0) === 0x80) end -= 1

  return bytes.subarray(0, end).toString('utf8')
}
