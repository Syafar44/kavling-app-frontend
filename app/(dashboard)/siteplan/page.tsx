"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { FileText, Download, EyeOff, Eye } from "lucide-react";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

// ─── Types ─────────────────────────────────────────────────────────────────────
type LokasiItem = {
  id: number;
  nama: string;
  nama_singkat: string;
  svg_content: string;
  jumlah_kavling: number;
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

// ─── Constants ─────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<number, string> = {
  0: "#ffffff",   // Ready
  1: "#eab308",   // HOLD
  2: "#3b82f6",   // BF
  3: "#8b5cf6",   // AKAD
  4: "#ef4444",   // User Cancel
  5: "#06b6d4",   // LUNAS
};

const STATUS_LABELS: Record<number, string> = {
  0: "Ready",
  1: "HOLD",
  2: "BF",
  3: "AKAD",
  4: "User Cancel",
  5: "LUNAS",
};

const LEGEND_ITEMS = Object.entries(STATUS_LABELS).map(([k, label]) => ({
  status: Number(k),
  label,
  color: STATUS_COLORS[Number(k)],
}));

// ─── SVG Helper ────────────────────────────────────────────────────────────────
function applyKavlingColors(
  svg: string,
  kavlingMap: Record<string, KavlingItem>
): string {
  return svg.replace(/<path([^>]*)\/>/g, (match, attrs) => {
    const idMatch = attrs.match(/\bid="([^"]+)"/);
    if (!idMatch) return match;
    const kode = idMatch[1];
    const kavling = kavlingMap[kode];
    if (!kavling) return match;
    const color = STATUS_COLORS[kavling.status] ?? "#ffffff";
    let newAttrs = attrs.replace(/fill="[^"]*"/, `fill="${color}"`);
    if (newAttrs === attrs) newAttrs += ` fill="${color}"`;
    newAttrs += ` data-kode="${kode}"`;
    return `<path${newAttrs}/>`;
  });
}

function extractSvgMeta(svg: string) {
  const w = parseFloat(svg.match(/(?:^|\s)width="([^"]+)"/)?.[1] ?? "600");
  const h = parseFloat(svg.match(/(?:^|\s)height="([^"]+)"/)?.[1] ?? "440");
  return { w, h };
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function SiteplanPage() {
  const [lokasis, setLokasis]   = useState<LokasiItem[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [detail, setDetail]     = useState<SiteplanDetail | null>(null);
  const [loading, setLoading]   = useState(false);
  const [hovered, setHovered]   = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [scale, setScale]   = useState(1);
  const [pan, setPan]       = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart     = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const containerRef  = useRef<HTMLDivElement>(null);
  const svgWrapRef    = useRef<HTMLDivElement>(null);

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

  // ── Load detail when tab changes ──
  useEffect(() => {
    if (!activeId) return;
    setLoading(true);
    setDetail(null);
    setHovered(null);
    api.get<ApiResponse<SiteplanDetail>>(`/siteplan/${activeId}`)
      .then((r) => setDetail(r.data.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeId]);

  // ── Kavling map ──
  const kavlingMap = useMemo(() => {
    const map: Record<string, KavlingItem> = {};
    (detail?.kavlings ?? []).forEach((k) => { map[k.kode_kavling] = k; });
    return map;
  }, [detail]);

  // ── Modified SVG with colored paths ──
  const modifiedSvg = useMemo(() => {
    const svg = detail?.lokasi?.svg_content;
    if (!svg) return "";
    return applyKavlingColors(svg, kavlingMap);
  }, [detail, kavlingMap]);

  // ── Attach hover event listeners to SVG paths ──
  useEffect(() => {
    const container = svgWrapRef.current;
    if (!container || !modifiedSvg) return;

    const cleanup: (() => void)[] = [];

    container.querySelectorAll<SVGPathElement>("path[data-kode]").forEach((path) => {
      const kode = path.dataset.kode!;

      const onEnter = () => {
        setHovered(kode);
        path.style.stroke = "#1d4ed8";
        path.style.strokeWidth = "3";
        path.style.filter = "brightness(0.88)";
      };
      const onLeave = () => {
        setHovered(null);
        path.style.stroke = "";
        path.style.strokeWidth = "";
        path.style.filter = "";
      };

      path.addEventListener("mouseenter", onEnter);
      path.addEventListener("mouseleave", onLeave);
      cleanup.push(
        () => path.removeEventListener("mouseenter", onEnter),
        () => path.removeEventListener("mouseleave", onLeave),
      );
    });

    return () => cleanup.forEach((fn) => fn());
  }, [modifiedSvg]);

  // ── Wheel zoom ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setScale((s) => Math.min(Math.max(s * (e.deltaY < 0 ? 1.1 : 0.91), 0.3), 5));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // ── Pan ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  }, [pan]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    });
  }, [dragging]);

  const onMouseUp = useCallback(() => setDragging(false), []);

  // ── Reset view on tab change ──
  useEffect(() => { setScale(1); setPan({ x: 0, y: 0 }); }, [activeId]);

  const svgMeta       = useMemo(() => extractSvgMeta(detail?.lokasi?.svg_content ?? ""), [detail]);
  const hoveredKavling = hovered ? kavlingMap[hovered] : null;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold text-gray-900">Lokasi Kavling</h1>

      {/* Tabs + Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 flex-wrap">
          {lokasis.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Tidak ada lokasi</p>
          ) : (
            lokasis.map((lok) => (
              <button
                key={lok.id}
                onClick={() => setActiveId(lok.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${
                  activeId === lok.id
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {lok.nama}
              </button>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-medium">
            <FileText className="h-4 w-4" /> Lihat Denah (PDF)
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium">
            <Download className="h-4 w-4" /> Download Denah
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div
          ref={containerRef}
          className="w-full overflow-hidden bg-[#f0ece4]"
          style={{ height: 500, cursor: dragging ? "grabbing" : "grab", userSelect: "none" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-sm animate-pulse">Memuat siteplan...</div>
            </div>
          ) : !detail ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-sm">Pilih lokasi untuk melihat siteplan</div>
            </div>
          ) : !detail.lokasi.svg_content ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-sm">Belum ada SVG siteplan untuk lokasi ini</div>
            </div>
          ) : (
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: "top left",
                width: svgMeta.w,
                height: svgMeta.h,
              }}
            >
              <div
                ref={svgWrapRef}
                style={{ width: svgMeta.w, height: svgMeta.h, display: "block" }}
                dangerouslySetInnerHTML={{ __html: modifiedSvg }}
              />
            </div>
          )}
        </div>

        {/* Zoom hint */}
        <div className="absolute bottom-2 left-3 text-xs text-gray-400 select-none">
          Scroll untuk zoom · Drag untuk geser
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-2 right-3 flex gap-1">
          <button
            onClick={() => setScale((s) => Math.min(s * 1.2, 5))}
            className="w-7 h-7 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-sm font-bold flex items-center justify-center shadow-sm"
          >+</button>
          <button
            onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }}
            className="h-7 px-2 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 text-xs flex items-center justify-center shadow-sm"
          >Reset</button>
          <button
            onClick={() => setScale((s) => Math.max(s * 0.83, 0.3))}
            className="w-7 h-7 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-sm font-bold flex items-center justify-center shadow-sm"
          >−</button>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="absolute top-3 right-3 bg-white border border-gray-200 rounded-lg shadow-md p-3 min-w-36">
            <p className="text-xs font-semibold text-gray-700 mb-2">Status Progres</p>
            <div className="space-y-1.5">
              {LEGEND_ITEMS.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0 border border-gray-300"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-600">{item.label}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowLegend(false)}
              className="mt-3 w-full flex items-center justify-center gap-1 px-2 py-1 rounded border border-gray-300 text-xs text-gray-500 hover:bg-gray-50"
            >
              <EyeOff className="h-3 w-3" /> Hide Legend
            </button>
          </div>
        )}

        {!showLegend && (
          <button
            onClick={() => setShowLegend(true)}
            className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 bg-white text-xs text-gray-600 hover:bg-gray-50 shadow-sm"
          >
            <Eye className="h-3 w-3" /> Show Legend
          </button>
        )}

        {/* Hovered kavling info */}
        {hoveredKavling && (
          <div className="absolute top-3 left-3 bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 min-w-32">
            <p className="text-xs font-semibold text-gray-800">{hoveredKavling.kode_kavling}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: STATUS_COLORS[hoveredKavling.status] ?? "#fff" }}
              />
              <p className="text-xs text-gray-500">
                {STATUS_LABELS[hoveredKavling.status] ?? "—"}
              </p>
            </div>
            {hoveredKavling.customer?.nama && (
              <p className="text-xs text-gray-600 mt-0.5 truncate max-w-40">
                {hoveredKavling.customer.nama}
              </p>
            )}
          </div>
        )}

        {/* Kavling count badge */}
        {detail && (
          <div className="absolute bottom-8 left-3 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-500 shadow-sm">
            {detail.kavlings.length} kavling · {detail.kavlings.filter(k => k.status === 0).length} tersedia
          </div>
        )}
      </div>
    </div>
  );
}
