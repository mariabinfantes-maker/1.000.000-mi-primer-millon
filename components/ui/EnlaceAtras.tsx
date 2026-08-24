import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export default function EnlaceAtras({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition hover:text-brand-800"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {children}
    </Link>
  );
}
