"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleX, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "warning";
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-amber-500 text-white",
  };

  const icons = {
    success: CheckCircle2,
    error: CircleX,
    warning: AlertTriangle,
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all duration-300",
        typeStyles[type],
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 opacity-80 hover:opacity-100"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
