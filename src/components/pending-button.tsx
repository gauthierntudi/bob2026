"use client";

import { useFormStatus } from "react-dom";

export function PendingButton({
  idle,
  busy,
  disabled,
}: {
  idle: string;
  busy: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button className="action" type="submit" disabled={Boolean(disabled) || pending} aria-busy={pending}>
      {pending ? <span className="loader" aria-hidden="true" /> : null}
      {pending ? busy : idle}
    </button>
  );
}
