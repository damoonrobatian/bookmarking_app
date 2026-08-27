import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChangePasswordForm } from "@/features/auth/ChangePasswordForm";
import { DeleteAccountForm } from "@/features/auth/DeleteAccountForm";
import { useCurrentUser } from "@/hooks/useAuth";
import { exportBookmarks, importBookmarks } from "@/services/tags";
import type { ImportReport } from "@/types";
import { saveBookmarkletHref, setBookmarkletDragImage } from "@/utils/bookmarklet";
import { cn } from "@/utils/cn";

type SettingsSection = {
  id: string;
  title: string;
  description: string;
  danger?: boolean;
};

const SECTIONS: SettingsSection[] = [
  { id: "account", title: "Account", description: "Name And Email For This Account." },
  { id: "password", title: "Change Password", description: "Choose A New Password For This Account." },
  { id: "import", title: "Import Bookmarks", description: "Upload A Netscape Bookmark HTML File." },
  { id: "export", title: "Export Bookmarks", description: "Download A Browser-Compatible HTML File." },
  { id: "save-from-browser", title: "Save From The Browser", description: "Add A Button To Save The Page You Are Looking At." },
  { id: "delete-account", title: "Delete Account", description: "Permanently Remove This Account And Its Library.", danger: true },
];

export function SettingsPage() {
  const { section } = useParams();
  const current = SECTIONS.find((item) => item.id === section);
  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <h1 className="font-serif text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {current ? current.title : "Choose One Setting At A Time."}
        </p>
      </header>
      {current ? <SettingsDetail section={current} /> : <SettingsMenu />}
    </div>
  );
}

function SettingsMenu() {
  return (
    <ul className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper-raised">
      {SECTIONS.map((item) => (
        <li key={item.id}>
          <Link
            to={`/settings/${item.id}`}
            className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-paper-sunken"
          >
            <span>
              <span className={cn("block font-medium", item.danger && "text-red-800")}>{item.title}</span>
              <span className="mt-0.5 block text-sm text-ink-muted">{item.description}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SettingsDetail({
  section,
}: {
  section: SettingsSection;
}) {
  return (
    <div className="mt-8">
      <Link to="/settings" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
        <ChevronLeft className="h-4 w-4" />
        All Settings
      </Link>
      <section
        className={cn(
          "mt-4 rounded-2xl border bg-paper-raised p-6",
          section.danger ? "border-red-200" : "border-line",
        )}
      >
        <h2 className={cn("font-medium", section.danger && "text-red-800")}>{section.title}</h2>
        <p className="mt-1 text-sm text-ink-muted">{section.description}</p>
        <div className="mt-4">
          <SettingsBody id={section.id} />
        </div>
      </section>
    </div>
  );
}

function SettingsBody({ id }: { id: string }) {
  if (id === "account") return <AccountBody />;
  if (id === "password") return <ChangePasswordForm />;
  if (id === "import") return <ImportBody />;
  if (id === "export") return <ExportBody />;
  if (id === "save-from-browser") return <SaveFromBrowserBody />;
  return <DeleteAccountForm />;
}

function AccountBody() {
  const user = useCurrentUser();
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-ink-muted">Name</dt>
        <dd>{user.data?.display_name}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-ink-muted">Email</dt>
        <dd>{user.data?.email}</dd>
      </div>
    </dl>
  );
}

function ImportBody() {
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const importMutation = useMutation({
    mutationFn: importBookmarks,
    onSuccess: setReport,
    onError: () => setError("Invalid Bookmark File."),
  });
  return (
    <>
      <p className="text-sm text-ink-muted">
        Upload A Netscape Bookmark HTML File Exported From Chrome, Firefox, Or Edge.
      </p>
      <Label htmlFor="import-file" className="mt-4 block">
        Bookmark File
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
          <li>Bookmarks Imported: {report.bookmarks_imported}</li>
          <li>Folders Created: {report.folders_created}</li>
          <li>Duplicates Detected: {report.duplicates_detected}</li>
          <li>Invalid Entries Skipped: {report.invalid_entries_skipped}</li>
        </ul>
      ) : null}
    </>
  );
}

function ExportBody() {
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
    <>
      <p className="text-sm text-ink-muted">Download A Browser-Compatible HTML File That Preserves Your Folder Hierarchy.</p>
      <Button className="mt-4" variant="secondary" onClick={() => exportMutation.mutate()}>
        Export HTML
      </Button>
    </>
  );
}

function SaveFromBrowserBody() {
  return (
    <>
      <p className="text-sm text-ink-muted">
        Add A Button To Your Browser Bookmarks Bar, Then Click It On Any Page You Want To Keep. A Popup Opens With The Address Filled In.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ink-muted">
        <li>
          Show The Bookmarks Bar If It Is Hidden. Chrome, Edge, And Firefox: Ctrl+Shift+B (Mac: Command+Shift+B). Or Right-Click Below The Address Bar And Enable Bookmarks Bar / Bookmarks Toolbar.
        </li>
        <li>
          Drag The Button Below Onto That Bar. The Logo Travels With It. Clicking It On This Settings Page Does Nothing — It Only Works After It Lives On The Bar. If A Blank Icon Is Already On The Bar, Remove It And Drag This Button Again.
        </li>
        <li>Open The Page You Want To Save, Then Click Save To Neshanak On The Bar.</li>
      </ol>
      <a
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-white hover:bg-accent-hover"
        href={saveBookmarkletHref()}
        onClick={(event) => event.preventDefault()}
        onDragStart={setBookmarkletDragImage}
      >
        <img
          data-bookmarklet-mark
          src="/favicon-32.png"
          alt=""
          width={32}
          height={32}
          className="h-5 w-5 rounded-sm"
          draggable={false}
        />
        Save To Neshanak
      </a>
      <p className="mt-4 text-sm text-ink-muted">
        For A Button Next To The Address Bar Instead Of On The Bookmarks Bar, Load The Unpacked Folder{" "}
        <code className="text-ink">extension/</code> From This Repository. Chrome: chrome://extensions → Developer Mode → Load Unpacked → Select The{" "}
        <code className="text-ink">extension</code> Folder. Firefox: about:debugging → This Firefox → Load Temporary Add-On → Select{" "}
        <code className="text-ink">extension/manifest.json</code>.
      </p>
    </>
  );
}
