import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChangePasswordForm } from "@/features/auth/ChangePasswordForm";
import { DeleteAccountForm } from "@/features/auth/DeleteAccountForm";
import { useCurrentUser } from "@/hooks/useAuth";
import { exportBookmarks, importBookmarks } from "@/services/tags";
import type { ImportReport } from "@/types";
import {
  bookmarkletIconDataUri,
  bookmarkletNetscapeHtml,
  downloadBookmarkletHtml,
  saveBookmarkletHref,
} from "@/utils/bookmarklet";
import { cn } from "@/utils/cn";

type SettingsSection = {
  id: string;
  title: string;
  description: string;
  danger?: boolean;
};

const SECTIONS: SettingsSection[] = [
  { id: "account", title: "Account", description: "Name and email for this account." },
  { id: "password", title: "Change Password", description: "Choose a new password for this account." },
  { id: "import", title: "Import Bookmarks", description: "Upload a Netscape bookmark HTML file." },
  { id: "export", title: "Export Bookmarks", description: "Download a browser-compatible HTML file." },
  { id: "save-from-browser", title: "Save From The Browser", description: "Add a button to save the page you are looking at." },
  { id: "delete-account", title: "Delete Account", description: "Permanently remove this account and its library.", danger: true },
];

export function SettingsPage() {
  const { section } = useParams();
  const current = SECTIONS.find((item) => item.id === section);
  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <h1 className="font-serif text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {current ? current.title : "Choose one setting at a time."}
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
        All settings
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
    onError: () => setError("Invalid bookmark file."),
  });
  return (
    <>
      <p className="text-sm text-ink-muted">
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
      <p className="text-sm text-ink-muted">Download a browser-compatible HTML file that preserves your folder hierarchy.</p>
      <Button className="mt-4" variant="secondary" onClick={() => exportMutation.mutate()}>
        Export HTML
      </Button>
    </>
  );
}

function SaveFromBrowserBody() {
  const href = saveBookmarkletHref();
  const [browser, setBrowser] = useState<"chrome" | "firefox">("chrome");
  const [downloadError, setDownloadError] = useState("");

  async function downloadBarButton() {
    setDownloadError("");
    try {
      const icon = await bookmarkletIconDataUri();
      downloadBookmarkletHtml(bookmarkletNetscapeHtml(href, icon));
    } catch {
      setDownloadError("Could not download the bar button. Try again.");
    }
  }

  return (
    <div className="space-y-6">
      <Method
        step={1}
        title="Drag To The Bookmarks Bar"
        note="Easiest. Works without the Neshanak icon. After you drop it, the bar shows the words Save To Neshanak, not the terracotta mark."
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-muted">
          <li>Show the bookmarks bar if it is hidden: Ctrl+Shift+B (Mac: Command+Shift+B).</li>
          <li>Drag the control below onto the bar.</li>
          <li>Open a page you want to keep and click Save To Neshanak.</li>
        </ol>
        <a
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-white hover:bg-accent-hover"
          href={href}
          onClick={(event) => event.preventDefault()}
        >
          Save To Neshanak
        </a>
      </Method>

      <fieldset className="min-w-0 border-0 p-0">
        <legend className="text-sm font-medium">Which browser are you using?</legend>
        <p className="mt-1 text-sm text-ink-muted">The next two methods show steps for that browser only.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={browser === "chrome" ? "primary" : "secondary"}
            aria-pressed={browser === "chrome"}
            onClick={() => setBrowser("chrome")}
          >
            Chrome or Edge
          </Button>
          <Button
            type="button"
            variant={browser === "firefox" ? "primary" : "secondary"}
            aria-pressed={browser === "firefox"}
            onClick={() => setBrowser("firefox")}
          >
            Firefox
          </Button>
        </div>
      </fieldset>

      <Method
        step={2}
        title="Button Next To The Address Bar"
        note="A Neshanak button beside the address bar, not on the bookmarks bar. Load the unpacked extension from this repository."
      >
        {browser === "chrome" ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-muted">
            <li>
              Open <code className="text-ink">chrome://extensions</code> (Edge:{" "}
              <code className="text-ink">edge://extensions</code>).
            </li>
            <li>Turn on Developer mode.</li>
            <li>
              Click Load unpacked and select the <code className="text-ink">extension</code> folder from this
              repository.
            </li>
          </ol>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-muted">
            <li>
              Open <code className="text-ink">about:debugging</code>.
            </li>
            <li>Click This Firefox, then Load Temporary Add-on.</li>
            <li>
              Select <code className="text-ink">extension/manifest.json</code> from this repository. Firefox
              removes a temporary add-on when the browser restarts; load it again after a restart.
            </li>
          </ol>
        )}
      </Method>

      <Method
        step={3}
        title="Bookmarks Bar Button With Icon"
        note="Hardest. Import a bookmark file so the bar button can show the Neshanak icon. Dragging from method 1 will not add the icon."
      >
        {browser === "chrome" ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-muted">
            <li>Show the bookmarks bar if it is hidden: Ctrl+Shift+B (Mac: Command+Shift+B).</li>
            <li>Download bar button.</li>
            <li>
              Click the three dots at the top right of the whole browser window, next to your profile. Not the
              dots inside Ctrl+Shift+O. Then Bookmarks and lists → Import bookmarks and settings.
            </li>
            <li>
              If it asks what to import from, choose Bookmarks HTML file. Open Save To Neshanak.html from
              Downloads.
            </li>
            <li>Look in Other Bookmarks (a folder at the end of the bar). Drag Save To Neshanak onto the bar.</li>
          </ol>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-muted">
            <li>Show the bookmarks toolbar if it is hidden: Ctrl+Shift+B (Mac: Command+Shift+B).</li>
            <li>
              Delete any blank Save To Neshanak already on the toolbar or in the Bookmarks Menu, then download
              bar button.
            </li>
            <li>
              Click the three lines at the top right → Bookmarks → Manage Bookmarks. Or press Ctrl+Shift+O (Mac:
              Command+Shift+O). Do not use Settings → Import data; that path skips the logo.
            </li>
            <li>
              In that window, click Import and Backup → Import Bookmarks from HTML. Open Save To Neshanak.html
              from Downloads.
            </li>
            <li>
              Open Bookmarks → Bookmarks Menu. Drag Save To Neshanak onto the Bookmarks Toolbar. Restart Firefox
              if the mark still does not appear.
            </li>
          </ol>
        )}
        <Button className="mt-4" type="button" onClick={() => void downloadBarButton()}>
          Download bar button
        </Button>
        {downloadError ? <p className="mt-2 text-sm text-red-800">{downloadError}</p> : null}
      </Method>
    </div>
  );
}

function Method({
  step,
  title,
  note,
  children,
}: {
  step: number;
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-paper px-4 py-4">
      <h3 className="font-medium">
        {step}. {title}
      </h3>
      <p className="mt-1 text-sm text-ink-muted">{note}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}
