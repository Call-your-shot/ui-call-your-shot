// Palette lifted straight from app/globals.css so the PDF matches the product UI.
export const color = {
  ink: "#161C24",
  body: "#454F5B",
  accent: "#00A76F",
  accentLight: "#C8FAD6",
  rule: "#DFE3E8",
  tableHead: "#F4F6F8",
  amber: "#E8A317",
  navy: "#003C64",
  white: "#FFFFFF",
};

export const page = {
  size: "A4" as const,
  marginPt: 56.7, // 20mm
};

export const font = {
  family: "Public Sans",
  body: 10,
  small: 9,
  clause: 12,
  section: 16,
};
