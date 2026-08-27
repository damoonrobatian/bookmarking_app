import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink px-12 py-10 text-paper lg:flex">
        <Link to="/" className="font-serif text-3xl">
          Neshanak
        </Link>
        <div>
          <p className="max-w-sm font-serif text-4xl leading-tight">A quiet place for the pages you want to keep.</p>
          <p className="mt-4 max-w-sm text-sm text-paper/70">
            Save, organize, and find bookmarks without the clutter of a social network.
          </p>
        </div>
        <p className="text-xs text-paper/50">Personal bookmark library</p>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 block font-serif text-3xl lg:hidden">
            Neshanak
          </Link>
          <h1 className="font-serif text-3xl">{title}</h1>
          <p className="mt-2 mb-6 text-sm text-ink-muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
