"use client";

import type { CSSProperties } from "react";

export interface Petal {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
}

interface PetalLayerProps {
  petals: Petal[];
  onDone: (id: number) => void;
}

export default function PetalLayer({ petals, onDone }: PetalLayerProps) {
  return (
    <>
      {petals.map((p) => (
        <span
          key={p.id}
          className="petal"
          style={
            {
              left: p.x,
              top: p.y,
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              background: p.color,
            } as CSSProperties
          }
          onAnimationEnd={() => onDone(p.id)}
        />
      ))}
    </>
  );
}
