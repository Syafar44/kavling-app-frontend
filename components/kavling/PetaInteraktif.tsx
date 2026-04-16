"use client";

import React, { useState, useMemo } from "react";
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

/** Convert kebab-case SVG attribute names to React camelCase prop names */
function toReactAttrs(attrs: Record<string, string>): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") {
      result["className"] = value;
    } else if (key === "for") {
      result["htmlFor"] = value;
    } else {
      // kebab-case → camelCase (e.g. stroke-width → strokeWidth)
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
      // skip non-visual tags
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

  // path with id that matches a kavling
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

  // all other elements rendered as-is (decorative)
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

export function PetaInteraktif({
  denahKavling,
  onBooking,
  onCash,
  onKredit,
  onKonversi,
  onEdit,
}: PetaInteraktifProps) {
  const [popup, setPopup] = useState<PopupInfo | null>(null);

  const { viewBox, elements } = useMemo(
    () => parseSVG(denahKavling.svg_content),
    [denahKavling.svg_content]
  );

  const kavlingMap = useMemo(() => {
    const map = new Map<string, Kavling>();
    for (const k of denahKavling.kavlings) {
      map.set(k.kode_kavling, k);
    }
    return map;
  }, [denahKavling.kavlings]);

  function handlePathClick(e: React.MouseEvent<SVGElement>, kavling: Kavling) {
    e.stopPropagation();
    const rect = (e.currentTarget.closest("svg") as SVGElement).getBoundingClientRect();
    setPopup({
      kavling,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  return (
    <div className="relative bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Peta Kavling Interaktif
      </h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
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

      {/* SVG Map */}
      <div className="relative overflow-auto" onClick={() => setPopup(null)}>
        <svg
          viewBox={viewBox}
          className="w-full border border-gray-100 rounded bg-gray-50"
          style={{ minHeight: 300 }}
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

        {/* Popup */}
        {popup && (
          <div
            className="absolute z-10 bg-white shadow-xl border border-gray-200 rounded-lg p-4 w-64"
            style={{
              left: Math.min(popup.x + 10, 500),
              top: popup.y + 10,
            }}
            onClick={(e) => e.stopPropagation()}
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
