import React from "react";

// Pizza Max mark — tomato disc with a serif "P"
export default function Logo({ size = 40, className = "" }) {
  return (
    <span
      className={`inline-grid place-items-center rounded-full bg-primary text-primary-foreground font-display leading-none ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden="true"
    >
      P
    </span>
  );
}