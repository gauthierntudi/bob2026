"use client";

import { logoutJuror } from "@/app/actions";

export function JuryLogout() {
  return (
    <button className="ghost" type="button" onClick={() => logoutJuror()}>
      Quitter
    </button>
  );
}
