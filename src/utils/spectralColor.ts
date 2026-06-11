const SPECTRAL_DESCRIPTIONS: Record<string, string> = {
  O: "hot blue-violet star",
  B: "blue-white star",
  A: "white star",
  F: "yellow-white star",
  G: "yellow star, like our Sun",
  K: "orange star",
  M: "red star",
  C: "carbon star",
  R: "red giant",
  S: "red giant",
};

export function spectralTypeDescription(spect: string): string {
  const letter = spect.trim().charAt(0).toUpperCase();
  return SPECTRAL_DESCRIPTIONS[letter] ?? "star";
}
