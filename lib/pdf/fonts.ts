import path from "node:path";
import { Font } from "@react-pdf/renderer";

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");

let registered = false;

// react-pdf/fontkit needs this registered once per process, not per request.
export function registerFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Public Sans",
    fonts: [
      { src: path.join(FONT_DIR, "PublicSans-Regular.woff"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "PublicSans-Italic.woff"), fontWeight: 400, fontStyle: "italic" },
      { src: path.join(FONT_DIR, "PublicSans-Medium.woff"), fontWeight: 500 },
      { src: path.join(FONT_DIR, "PublicSans-SemiBold.woff"), fontWeight: 600 },
      { src: path.join(FONT_DIR, "PublicSans-Bold.woff"), fontWeight: 700 },
    ],
  });

  // Hyphenation is meant for prose; it mangles numbers, currency and clause refs.
  Font.registerHyphenationCallback((word) => [word]);
}
