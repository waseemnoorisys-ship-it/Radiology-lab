/**
 * Validates DICOM file structure per DICOM Part 10 (PS 3.10) specification.
 * Valid files have a 128-byte file preamble followed by the 4-byte magic signature "DICM" (0x44, 0x49, 0x43, 0x4D).
 */
export function isValidDicomBuffer(buffer) {
  if (buffer.length < 132) {
    return {
      valid: false,
      reason: `File size too small (${buffer.length} bytes). Minimum required DICOM header size is 132 bytes.`,
    };
  }

  // Check magic bytes at offset 128: 'D', 'I', 'C', 'M'
  const magic = buffer.toString('ascii', 128, 132);
  if (magic !== 'DICM') {
    return {
      valid: false,
      reason: `Invalid DICOM signature '${magic}' at offset 128. Expected 'DICM'.`,
    };
  }

  return { valid: true };
}
