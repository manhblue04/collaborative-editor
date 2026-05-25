import { useState } from 'react';

const ROWS = 10;
const COLS = 10;

export default function TableGridPicker({ onSelect, onClose }) {
  const [hovered, setHovered] = useState({ row: 0, col: 0 });

  return (
    <div className="p-2">
      <div className="mb-1 text-xs text-gray-500 text-center">
        {hovered.row + 1} x {hovered.col + 1}
      </div>
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${COLS}, 20px)` }}
      >
        {Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const active = r <= hovered.row && c <= hovered.col;
            return (
              <div
                key={`${r}-${c}`}
                className={`h-5 w-5 border rounded-sm cursor-pointer transition-colors ${
                  active ? 'bg-blue-500 border-blue-600' : 'bg-gray-100 border-gray-300'
                }`}
                onMouseEnter={() => setHovered({ row: r, col: c })}
                onClick={() => {
                  onSelect(r + 1, c + 1);
                  onClose();
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
