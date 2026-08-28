import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/useTheme";
import { ChangePasswordForm } from "@/features/auth/ChangePasswordForm";
import { DeleteAccountForm } from "@/features/auth/DeleteAccountForm";
import { useCurrentUser, useUpdateTheme } from "@/hooks/useAuth";
import { exportBookmarks, importBookmarks } from "@/services/tags";
import { THEMES, type ThemeId } from "@/theme";
import type { ImportReport } from "@/types";
import {
  BOOKMARKLET_TITLE,
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
  { id: "theme", title: "Theme", description: "Color and logo for this account." },
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
  if (id === "theme") return <ThemeBody />;
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

function ThemeBody() {
  const { theme, setTheme } = useTheme();
  const updateTheme = useUpdateTheme();
  const [error, setError] = useState("");

  function choose(id: ThemeId) {
    const previous = theme;
    setError("");
    setTheme(id);
    updateTheme.mutate(id, {
      onError: () => {
        setTheme(previous);
        setError("Could not save the theme. Try again.");
      },
    });
  }

  return (
    <>
      <p className="text-sm text-ink-muted">
        Choose a color for buttons and the Neshanak mark. The tab icon and the browser extension stay terracotta.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {THEMES.map((item) => {
          const selected = theme === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => choose(item.id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm hover:bg-paper-sunken",
                selected ? "border-accent ring-2 ring-accent/40" : "border-line",
              )}
            >
              <img src={item.logo} alt="" width={56} height={56} className="h-14 w-14" />
              {item.label}
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}
    </>
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
  const [addressBarBrowser, setAddressBarBrowser] = useState<"chrome" | "firefox">("chrome");
  const [iconBarBrowser, setIconBarBrowser] = useState<"chrome" | "firefox">("chrome");
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
      <p className="text-sm text-ink-muted">
        There are three ways to add a save button on a computer. The first way is the easiest: you drag a
        button onto the bookmarks bar. On an Android phone, there is a fourth way: share the page to Neshanak.
      </p>

      <Method
        step={1}
        title="Drag To The Bookmarks Bar"
        note="This adds a +Neshanak button to your bookmarks bar, the strip under the address bar. It works in Google Chrome and Mozilla Firefox."
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-muted">
          <li>
            If you cannot see the bookmarks bar, press Ctrl+Shift+B (on a Mac, Command+Shift+B).
          </li>
          <li>Drag the orange button onto the bookmarks bar.</li>
          <li>Open a page you want to save, then click +Neshanak on the bar.</li>
        </ol>
        <a
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-accent px-3.5 font-medium text-white [font-size:0] after:text-sm after:leading-5 after:content-[attr(data-drag-label)] hover:bg-accent-hover"
          data-drag-label="Drag me to the bookmarks bar"
          href={href}
          onClick={(event) => event.preventDefault()}
        >
          {BOOKMARKLET_TITLE}
        </a>
      </Method>

      <Method
        step={2}
        title="Button Next To The Address Bar"
        note="This adds a Neshanak button next to the address bar, beside where you type a website address. Choose your browser, then follow the steps."
      >
        <BrowserChoice value={addressBarBrowser} onChange={setAddressBarBrowser} />
        {addressBarBrowser === "chrome" ? (
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-muted">
            <li>
              Open <code className="text-ink">chrome://extensions</code> (Edge:{" "}
              <code className="text-ink">edge://extensions</code>).
            </li>
            <li>Turn on Developer mode.</li>
            <li>
              Click Load unpacked and select the <code className="text-ink">extension</code> folder from this
              project.
            </li>
          </ol>
        ) : (
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-muted">
            <li>
              Open <code className="text-ink">about:debugging</code>.
            </li>
            <li>Click This Firefox, then Load Temporary Add-on.</li>
            <li>
              Select <code className="text-ink">extension/manifest.json</code> from this project. Firefox
              removes this button when the browser restarts; add it again after a restart.
            </li>
          </ol>
        )}
      </Method>

      <Method
        step={3}
        title="Bookmarks Bar Button With Icon"
        note="This adds a +Neshanak button to the bookmarks bar with the Neshanak picture on it. Choose your browser, then follow the steps. You download a file and import it as bookmarks."
      >
        <BrowserChoice value={iconBarBrowser} onChange={setIconBarBrowser} />
        {iconBarBrowser === "chrome" ? (
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-muted">
            <li>If you cannot see the bookmarks bar, press Ctrl+Shift+B (on a Mac, Command+Shift+B).</li>
            <li>Download bar button.</li>
            <li>
              Click the three dots at the top right of the whole browser window, next to your profile. Not the
              dots inside Ctrl+Shift+O. Then Bookmarks and lists → Import bookmarks and settings.
            </li>
            <li>
              If it asks what to import from, choose Bookmarks HTML file. Open Save To Neshanak.html from
              Downloads.
            </li>
            <li>Look in Other Bookmarks (a folder at the end of the bar). Drag +Neshanak onto the bar.</li>
          </ol>
        ) : (
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-muted">
            <li>If you cannot see the bookmarks toolbar, press Ctrl+Shift+B (on a Mac, Command+Shift+B).</li>
            <li>
              Delete any blank +Neshanak already on the toolbar or in the Bookmarks Menu, then download bar
              button.
            </li>
            <li>
              Click the three lines at the top right → Bookmarks → Manage Bookmarks. Or press Ctrl+Shift+O (on a
              Mac, Command+Shift+O). Do not use Settings → Import data; that path skips the picture.
            </li>
            <li>
              In that window, click Import and Backup → Import Bookmarks from HTML. Open Save To Neshanak.html
              from Downloads.
            </li>
            <li>
              Open Bookmarks → Bookmarks Menu. Drag +Neshanak onto the Bookmarks Toolbar. Restart Firefox if the
              picture still does not appear.
            </li>
          </ol>
        )}
        <Button className="mt-4" type="button" onClick={() => void downloadBarButton()}>
          Download bar button
        </Button>
        {downloadError ? <p className="mt-2 text-sm text-red-800">{downloadError}</p> : null}
      </Method>

      <Method
        step={4}
        title="Share From Chrome On Android"
        note="This puts Neshanak in the Android share list. It works in Google Chrome on Android after you add Neshanak to your home screen. It does not work on iPhone."
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-muted">
          <li>On the phone, open https://neshanak.ca in Chrome and sign in.</li>
          <li>Tap the three dots at the top right, then Add to Home screen or Install app.</li>
          <li>Open a page you want to save, tap Share, then Neshanak.</li>
          <li>Check the title and tags, then save.</li>
        </ol>
      </Method>
    </div>
  );
}

function BrowserChoice({
  value,
  onChange,
}: {
  value: "chrome" | "firefox";
  onChange: (next: "chrome" | "firefox") => void;
}) {
  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="text-sm font-medium">Which browser are you using?</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          type="button"
          variant={value === "chrome" ? "primary" : "secondary"}
          aria-pressed={value === "chrome"}
          onClick={() => onChange("chrome")}
        >
          Chrome or Edge
        </Button>
        <Button
          type="button"
          variant={value === "firefox" ? "primary" : "secondary"}
          aria-pressed={value === "firefox"}
          onClick={() => onChange("firefox")}
        >
          Firefox
        </Button>
      </div>
    </fieldset>
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
