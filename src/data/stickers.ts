export interface Section {
  id: number;
  name: string;
  start: number;
  end: number;
  color: string;
  bg: string;
  image: string;
}

export const SECTIONS: Section[] = [
  { id: 1,  name: "Komm mal rum!",               start: 1,   end: 12,  color: "#FBBF24", bg: "#78350F", image: "s01.jpg" },
  { id: 2,  name: "St. Pauli von oben",           start: 13,  end: 26,  color: "#60A5FA", bg: "#1E3A5F", image: "s02.jpg" },
  { id: 3,  name: "400 Jahre Reeperbahn",         start: 27,  end: 37,  color: "#F87171", bg: "#7F1D1D", image: "s03.jpg" },
  { id: 4,  name: "Geschichte",                   start: 38,  end: 62,  color: "#D97706", bg: "#451A03", image: "s04.jpg" },
  { id: 5,  name: "Es war einmal…",               start: 63,  end: 75,  color: "#A78BFA", bg: "#2E1065", image: "s05.jpg" },
  { id: 6,  name: "Kiezkorn Legenden",            start: 76,  end: 96,  color: "#FB923C", bg: "#431407", image: "s06.jpg" },
  { id: 7,  name: "Happy Birthday, Reeperbahn!",  start: 97,  end: 121, color: "#34D399", bg: "#064E3B", image: "s07.jpg" },
  { id: 8,  name: "Stage Entertainment & S-Bahn", start: 122, end: 131, color: "#C084FC", bg: "#3B0764", image: "s08.jpg" },
  { id: 9,  name: "Spielbudenplatz",              start: 132, end: 144, color: "#22D3EE", bg: "#083344", image: "s09.jpg" },
  { id: 10, name: "Reeperbahn",                   start: 145, end: 155, color: "#FCA5A5", bg: "#450A0A", image: "s10.jpg" },
  { id: 11, name: "Hamburger Berg",               start: 156, end: 167, color: "#86EFAC", bg: "#052E16", image: "s11.jpg" },
  { id: 12, name: "Große Freiheit",               start: 168, end: 177, color: "#7DD3FC", bg: "#0C4A6E", image: "s12.jpg" },
  { id: 13, name: "Hans-Albers-Platz",            start: 178, end: 186, color: "#5EEAD4", bg: "#042F2E", image: "s13.jpg" },
  { id: 14, name: "Penny & Haspa",                start: 187, end: 193, color: "#FDE68A", bg: "#422006", image: "s14.jpg" },
  { id: 15, name: "FC St. Pauli",                 start: 194, end: 210, color: "#FBBF24", bg: "#450A0A", image: "s15.jpg" },
  { id: 16, name: "The Sound of St. Pauli",       start: 211, end: 219, color: "#D8B4FE", bg: "#2E1065", image: "s16.jpg" },
  { id: 17, name: "Die Kiez-Manager",             start: 220, end: 235, color: "#6EE7B7", bg: "#052E16", image: "s17.jpg" },
  { id: 18, name: "Rotlicht-Geschichten",         start: 236, end: 245, color: "#FC8181", bg: "#450A0A", image: "s18.jpg" },
  { id: 19, name: "Kiez & Kirche",                start: 246, end: 256, color: "#67E8F9", bg: "#083344", image: "s19.jpg" },
  { id: 20, name: "Faces of St. Pauli",           start: 257, end: 268, color: "#D1D5DB", bg: "#1F2937", image: "s20.jpg" },
  { id: 21, name: "Budni & Schluss",              start: 269, end: 276, color: "#93C5FD", bg: "#1E3A5F", image: "s21.jpg" },
];

export const MISSING_STICKERS = new Set<number>([
  5, 10, 11,
  13, 14, 15, 18, 19, 22, 23, 25,
  27, 30, 35,
  38, 39, 40, 45, 46, 48, 49, 50, 51, 54, 60,
  63, 64,
  76, 77, 81, 82, 83, 92, 96,
  112,
  122, 126, 129,
  137, 142, 143, 144,
  151, 153,
  157, 158, 162, 166,
  168, 170, 171, 172, 176,
  183, 185,
  187, 190,
  198, 199, 202, 206, 208,
  211, 215, 218,
  224, 230, 231, 233,
  237, 242, 244,
  247, 252, 253, 255,
  257, 261, 263, 268,
  271, 272, 276,
]);
