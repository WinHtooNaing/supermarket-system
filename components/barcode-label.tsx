"use client";

import { useRef } from "react";
import { Download } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type BarcodeLabelProps = {
  value: string;
  className?: string;
  barHeight?: number;
  showValue?: boolean;
  downloadable?: boolean;
  fileName?: string;
};

const CODE39_PATTERNS: Record<string, string> = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  $: "nwnwnwnnn",
  "/": "nwnwnnnwn",
  "+": "nwnnnwnwn",
  "%": "nnnwnwnwn",
  "*": "nwnnwnwnn",
};

function buildCode39Pattern(value: string) {
  const safe = value.toUpperCase().replace(/[^0-9A-Z\-\. $/+%]/g, "");
  const data = `*${safe || "0"}*`;
  const chars = data.split("");
  const narrow = 2;
  const wide = 5;
  const gap = 2;
  const quietZone = 12;

  const units: Array<{ isBar: boolean; width: number }> = [
    { isBar: false, width: quietZone },
  ];

  chars.forEach((char, charIndex) => {
    const pattern = CODE39_PATTERNS[char];
    if (!pattern) return;

    pattern.split("").forEach((token, idx) => {
      units.push({
        isBar: idx % 2 === 0,
        width: token === "w" ? wide : narrow,
      });
    });

    if (charIndex < chars.length - 1) {
      units.push({ isBar: false, width: gap });
    }
  });

  units.push({ isBar: false, width: quietZone });
  return { units, safeValue: safe || "0" };
}

export function BarcodeLabel({
  value,
  className,
  barHeight = 44,
  showValue = true,
  downloadable = false,
  fileName,
}: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { units, safeValue } = buildCode39Pattern(value);
  const viewWidth = units.reduce((sum, unit) => sum + unit.width, 0);

  function handleDownload() {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName || `barcode-${safeValue}`}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className={cn("rounded-md border bg-background p-2", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewWidth} ${barHeight}`}
        className="h-10 w-full"
        role="img"
        aria-label={`barcode-${value}`}
      >
        {units.map((unit, index) => {
          const x = units.slice(0, index).reduce((sum, n) => sum + n.width, 0);

          return (
            <rect
              key={`${value}-${index}`}
              x={x}
              y={0}
              width={unit.width}
              height={barHeight}
              fill={unit.isBar ? "black" : "white"}
            />
          );
        })}
      </svg>
      {showValue && (
        <p className="mt-1 text-center font-mono text-xs tracking-widest text-muted-foreground">
          {safeValue}
        </p>
      )}
      {downloadable && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={handleDownload}
        >
          <Download className="size-4" />
          Download Barcode
        </Button>
      )}
    </div>
  );
}
