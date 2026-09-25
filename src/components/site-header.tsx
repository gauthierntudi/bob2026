"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={scrolled ? "site-header is-scrolled" : "site-header"}
      style={{
        backgroundColor: scrolled ? "rgba(160, 6, 6, 0.55)" : "transparent",
        backdropFilter: scrolled ? "blur(18px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(18px)" : "none",
        transition: "background-color 180ms ease, backdrop-filter 180ms ease",
      }}
    >
      <Link href="/" className="brand">
        <img src="/img/logo.png" alt="Vodacom Best of the Best 2026" />
      </Link>
      <img className="revolution" src="/img/revolution.png" alt="Révolution" />
    </header>
  );
}
