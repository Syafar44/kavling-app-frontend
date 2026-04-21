"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize2, Move } from "lucide-react";
import type { DenahKavling, Kavling } from "@/types/kavling";
import { KAVLING_STATUS_COLOR, KAVLING_STATUS_LABEL } from "@/types/kavling";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface PopupInfo {
  kavling: Kavling;
  x: number;
  y: number;
}

interface PetaInteraktifProps {
  denahKavling: DenahKavling;
  onBooking?: (kavling: Kavling) => void;
  onCash?: (kavling: Kavling) => void;
  onKredit?: (kavling: Kavling) => void;
  onKonversi?: (kavling: Kavling) => void;
  onEdit?: (kavling: Kavling) => void;
}

interface SvgElement {
  tag: string;
  attrs: Record<string, string>;
  children: SvgElement[];
  text?: string;
}

function toReactAttrs(attrs: Record<string, string>): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") {
      result["className"] = value;
    } else if (key === "for") {
      result["htmlFor"] = value;
    } else {
      result[key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = value;
    }
  }
  return result;
}

function parseSVG(svgString: string): { viewBox: string; elements: SvgElement[] } {
  if (typeof window === "undefined") {
    return { viewBox: "0 0 564 687", elements: [] };
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svgEl = doc.querySelector("svg");
  if (!svgEl) return { viewBox: "0 0 564 687", elements: [] };

  const viewBox = svgEl.getAttribute("viewBox") ?? "0 0 564 687";

  function extractElements(node: Element): SvgElement[] {
    const result: SvgElement[] = [];
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase();
      if (["defs", "style", "script", "title", "desc"].includes(tag)) continue;

      const attrs: Record<string, string> = {};
      for (const attr of Array.from(child.attributes)) {
        attrs[attr.name] = attr.value;
      }

      const children = extractElements(child);
      const text = child.textContent?.trim() || undefined;
      result.push({ tag, attrs, children, text });
    }
    return result;
  }

  return { viewBox, elements: extractElements(svgEl) };
}

function SvgElementRenderer({
  el,
  kavlingMap,
  onPathClick,
}: {
  el: SvgElement;
  kavlingMap: Map<string, Kavling>;
  onPathClick: (e: React.MouseEvent<SVGElement>, kavling: Kavling) => void;
}) {
  const { tag, attrs, children } = el;

  if (tag === "path" && attrs.id) {
    const kavling = kavlingMap.get(attrs.id);
    if (kavling) {
      const fill = KAVLING_STATUS_COLOR[kavling.status];
      return (
        <path
          {...attrs}
          fill={fill}
          fillOpacity={0.85}
          stroke="#fff"
          strokeWidth={1.5}
          className="cursor-pointer hover:brightness-90 transition-all"
          onClick={(e) => onPathClick(e as React.MouseEvent<SVGElement>, kavling)}
        />
      );
    }
  }

  const Tag = tag as keyof React.JSX.IntrinsicElements;
  const svgAttrs = toReactAttrs(attrs);

  if (children.length === 0) {
    return <Tag {...(svgAttrs as object)} />;
  }

  return (
    <Tag {...(svgAttrs as object)}>
      {children.map((child, i) => (
        <SvgElementRenderer
          key={i}
          el={child}
          kavlingMap={kavlingMap}
          onPathClick={onPathClick}
        />
      ))}
    </Tag>
  );
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

export function PetaInteraktif({
  denahKavling,
  onBooking,
  onCash,
  onKredit,
  onKonversi,
  onEdit,
}: PetaInteraktifProps) {
  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { viewBox, elements } = useMemo(
    () => parseSVG(denahKavling.svg_content || ""),
    [denahKavling.svg_content]
  );

  const kavlingMap = useMemo(() => {
    const map = new Map<string, Kavling>();
    for (const k of denahKavling.kavlings || []) {
      map.set(k.kode_kavling, k);
    }
    return map;
  }, [denahKavling.kavlings]);

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setPopup(null);
  }

  function zoomIn() {
    setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
  }

  function zoomOut() {
    setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
  }

  useEffect(() => {
    resetView();
  }, [denahKavling.id]);

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * ZOOM_STEP;
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
  }

  function handlePathClick(e: React.MouseEvent<SVGElement>, kavling: Kavling) {
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPopup({
      kavling,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as Element).closest("path[id]")) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  return (
    <div className="relative bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex flex-wrap gap-3">
          {([0, 1, 2, 3] as const).map((s) => (
            <div key={s} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ backgroundColor: KAVLING_STATUS_COLOR[s] }}
              />
              {KAVLING_STATUS_LABEL[s]}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-gray-50 rounded-md border border-gray-200 p-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            title="Zoom Out"
            className="h-7 w-7"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-600 w-12 text-center font-medium tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            title="Zoom In"
            className="h-7 w-7"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-gray-300 mx-1" />
          <Button
            size="icon"
            variant="ghost"
            onClick={resetView}
            title="Reset"
            className="h-7 w-7"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded border border-gray-100 bg-gray-50"
        style={{
          height: "calc(100vh - 340px)",
          minHeight: 400,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onClick={() => setPopup(null)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 120ms ease-out",
          }}
        >
          <svg
            viewBox={viewBox}
            className="w-full h-full max-h-full"
            preserveAspectRatio="xMidYMid meet"
            style={{ pointerEvents: "auto" }}
          >
            {elements.map((el, i) => (
              <SvgElementRenderer
                key={i}
                el={el}
                kavlingMap={kavlingMap}
                onPathClick={handlePathClick}
              />
            ))}
          </svg>
        </div>

        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs text-gray-500 pointer-events-none">
          <Move className="h-3 w-3" />
          Drag untuk geser · Ctrl+Scroll untuk zoom
        </div>

        {popup && (
          <div
            className="absolute z-10 bg-white shadow-xl border border-gray-200 rounded-lg p-4 w-64"
            style={{
              left: Math.min(popup.x + 10, (containerRef.current?.clientWidth ?? 500) - 270),
              top: Math.min(popup.y + 10, (containerRef.current?.clientHeight ?? 400) - 200),
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-gray-800">
              {popup.kavling.kode_kavling}
            </p>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              {popup.kavling.luas_tanah > 0 && (
                <p>Luas: {popup.kavling.luas_tanah} m²</p>
              )}
              {popup.kavling.harga_jual_cash > 0 && (
                <p>Harga: {formatRupiah(popup.kavling.harga_jual_cash)}</p>
              )}
              <p>
                Status:{" "}
                <span
                  className="font-medium"
                  style={{ color: KAVLING_STATUS_COLOR[popup.kavling.status] }}
                >
                  {KAVLING_STATUS_LABEL[popup.kavling.status]}
                </span>
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onEdit(popup.kavling);
                    setPopup(null);
                  }}
                >
                  Edit
                </Button>
              )}
              {popup.kavling.status === 0 && (
                <>
                  <Button
                    size="sm"
                    variant="warning"
                    onClick={() => {
                      onBooking?.(popup.kavling);
                      setPopup(null);
                    }}
                  >
                    Booking
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      onCash?.(popup.kavling);
                      setPopup(null);
                    }}
                  >
                    Cash
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      onKredit?.(popup.kavling);
                      setPopup(null);
                    }}
                  >
                    Kredit
                  </Button>
                </>
              )}
              {popup.kavling.status === 1 && (
                <Button
                  size="sm"
                  onClick={() => {
                    onKonversi?.(popup.kavling);
                    setPopup(null);
                  }}
                >
                  Konversi
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
