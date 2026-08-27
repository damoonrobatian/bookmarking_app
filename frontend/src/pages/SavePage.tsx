import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BookmarkFormDialog } from "@/features/bookmarks/BookmarkFormDialog";
import { useCurrentUser } from "@/hooks/useAuth";
import { createBookmark } from "@/services/bookmarks";

function closeOrGoToLibrary(navigate: ReturnType<typeof useNavigate>) {
  window.close();
  window.setTimeout(() => navigate("/app"), 200);
}

export function SavePage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const url = params.get("url") ?? "";
  const title = params.get("title") ?? "";
  const next = `/save?${params.toString()}`;
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  useEffect(() => {
    if (!user.isLoading && !user.data) {
      navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true });
    }
  }, [user.isLoading, user.data, navigate, next]);

  if (user.isLoading || !user.data) {
    return <div className="p-8 text-ink-muted">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-paper px-5 py-6">
      <Link to="/app" className="font-serif text-2xl">
        Neshanak
      </Link>
      <h1 className="mt-6 font-serif text-3xl">Save Bookmark</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">The Page Address Was Filled In From Your Browser. Title And Tags Are Suggested When Possible.</p>
      <BookmarkFormDialog
        open
        variant="page"
        title="Save Bookmark"
        initialUrl={url}
        initialTitle={title}
        onOpenChange={(open) => {
          if (!open) closeOrGoToLibrary(navigate);
        }}
        onSubmit={async (payload) => {
          await mutation.mutateAsync(payload);
        }}
      />
    </div>
  );
}
