"use client";

import type { ReactNode } from "react";
import { GripVertical } from "lucide-react";

const DAY_TYPE = "application/x-viva-day";
const EX_TYPE = "application/x-viva-ex";

function readIndex(event: React.DragEvent, type: string) {
  const raw = event.dataTransfer.getData(type) || event.dataTransfer.getData("text/plain");
  const index = Number(raw);
  return Number.isFinite(index) ? index : -1;
}

export function DragGrip({ label }: { label: string }) {
  return (
    <span
      className="mt-1 grid size-8 shrink-0 cursor-grab place-items-center rounded-lg text-muted active:cursor-grabbing"
      aria-label={label}
      title="Drag to reorder"
    >
      <GripVertical size={15} />
    </span>
  );
}

export function DayDragRow({
  index,
  onMove,
  children,
  className,
}: {
  index: number;
  onMove: (from: number, to: number) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(DAY_TYPE, String(index));
        event.dataTransfer.setData("text/plain", String(index));
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const from = readIndex(event, DAY_TYPE);
        if (from >= 0) onMove(from, index);
      }}
      className={className}
    >
      {children}
    </div>
  );
}

export function ExerciseDragRow({
  index,
  onMove,
  children,
  className,
}: {
  index: number;
  onMove: (from: number, to: number) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <li
      draggable
      onDragStart={(event) => {
        event.stopPropagation();
        event.dataTransfer.setData(EX_TYPE, String(index));
        event.dataTransfer.setData("text/plain", String(index));
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const from = readIndex(event, EX_TYPE);
        if (from >= 0) onMove(from, index);
      }}
      className={className}
    >
      {children}
    </li>
  );
}

export function ItemDragRow({
  index,
  onMove,
  children,
  className,
}: {
  index: number;
  onMove: (from: number, to: number) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", String(index));
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();
        const from = Number(event.dataTransfer.getData("text/plain"));
        if (Number.isFinite(from) && from >= 0) onMove(from, index);
      }}
      className={className}
    >
      {children}
    </div>
  );
}
