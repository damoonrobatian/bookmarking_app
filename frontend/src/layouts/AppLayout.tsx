import { Archive, Bookmark as BookmarkIcon, Clock, Menu, Plus, Search, Settings, Star, Tag, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddBookmarkDialog } from "@/features/bookmarks/BookmarkFormDialog";
import { FolderTree } from "@/features/folders/FolderTree";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";

export function AppLayout() {
  const user = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (!user.isLoading && !user.data) navigate("/login");
  }, [user.isLoading, user.data, navigate]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isDesktop) setSidebarOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    const current = new URLSearchParams(window.location.search).get("q") ?? "";
    if (debouncedSearch === current) return;
    const next = new URLSearchParams(window.location.search);
    if (debouncedSearch) next.set("q", debouncedSearch);
    else next.delete("q");
    next.delete("page");
    navigate({ pathname: window.location.pathname, search: next.toString() }, { replace: true });
  }, [debouncedSearch, navigate]);

  if (user.isLoading || !user.data) {
    return <div className="p-8 text-ink-muted">Loading your library…</div>;
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {sidebarOpen && !isDesktop ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-ink/30"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <aside
        className={cn(
          "z-30 flex h-full flex-col border-r border-line bg-paper-raised p-4",
          isDesktop ? "sticky top-0 h-screen" : "fixed inset-y-0 left-0 w-72 max-w-[85vw] transition-transform",
          !isDesktop && !sidebarOpen && "-translate-x-full",
        )}
        onClick={(event) => {
          if (isDesktop || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          if (!(event.target instanceof Element)) return;
          if (event.target.closest("a")) setSidebarOpen(false);
        }}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link to="/app" className="text-ink">
            <BrandMark size="sm" />
          </Link>
          {!isDesktop ? (
            <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
        <nav className="space-y-1">
          <SideLink to="/app" icon={<BookmarkIcon className="h-4 w-4" />} end>
            All Bookmarks
          </SideLink>
          <SideLink to="/app/favorites" icon={<Star className="h-4 w-4" />}>
            Favorites
          </SideLink>
          <SideLink to="/app/recent" icon={<Clock className="h-4 w-4" />}>
            Recent
          </SideLink>
          <SideLink to="/app/archive" icon={<Archive className="h-4 w-4" />}>
            Archive
          </SideLink>
          <SideLink to="/app/tags" icon={<Tag className="h-4 w-4" />}>
            Tags
          </SideLink>
          <SideLink to="/settings" icon={<Settings className="h-4 w-4" />}>
            Settings
          </SideLink>
        </nav>
        <div className="mt-6 flex-1 overflow-y-auto">
          <FolderTree />
        </div>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur">
          {!isDesktop ? (
            <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          ) : null}
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input
              className="pl-9"
              placeholder="Search titles, URLs, notes, and tags"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search bookmarks"
            />
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add bookmark
          </Button>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="max-w-[10rem] truncate text-sm text-ink-muted">{user.data.display_name}</span>
            <Button variant="ghost" size="sm" onClick={() => logout.mutate()}>
              Log out
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-8">
          <Outlet />
        </main>
      </div>
      <AddBookmarkDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function SideLink({
  to,
  icon,
  children,
  end,
}: {
  to: string;
  icon: ReactNode;
  children: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-lg px-2 py-2 text-sm",
          isActive ? "bg-accent-soft font-medium text-accent-hover" : "text-ink-muted hover:bg-paper-sunken",
        )
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}
