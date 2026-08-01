"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";

const email = "jadejakrishna42@gmail.com";

export function CopyEmail() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <button type="button" className="copy-email" onClick={copy} aria-label={`Copy ${email} to clipboard`}>
      <span>{copied ? "Copied" : "Copy email"}</span>
      {copied ? <CheckIcon /> : <span aria-hidden="true">＋</span>}
      <span className="sr-only" aria-live="polite">{copied ? `${email} copied to clipboard` : ""}</span>
    </button>
  );
}
