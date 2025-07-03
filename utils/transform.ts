export const capitalize = (text: string ,sperator : string = " "): string => {
  if (typeof text !== "string") {
    throw new Error("Only strings are valid");
  }

  if (!text) return text;

  return String(
    text
      .split(/\s+/)
      .map((word) => matchRegx(word))
      .join(sperator)
  );
};

const matchRegx = (word: string): string => {
  const match = word.match(/^([^\p{L}]*)(\p{L}?)(.*)/u);

  if (match) {
    const [_, symbols = "", firstLetter = "", rest = ""] = match;
    return symbols + firstLetter.toUpperCase() + rest;
  } else {
    throw new Error(`Invalid word format: "${word}"`);
  }
};
