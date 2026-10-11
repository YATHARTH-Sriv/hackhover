/** Remove non-speech annotations that may remain in a speech transcript. */
export function cleanTranscript(text: string): string {
  return text
    .replace(/\[[^\]\r\n]{1,120}\]/gu, " ")
    .replace(/\((?:laughter|laughing|coughing|sighing|breathing|footsteps|applause|music|background noise|noise)\)/giu, " ")
    .replace(/\s+([,.;:!?])/gu, "$1")
    .replace(/\s+/gu, " ")
    .trim();
}
