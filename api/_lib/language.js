// Languages the AI reports can be written in besides English. The browser sends a language code
// with each report request; anything not listed here falls back to English, and the code is never
// pasted into a prompt as-is (only the fixed names below are).
const NAMES = { es: "Spanish", ja: "Japanese" };

export function reportLanguage(code) {
  return typeof code === "string" && Object.hasOwn(NAMES, code) ? code : null;
}

export function languageName(code) {
  return NAMES[code];
}

// Languages whose text we ask the image model to draw inside the colour / hairstyle images. Image
// models draw Spanish reliably; Japanese is the one to check by eye. Remove a code here to keep that
// language's images in English while its written report stays translated.
const IMAGE_TEXT_LANGUAGES = ["es", "ja"];

export function imageTextLanguage(code) {
  const language = reportLanguage(code);
  return language && IMAGE_TEXT_LANGUAGES.includes(language) ? language : null;
}
