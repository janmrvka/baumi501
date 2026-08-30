"use client";

import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
export const QUICK_THROWS_LEFT = [26, 41, 45];
export const QUICK_THROWS_RIGHT = [60, 85, 100];

export function NumericKeypad({ onDigit, onBackspace, onConfirm, onQuickThrow, disabled }) {
  return (
    <div className="grid h-full grid-cols-5 gap-1.5">
      <QuickThrowColumn values={QUICK_THROWS_LEFT} onThrow={onQuickThrow} disabled={disabled} />

      <div className="col-span-3 grid grid-rows-4 gap-1.5">
        <div className="grid grid-cols-3 gap-1.5">
          {KEYS.slice(0, 3).map((key) => (
            <KeypadButton key={key} disabled={disabled} onClick={() => onDigit(key)}>
              {key}
            </KeypadButton>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {KEYS.slice(3, 6).map((key) => (
            <KeypadButton key={key} disabled={disabled} onClick={() => onDigit(key)}>
              {key}
            </KeypadButton>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {KEYS.slice(6, 9).map((key) => (
            <KeypadButton key={key} disabled={disabled} onClick={() => onDigit(key)}>
              {key}
            </KeypadButton>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <KeypadButton disabled={disabled} onClick={onBackspace} variant="muted">
            <Delete className="size-[45%]" strokeWidth={2.5} />
          </KeypadButton>
          <KeypadButton disabled={disabled} onClick={() => onDigit("0")}>
            0
          </KeypadButton>
          <KeypadButton disabled={disabled} onClick={onConfirm} variant="confirm">
            OK
          </KeypadButton>
        </div>
      </div>

      <QuickThrowColumn values={QUICK_THROWS_RIGHT} onThrow={onQuickThrow} disabled={disabled} />
    </div>
  );
}

function QuickThrowColumn({ values, onThrow, disabled }) {
  return (
    <div className="col-span-1 grid grid-rows-4 gap-1.5">
      {values.map((value) => (
        <KeypadButton
          key={value}
          disabled={disabled}
          onClick={() => onThrow(value)}
          variant="quick"
        >
          {value}
        </KeypadButton>
      ))}
      <div />
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
        "flex h-full w-full items-center justify-center rounded-xl font-bold tabular-nums transition-colors active:scale-95",
        "select-none touch-manipulation",
        variant === "quick" ? "text-[clamp(0.75rem,3.2vh,1.1rem)]" : "text-[clamp(1rem,4.2vh,1.75rem)]",
        variant === "default" &&
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === "muted" &&
          "bg-muted text-muted-foreground hover:bg-muted/80",
        variant === "confirm" &&
          "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "quick" &&
          "bg-info text-info-foreground hover:brightness-125",
        disabled && "pointer-events-none opacity-40"
      )}
    >
      {children}
    </button>
  );
}
