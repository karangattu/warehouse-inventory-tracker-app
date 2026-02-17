"use client";

import { cn } from "@/lib/utils";

interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  error?: string;
}

export function PinPad({
  value,
  onChange,
  maxLength = 4,
  error,
}: PinPadProps) {
  const handlePress = (digit: string) => {
    if (value.length >= maxLength) return;
    onChange(value + digit);
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* PIN dots */}
      <div className="flex justify-center gap-3 mb-6">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-4 h-4 rounded-full border-2 transition-all",
              i < value.length
                ? "bg-blue-600 border-blue-600 scale-110"
                : "bg-white border-gray-300"
            )}
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-red-600 mb-4">{error}</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handlePress(digit)}
            className="h-16 rounded-xl bg-white border-2 border-gray-200 text-2xl font-semibold text-gray-900 hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          className="h-16 rounded-xl bg-gray-100 text-sm font-medium text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => handlePress("0")}
          className="h-16 rounded-xl bg-white border-2 border-gray-200 text-2xl font-semibold text-gray-900 hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="h-16 rounded-xl bg-gray-200 text-xl text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
