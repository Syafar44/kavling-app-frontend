/* ─── Types ─── */
export type Block = { kode: string; x: number; y: number; w: number; h: number; status: string };
export type Road  = { x: number; y: number; w: number; h: number };
export type Park  = { x: number; y: number; w: number; h: number; label?: string };

export type SvgLayout = {
  svgW: number;
  svgH: number;
  blocks: Block[];
  roads: Road[];
  parks: Park[];
};

export type LokasiKavling = {
  id: number;
  nama: string;
  nama_singkat: string;
  header: string;
  alamat: string;
  nama_perusahaan: string;
  nama_admin: string;
  nama_mengetahui: string;
  alamat_perusahaan: string;
  telp_perusahaan: string;
  kota_penandatangan: string;
  nama_penandatangan: string;
  jabatan_penandatangan: string;
  jenis_pembelian: string;
  urutan_lokasi: number;
  jumlah_kavling: number;
  kop_surat?: string;
  kwitansi?: string;
  foto_kavling?: string;
  svg_content?: string;
};

/* ─── Helper: generate a row of blocks ─── */
function makeRow(
  prefix: string, startIdx: number, count: number,
  startX: number, startY: number,
  bw = 42, bh = 55, gap = 5, statuses: string[] = []
): Block[] {
  return Array.from({ length: count }, (_, i) => ({
    kode: `${prefix}-${startIdx + i}`,
    x: startX + i * (bw + gap),
    y: startY,
    w: bw, h: bh,
    status: statuses[i] ?? "",
  }));
}

/* ─── SVG Layout per lokasi ─── */
export const LOKASI_SVG_LAYOUTS: Record<string, SvgLayout> = {
  "Punten Regency": {
    svgW: 620, svgH: 450,
    roads: [
      { x: 0, y: 0, w: 620, h: 15 }, { x: 0, y: 435, w: 620, h: 15 },
      { x: 0, y: 0, w: 15, h: 450 }, { x: 605, y: 0, w: 15, h: 450 },
      { x: 15, y: 155, w: 590, h: 15 }, { x: 15, y: 295, w: 350, h: 15 },
      { x: 350, y: 15, w: 15, h: 280 },
    ],
    parks: [{ x: 370, y: 175, w: 230, h: 130, label: "Taman" }],
    blocks: [
      ...makeRow("A",  1, 6, 20, 22, 42, 55, 5, ["","","","AKAD","AKAD",""]),
      ...makeRow("A",  7, 6, 20, 82, 42, 55, 5, ["","","","","BF",""]),
      ...makeRow("A", 13, 6, 370, 22, 42, 55, 5, ["","","","","","LUNAS"]),
      ...makeRow("A", 19, 2, 370, 82, 42, 55, 5),
      ...makeRow("A", 21, 6, 20, 175, 42, 55, 5),
      ...makeRow("A", 27, 6, 20, 235, 42, 55, 5, ["HOLD","","","","",""]),
      ...makeRow("A", 33, 8, 20, 315, 42, 55, 5, ["","","BF","","","","LUNAS",""]),
      ...makeRow("A", 41, 8, 20, 375, 42, 55, 5),
    ],
  },

  "SPG": {
    svgW: 620, svgH: 450,
    roads: [
      { x: 0, y: 0, w: 620, h: 15 }, { x: 0, y: 435, w: 620, h: 15 },
      { x: 0, y: 0, w: 15, h: 450 }, { x: 605, y: 0, w: 15, h: 450 },
      { x: 15, y: 180, w: 425, h: 15 }, { x: 15, y: 315, w: 590, h: 15 },
      { x: 285, y: 15, w: 15, h: 165 }, { x: 440, y: 15, w: 15, h: 420 },
    ],
    parks: [{ x: 455, y: 22, w: 145, h: 285, label: "Fasilitas" }],
    blocks: [
      ...makeRow("M", 60, 5, 22, 22, 42, 55, 5, ["","","BF","",""]),
      ...makeRow("M", 65, 5, 22, 82, 42, 55, 5),
      ...makeRow("M", 70, 3, 305, 22, 42, 55, 5, ["BF","AKAD",""]),
      ...makeRow("M", 73, 3, 305, 82, 42, 55, 5, ["LUNAS","",""]),
      ...makeRow("M", 76, 5, 22, 200, 42, 55, 5, ["","HOLD","","",""]),
      ...makeRow("M", 81, 5, 22, 260, 42, 55, 5),
      ...makeRow("M", 86, 8, 22, 335, 42, 55, 5, ["","BF","","AKAD","","","",""]),
      ...makeRow("M", 94, 8, 22, 392, 42, 55, 5),
    ],
  },

  "Ngaglik Residen": {
    svgW: 620, svgH: 450,
    roads: [
      { x: 0, y: 0, w: 620, h: 15 }, { x: 0, y: 435, w: 620, h: 15 },
      { x: 0, y: 0, w: 15, h: 450 }, { x: 605, y: 0, w: 15, h: 450 },
      { x: 15, y: 160, w: 590, h: 15 }, { x: 15, y: 305, w: 590, h: 15 },
      { x: 315, y: 15, w: 15, h: 145 }, { x: 315, y: 175, w: 15, h: 130 },
    ],
    parks: [{ x: 335, y: 178, w: 265, h: 122, label: "Taman & Fasilitas" }],
    blocks: [
      ...makeRow("MI",  1, 6, 22, 22, 42, 55, 5, ["BF","","","","AKAD",""]),
      ...makeRow("MI",  7, 6, 22, 82, 42, 55, 5, ["","HOLD","","","",""]),
      ...makeRow("MI", 13, 6, 335, 22, 42, 55, 5, ["","LUNAS","","","",""]),
      ...makeRow("MI", 19, 3, 335, 82, 42, 55, 5, ["BF","",""]),
      ...makeRow("MI", 22, 6, 22, 180, 42, 55, 5, ["","","AKAD","","",""]),
      ...makeRow("MI", 28, 6, 22, 240, 42, 55, 5),
      ...makeRow("MI", 34, 8, 22, 325, 42, 55, 5, ["","BF","","","LUNAS","","",""]),
      ...makeRow("MI", 42, 8, 22, 382, 42, 55, 5),
    ],
  },
};

/* ─── Generate static SVG string from layout (no status colors) ─── */
export function generateSvgContent(layout: SvgLayout): string {
  const roads = layout.roads
    .map((r) => `  <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="#c4cad4"/>`)
    .join("\n");

  const parks = layout.parks
    .map((p) => [
      `  <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="#86efac" rx="3"/>`,
      p.label
        ? `  <text x="${p.x + p.w / 2}" y="${p.y + p.h / 2}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#166534" font-weight="600">${p.label}</text>`
        : "",
    ].filter(Boolean).join("\n"))
    .join("\n");

  const blocks = layout.blocks
    .map((b) =>
      [
        `  <g id="${b.kode}" data-kode="${b.kode}">`,
        `    <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="white" stroke="#a0aec0" stroke-width="0.8" rx="2"/>`,
        `    <text x="${b.x + b.w / 2}" y="${b.y + b.h / 2}" text-anchor="middle" dominant-baseline="middle" font-size="7.5" fill="#374151" font-weight="600">${b.kode}</text>`,
        `  </g>`,
      ].join("\n")
    )
    .join("\n");

  return `<svg width="${layout.svgW}" height="${layout.svgH}" viewBox="0 0 ${layout.svgW} ${layout.svgH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${layout.svgW}" height="${layout.svgH}" fill="#ede9e0"/>
${roads}
${parks}
${blocks}
</svg>`;
}

/* ─── Dummy master data ─── */
export const LOKASI_KAVLING_DUMMY: LokasiKavling[] = [
  {
    id: 1,
    nama: "Punten Regency",
    nama_singkat: "PR",
    header: "KAVLING PUNTEN REGENCY",
    alamat: "Jl. Mulia Kota Batu",
    nama_perusahaan: "PT. BERKAH KAVLING NUSANTARA",
    nama_admin: "Budi Santoso",
    nama_mengetahui: "Direktur Utama",
    alamat_perusahaan: "Jl. Mulia No.1 Kota Batu",
    telp_perusahaan: "(0341) 555-0001",
    kota_penandatangan: "Kota Batu",
    nama_penandatangan: "Ir. Hendra Wijaya",
    jabatan_penandatangan: "Direktur",
    jenis_pembelian: "cash_kredit",
    urutan_lokasi: 1,
    jumlah_kavling: 206,
    svg_content: generateSvgContent(LOKASI_SVG_LAYOUTS["Punten Regency"]),
  },
  {
    id: 2,
    nama: "SPG",
    nama_singkat: "SPG",
    header: "KAVLING SPG",
    alamat: "Jl. Diponegoro Kota Batu",
    nama_perusahaan: "PT. MULIA ASRI SENTOSA",
    nama_admin: "Rina Mulyani",
    nama_mengetahui: "Manager Operasional",
    alamat_perusahaan: "Jl. Diponegoro No.45 Kota Batu",
    telp_perusahaan: "(0341) 555-0002",
    kota_penandatangan: "Kota Batu",
    nama_penandatangan: "Drs. Agung Prasetyo",
    jabatan_penandatangan: "Direktur Utama",
    jenis_pembelian: "kredit",
    urutan_lokasi: 2,
    jumlah_kavling: 224,
    svg_content: generateSvgContent(LOKASI_SVG_LAYOUTS["SPG"]),
  },
  {
    id: 3,
    nama: "Ngaglik Residen",
    nama_singkat: "NR",
    header: "KAVLING NGAGLIK RESIDEN",
    alamat: "Jl. Warureja - Pemalang",
    nama_perusahaan: "PT. MULIA ASRI SENTOSA",
    nama_admin: "Suharto",
    nama_mengetahui: "Manager Area",
    alamat_perusahaan: "Jl. Pemalang No.10",
    telp_perusahaan: "(0284) 555-0003",
    kota_penandatangan: "Pemalang",
    nama_penandatangan: "Teguh Santoso",
    jabatan_penandatangan: "Kepala Cabang",
    jenis_pembelian: "cash_kredit",
    urutan_lokasi: 3,
    jumlah_kavling: 227,
    svg_content: generateSvgContent(LOKASI_SVG_LAYOUTS["Ngaglik Residen"]),
  },
];
