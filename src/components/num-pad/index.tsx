"use client";

import { cn } from "@/lib/utils";

interface NumPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  allowDecimal?: boolean;
  className?: string;
}

export function NumPad({
  value,
  onChange,
  maxLength = 6,
  allowDecimal = true,
  className,
}: NumPadProps) {
  const handlePress = (digit: string) => {
    if (digit === "." && !allowDecimal) return;
    if (digit === "." && value.includes(".")) return;
    if (value.length >= maxLength && digit !== "backspace") return;

    if (digit === "backspace") {
      onChange(value.slice(0, -1));
    } else {
      onChange(value + digit);
    }
  };

  const handleClear = () => {
    onChange("");
  };

  const buttons = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9",
    allowDecimal ? "." : "",
    "0",
    "backspace",
  ];

  return (
    <div className={cn("w-full max-w-xs mx-auto", className)}>
      {/* Display */}
      <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4 mb-4 text-center">
        <span className="text-4xl font-bold text-gray-900 tabular-nums">
          {value || "0"}
        </span>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {buttons.map((btn, i) => {
          if (btn === "") {
            return <div key={i} />;
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => handlePress(btn)}
              className={cn(
                "h-16 rounded-xl text-xl font-semibold transition-all active:scale-95",
                btn === "backspace"
                  ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  : "bg-white border-2 border-gray-200 text-gray-900 hover:bg-gray-50 active:bg-gray-100"
              )}
            >
              {btn === "backspace" ? "⌫" : btn}
            </button>
          );
        })}
      </div>

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      )}
    </div>
  );
}
