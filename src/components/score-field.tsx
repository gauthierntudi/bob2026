"use client";

import { useState, type CSSProperties } from "react";
import { CRITERION_MAX } from "@/lib/scoring";

export function ScoreField({
  name,
  label,
  defaultValue,
  disabled,
}: {
  name: string;
  label: string;
  weight: number;
  defaultValue: number;
  disabled: boolean;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <label className="score-field">
      <span>{label}</span>
      <strong>
        {value}
        <small>/{CRITERION_MAX}</small>
      </strong>
      <input
        type="range"
        name={name}
        min={0}
        max={CRITERION_MAX}
        step={1}
        value={value}
        disabled={disabled}
        aria-valuetext={`${value} sur ${CRITERION_MAX}`}
        style={{ "--fill": `${(value / CRITERION_MAX) * 100}%` } as CSSProperties}
        onChange={(event) => setValue(Number(event.target.value))}
      />
    </label>
  );
}
