"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { FileText, Download, EyeOff, Eye, Printer } from "lucide-react";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

// ─── Types ─────────────────────────────────────────────────────────────────────
type LokasiItem = {
  id: number;
  nama: string;
  svg_content: string;
};

type KavlingItem = {
  id: number;
  kode_kavling: string;
  status: number;
  customer?: { nama: string } | null;
};

type SiteplanDetail = {
  lokasi: LokasiItem;
  kavlings: KavlingItem[];
};

type KavlingFullDetail = {
  kavling: {
    id: number;
    kode_kavling: string;
    panjang_kanan: number;
    panjang_kiri: number;
    lebar_depan: number;
    lebar_belakang: number;
    luas_tanah: number;
    harga_jual_cash: number;
    no_sertipikat: string;
    keterangan: string;
    status: number;
  };
  lokasi: { nama: string } | null;
  customer: {
    nama: string;
    no_ktp: string;
    no_ktp_pasangan: string;
    tempat_lahir: string;
    tanggal_lahir: string | null;
    jenis_kelamin: string;
    alamat: string;
    alamat_domisili: string;
    no_telp: string;
    npwp: string;
    jenis_pembelian?: string;
    foto_ktp?: string;
    foto_kk?: string;
    foto_pemohon?: string;
    foto_ktp_pasangan?: string;
    foto_npwp?: string;
    foto_bpjs?: string;
  } | null;
};

// ─── Constants ─────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<number, string> = {
  0: "#ffffff",
  1: "#eab308",
  2: "#3b82f6",
  3: "#8b5cf6",
  4: "#ef4444",
  5: "#06b6d4",
};

const STATUS_LABELS: Record<number, string> = {
  0: "Ready",
  1: "HOLD",
  2: "BF",
  3: "AKAD",
  4: "User Cancel",
  5: "LUNAS",
};

const LEGEND_ITEMS = Object.entries(STATUS_LABELS)
  .filter(([k]) => Number(k) !== 0)
  .map(([k, label]) => ({ status: Number(k), label, color: STATUS_COLORS[Number(k)] }));

// ─── SVG parsing ───────────────────────────────────────────────────────────────
type SvgNode = {
  tag: string;
  attrs: Record<string, string>;
  children: SvgNode[];
};

function parseSvg(raw: string): { viewBox: string; w: number; h: number; children: SvgNode[] } {
  if (typeof window === "undefined" || !raw) {
    return { viewBox: "0 0 600 440", w: 600, h: 440, children: [] };
  }
  const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
  const root = doc.querySelector("svg");
  if (!root) return { viewBox: "0 0 600 440", w: 600, h: 440, children: [] };

  const viewBox = root.getAttribute("viewBox") ?? "0 0 600 440";
  const w = parseFloat(root.getAttribute("width") ?? "600");
  const h = parseFloat(root.getAttribute("height") ?? "440");

  const walk = (el: Element): SvgNode[] => {
    const out: SvgNode[] = [];
    for (const child of Array.from(el.children)) {
      const tag = child.tagName.toLowerCase();
      if (["defs", "style", "script", "title", "desc"].includes(tag)) continue;
      const attrs: Record<string, string> = {};
      for (const a of Array.from(child.attributes)) attrs[a.name] = a.value;
      out.push({ tag, attrs, children: walk(child) });
    }
    return out;
  };

  return { viewBox, w, h, children: walk(root) };
}

// Convert raw SVG attribute names to React camelCase (e.g. stroke-width → strokeWidth).
function toReactAttrs(attrs: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") out.className = v;
    else out[k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
  }
  return out;
}

// Recursive React renderer for parsed SVG nodes.
// Paths with an `id` that are known kavlings become clickable with status-colored fill.
function SvgNodeRenderer({
  node,
  kavlingMap,
  onPathClick,
  onPathEnter,
  onPathLeave,
}: {
  node: SvgNode;
  kavlingMap: Record<string, KavlingItem>;
  onPathClick: (kode: string) => void;
  onPathEnter: (kode: string) => void;
  onPathLeave: (kode: string) => void;
}) {
  const { tag, attrs, children } = node;

  if (tag === "path" && attrs.id) {
    const kode = attrs.id;
    const kavling = kavlingMap[kode];
    const color = kavling ? (STATUS_COLORS[kavling.status] ?? "#ffffff") : "#ffffff";
    const reactAttrs = toReactAttrs({ ...attrs, fill: color });
    return (
      <path
        {...reactAttrs}
        style={{ cursor: "pointer" }}
        onClick={(e) => { e.stopPropagation(); onPathClick(kode); }}
        onMouseEnter={() => onPathEnter(kode)}
        onMouseLeave={() => onPathLeave(kode)}
      />
    );
  }

  const Tag = tag as keyof React.JSX.IntrinsicElements;
  const reactAttrs = toReactAttrs(attrs);
  if (children.length === 0) return <Tag {...(reactAttrs as object)} />;
  return (
    <Tag {...(reactAttrs as object)}>
      {children.map((c, i) => (
        <SvgNodeRenderer
          key={i}
          node={c}
          kavlingMap={kavlingMap}
          onPathClick={onPathClick}
          onPathEnter={onPathEnter}
          onPathLeave={onPathLeave}
        />
      ))}
    </Tag>
  );
}

// ─── Readonly row helpers (inline label-left layout, matching reference) ──────
function RORow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[170px_1fr] items-center gap-4">
      <label className="text-sm text-gray-600">{label}</label>
      <div className="w-full rounded border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-800 min-h-9">
        {value || "\u00a0"}
      </div>
    </div>
  );
}

function RORowPair({
  label1, value1, label2, value2,
}: { label1: string; value1: string; label2: string; value2: string }) {
  return (
    <div className="grid grid-cols-[170px_1fr_130px_1fr] items-center gap-4">
      <label className="text-sm text-gray-600">{label1}</label>
      <div className="w-full rounded border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-800 min-h-9">
        {value1 || "\u00a0"}
      </div>
      <label className="text-sm text-gray-600">{label2}</label>
      <div className="w-full rounded border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-800 min-h-9">
        {value2 || "\u00a0"}
      </div>
    </div>
  );
}

function RORowHalf({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[170px_1fr_130px_1fr] items-center gap-4">
      <label className="text-sm text-gray-600">{label}</label>
      <div className="w-full rounded border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-800 min-h-9">
        {value || "\u00a0"}
      </div>
      <div />
      <div />
    </div>
  );
}

function RORowTextarea({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[170px_1fr] items-start gap-4">
      <label className="text-sm text-gray-600 pt-2">{label}</label>
      <div className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 min-h-20">
        {value || "\u00a0"}
      </div>
    </div>
  );
}

function RORowFotoPair({
  label1, value1, label2, value2,
}: { label1: string; value1?: string; label2: string; value2?: string }) {
  return (
    <div className="grid grid-cols-[170px_1fr_170px_1fr] items-center gap-4 text-sm">
      <span className="text-gray-600">{label1}</span>
      <span className="text-gray-700">{value1 || "-"}</span>
      <span className="text-gray-600">{label2}</span>
      <span className="text-gray-700">{value2 || "-"}</span>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function KavlingPage() {
  const [lokasis, setLokasis]   = useState<LokasiItem[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [siteplan, setSiteplan] = useState<SiteplanDetail | null>(null);
  const [loading, setLoading]   = useState(false);
  const [hovered, setHovered]   = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  // zoom / pan
  const [scale, setScale]       = useState(1);
  const [pan, setPan]           = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart    = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const didDrag      = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // detail modal
  const [detailOpen, setDetailOpen]   = useState(false);
  const [detailTab, setDetailTab]     = useState<"unit" | "user">("unit");
  const [fullDetail, setFullDetail]   = useState<KavlingFullDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Load lokasi list ──
  useEffect(() => {
    api.get<ApiResponse<LokasiItem[]>>("/siteplan")
      .then((r) => {
        const list = r.data.data ?? [];
        setLokasis(list);
        if (list.length > 0) setActiveId(list[0].id);
      })
      .catch(() => {});
  }, []);

  // ── Load siteplan detail when tab changes ──
  useEffect(() => {
    if (!activeId) return;
    setLoading(true);
    setSiteplan(null);
    setHovered(null);
    api.get<ApiResponse<SiteplanDetail>>(`/siteplan/${activeId}`)
      .then((r) => setSiteplan(r.data.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeId]);

  // ── Kavling map ──
  const kavlingMap = useMemo(() => {
    const map: Record<string, KavlingItem> = {};
    (siteplan?.kavlings ?? []).forEach((k) => { map[k.kode_kavling] = k; });
    return map;
  }, [siteplan]);

  // ── Parse SVG into React-renderable tree ──
  const parsedSvg = useMemo(
    () => parseSvg(siteplan?.lokasi?.svg_content ?? ""),
    [siteplan]
  );

  // ── Open kavling detail ──
  const openKavlingDetail = useCallback(async (kode: string) => {
    if (!activeId) return;
    setDetailLoading(true);
    setDetailOpen(true);
    setDetailTab("unit");
    setFullDetail(null);
    try {
      const res = await api.get<ApiResponse<KavlingFullDetail>>(
        `/siteplan/${activeId}/kavling/${kode}`
      );
      setFullDetail(res.data.data ?? null);
    } catch {
      // keep modal open with empty data so user can still see the clicked kavling
    } finally {
      setDetailLoading(false);
    }
  }, [activeId]);

  // ── Path handlers passed into SvgNodeRenderer ──
  const handlePathClick = useCallback((kode: string) => {
    if (didDrag.current) return;
    openKavlingDetail(kode);
  }, [openKavlingDetail]);

  const handlePathEnter = useCallback((kode: string) => setHovered(kode), []);
  const handlePathLeave = useCallback(() => setHovered(null), []);

  // ── Wheel zoom ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setScale((s) => Math.min(Math.max(s * (e.deltaY < 0 ? 1.1 : 0.91), 0.25), 6));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // ── Pan ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    didDrag.current = false;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  }, [pan]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
    setPan({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
  }, [dragging]);

  const onMouseUp = useCallback(() => setDragging(false), []);

  // ── Reset view on tab change ──
  useEffect(() => { setScale(1); setPan({ x: 0, y: 0 }); }, [activeId]);

  const hoveredKavling = hovered ? kavlingMap[hovered] : null;
  const kv = fullDetail?.kavling;
  const cust = fullDetail?.customer;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold text-gray-900">Lokasi Kavling</h1>

      {/* Tabs + Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 flex-wrap">
          {lokasis.map((lok) => (
            <button
              key={lok.id}
              onClick={() => setActiveId(lok.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors rounded-t ${
                activeId === lok.id
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {lok.nama}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-medium">
            <FileText className="h-4 w-4" /> Lihat Denah (PDF)
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium">
            <Download className="h-4 w-4" /> Download Denah
          </button>
        </div>
      </div>

      {/* Map wrapper */}
      <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div
          ref={containerRef}
          className="w-full bg-[#ede9e0] overflow-hidden"
          style={{ height: 490, cursor: dragging ? "grabbing" : "grab", userSelect: "none" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-sm animate-pulse">Memuat siteplan...</div>
            </div>
          ) : !siteplan ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-sm">Pilih lokasi untuk melihat siteplan</div>
            </div>
          ) : !siteplan.lokasi.svg_content ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-sm">Belum ada SVG siteplan untuk lokasi ini</div>
            </div>
          ) : (
            <div className="flex justify-center h-full items-start pt-4">
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                  transformOrigin: "top center",
                  width: parsedSvg.w,
                  height: parsedSvg.h,
                  flexShrink: 0,
                }}
              >
                <svg
                  viewBox={parsedSvg.viewBox}
                  width={parsedSvg.w}
                  height={parsedSvg.h}
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: "block" }}
                >
                  {parsedSvg.children.map((node, i) => (
                    <SvgNodeRenderer
                      key={i}
                      node={node}
                      kavlingMap={kavlingMap}
                      onPathClick={handlePathClick}
                      onPathEnter={handlePathEnter}
                      onPathLeave={handlePathLeave}
                    />
                  ))}
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Hint */}
        <div className="absolute bottom-2 left-3 text-xs text-gray-400 pointer-events-none select-none">
          Scroll untuk zoom · Drag untuk geser · Klik kavling untuk detail
        </div>

        {/* Zoom buttons */}
        <div className="absolute bottom-2 right-3 flex gap-1">
          <button onClick={() => setScale((s) => Math.min(s * 1.2, 6))}
            className="h-7 w-7 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-sm font-bold flex items-center justify-center shadow-sm">+</button>
          <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }}
            className="h-7 px-2 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 text-xs flex items-center justify-center shadow-sm">Reset</button>
          <button onClick={() => setScale((s) => Math.max(s * 0.83, 0.25))}
            className="h-7 w-7 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-sm font-bold flex items-center justify-center shadow-sm">−</button>
        </div>

        {/* Hover tooltip */}
        {hoveredKavling && !detailOpen && (
          <div className="absolute top-3 left-3 bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 pointer-events-none">
            <p className="text-xs font-semibold text-gray-800">{hoveredKavling.kode_kavling}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: STATUS_COLORS[hoveredKavling.status] ?? "#fff" }} />
              <p className="text-xs text-gray-500">{STATUS_LABELS[hoveredKavling.status] ?? "—"}</p>
            </div>
            {hoveredKavling.customer?.nama && (
              <p className="text-xs text-gray-600 mt-0.5">{hoveredKavling.customer.nama}</p>
            )}
          </div>
        )}

        {/* Legend */}
        {showLegend ? (
          <div className="absolute top-3 right-3 bg-white border border-gray-200 rounded-lg shadow-md p-3 min-w-36">
            <p className="text-xs font-semibold text-gray-700 mb-2">Status Progres</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm shrink-0 border border-gray-300" style={{ backgroundColor: "#ffffff" }} />
                <span className="text-xs text-gray-600">Ready</span>
              </div>
              {LEGEND_ITEMS.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-600">{item.label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowLegend(false)}
              className="mt-3 w-full flex items-center justify-center gap-1 px-2 py-1 rounded border border-gray-200 text-xs text-gray-500 hover:bg-gray-50">
              <EyeOff className="h-3 w-3" /> Hide Legend
            </button>
          </div>
        ) : (
          <button onClick={() => setShowLegend(true)}
            className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 bg-white text-xs text-gray-600 hover:bg-gray-50 shadow-sm">
            <Eye className="h-3 w-3" /> Show Legend
          </button>
        )}

        {/* Kavling count */}
        {siteplan && (
          <div className="absolute bottom-8 left-3 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-500 shadow-sm">
            {siteplan.kavlings.length} kavling · {siteplan.kavlings.filter((k) => k.status === 0).length} tersedia
          </div>
        )}
      </div>

      {/* ─── Detail Modal ─── */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between bg-blue-600 rounded-t-xl px-5 py-3.5">
              <span className="text-white font-semibold text-base">Detail Data Kavling</span>
              <button onClick={() => setDetailOpen(false)} className="text-white/80 hover:text-white text-xl leading-none">×</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-2">
              {detailLoading ? (
                <div className="space-y-3 py-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : !fullDetail ? (
                <p className="text-sm text-gray-400 py-6 text-center">Data tidak ditemukan</p>
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded">
                      <Printer className="h-4 w-4" /> Cetak Data
                    </button>
                  </div>

                  <div className="flex border-b border-gray-200 mb-5 gap-4">
                    {(["unit", "user"] as const).map((t) => (
                      <button key={t} onClick={() => setDetailTab(t)}
                        className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                          detailTab === t
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}>
                        {t === "unit" ? "Data Unit Tanah Kavling" : "Data User"}
                      </button>
                    ))}
                  </div>

                  {detailTab === "unit" && kv && (
                    <div className="space-y-4">
                      <RORow label="Lokasi Kavling" value={fullDetail.lokasi?.nama ?? ""} />
                      <RORow label="Lokasi Tanah Kavling" value={kv.kode_kavling} />
                      <RORowPair
                        label1="Panjang Tanah" value1={String(kv.panjang_kanan || 0)}
                        label2="Lebar Tanah"   value2={String(kv.lebar_depan || 0)}
                      />
                      <RORow label="Luas Tanah" value={String(kv.luas_tanah || 0)} />
                      <RORow label="Harga Jual" value={String(kv.harga_jual_cash || 0)} />
                      <RORow label="Keterangan" value={kv.keterangan} />
                      <hr className="border-gray-200" />
                      <RORow label="No. Sertipikat" value={kv.no_sertipikat} />
                    </div>
                  )}

                  {detailTab === "user" && (
                    <div className="space-y-4">
                      <RORow label="Nama Lengkap" value={cust?.nama ?? ""} />
                      <RORowPair
                        label1="No. KTP"          value1={cust?.no_ktp ?? ""}
                        label2="No. KTP Pasangan" value2={cust?.no_ktp_pasangan ?? ""}
                      />
                      <RORowPair
                        label1="Tempat Lahir"  value1={cust?.tempat_lahir ?? ""}
                        label2="Tanggal Lahir" value2={cust?.tanggal_lahir ? new Date(cust.tanggal_lahir).toLocaleDateString("id-ID") : ""}
                      />
                      <RORowHalf label="Jenis Kelamin" value={cust?.jenis_kelamin ?? ""} />
                      <RORowTextarea label="Alamat KTP"      value={cust?.alamat ?? ""} />
                      <RORowTextarea label="Alamat Domisili" value={cust?.alamat_domisili ?? ""} />
                      <RORowHalf label="No. Telp / WA"   value={cust?.no_telp ?? ""} />
                      <RORowHalf label="NPWP"            value={cust?.npwp ?? ""} />
                      <RORowHalf label="Jenis Pembelian" value={cust?.jenis_pembelian ?? ""} />
                      <hr className="border-gray-200" />
                      <RORowFotoPair label1="Foto KTP"  value1={cust?.foto_ktp}  label2="Foto Pemohon"       value2={cust?.foto_pemohon} />
                      <RORowFotoPair label1="Foto KK"   value1={cust?.foto_kk}   label2="Foto KTP Pasangan"  value2={cust?.foto_ktp_pasangan} />
                      <RORowFotoPair label1="Foto NPWP" value1={cust?.foto_npwp} label2="Foto BPJS"          value2={cust?.foto_bpjs} />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
              <button onClick={() => setDetailOpen(false)}
                className="px-5 py-2 rounded bg-red-500 hover:bg-red-600 text-white text-sm font-medium">
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
