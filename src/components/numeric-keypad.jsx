"use client";

import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function NumericKeypad({ onDigit, onBackspace, onConfirm, disabled }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {KEYS.map((key) => (
        <KeypadButton key={key} disabled={disabled} onClick={() => onDigit(key)}>
          {key}
        </KeypadButton>
      ))}
      <KeypadButton disabled={disabled} onClick={onBackspace} variant="muted">
        <Delete className="size-7" strokeWidth={2.5} />
      </KeypadButton>
      <KeypadButton disabled={disabled} onClick={() => onDigit("0")}>
        0
      </KeypadButton>
      <KeypadButton disabled={disabled} onClick={onConfirm} variant="confirm">
        OK
      </KeypadButton>
    </div>
  );
}

function KeypadButton({ children, onClick, disabled, variant = "default" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-20 items-center justify-center rounded-2xl text-3xl font-bold tabular-nums transition-colors active:scale-95",
        "select-none touch-manipulation",
        variant === "default" &&
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === "muted" &&
          "bg-muted text-muted-foreground hover:bg-muted/80",
        variant === "confirm" &&
          "bg-primary text-primary-foreground hover:bg-primary/90",
        disabled && "pointer-events-none opacity-40"
      )}
    >
      {children}
    </button>
  );
}
