import { useCurrentUser } from "@/hooks/useAuth";
import { exportBookmarks, importBookmarks } from "@/services/tags";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ImportReport } from "@/types";

export function SettingsPage() {
  const user = useCurrentUser();
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const importMutation = useMutation({
    mutationFn: importBookmarks,
    onSuccess: setReport,
    onError: () => setError("Invalid bookmark file."),
  });
  const exportMutation = useMutation({
    mutationFn: async () => {
      const blob = await exportBookmarks();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "bookmarks.html";
      link.click();
      URL.revokeObjectURL(url);
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="font-serif text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Account details and library portability.</p>
      </header>
      <section className="rounded-2xl border border-line bg-paper-raised p-6">
        <h2 className="font-medium">Account</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Name</dt>
            <dd>{user.data?.display_name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Email</dt>
            <dd>{user.data?.email}</dd>
          </div>
        </dl>
      </section>
      <section className="rounded-2xl border border-line bg-paper-raised p-6">
        <h2 className="font-medium">Import bookmarks</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Upload a Netscape bookmark HTML file exported from Chrome, Firefox, or Edge.
        </p>
        <Label htmlFor="import-file" className="mt-4 block">
          Bookmark file
        </Label>
        <input
          id="import-file"
          className="mt-2 block w-full text-sm"
          type="file"
          accept=".html,.htm,text/html"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setError(null);
            setReport(null);
            if (file) importMutation.mutate(file);
          }}
        />
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        {report ? (
          <ul className="mt-4 space-y-1 text-sm text-ink-muted">
            <li>Bookmarks imported: {report.bookmarks_imported}</li>
            <li>Folders created: {report.folders_created}</li>
            <li>Duplicates detected: {report.duplicates_detected}</li>
            <li>Invalid entries skipped: {report.invalid_entries_skipped}</li>
          </ul>
        ) : null}
      </section>
      <section className="rounded-2xl border border-line bg-paper-raised p-6">
        <h2 className="font-medium">Export bookmarks</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Download a browser-compatible HTML file that preserves your folder hierarchy.
        </p>
        <Button className="mt-4" variant="secondary" onClick={() => exportMutation.mutate()}>
          Export HTML
        </Button>
      </section>
    </div>
  );
}
