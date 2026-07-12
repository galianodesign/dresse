"use client";

import { Prenda } from "@/lib/data";

export default function PrendaCard({ prenda }: { prenda: Prenda }) {
  return (
    <div className="hang-tag overflow-hidden pt-5">
      <div className="mx-3 flex h-28 items-center justify-center overflow-hidden rounded-md bg-accentSoft">
        {prenda.imagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={prenda.imagen} alt={prenda.nombre} className="h-full w-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-accent" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M16 4l4 3-2 3-2-1v11H8V9L6 10 4 7l4-3a3 3 0 004 0 3 3 0 004 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate font-display text-base leading-tight">{prenda.nombre}</p>
        <p className="mt-0.5 text-[12px] uppercase tracking-widest text-muted font-body">
          {prenda.color} · {prenda.estilo}
        </p>
      </div>
    </div>
  );
}
