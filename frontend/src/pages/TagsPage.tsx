import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listFolders } from "@/services/folders";
import { listTagsGrouped } from "@/services/tags";
import type { Folder, FolderTagGroup } from "@/types";
import { cn } from "@/utils/cn";

const UNFILED = "unfiled";

type FolderChoice = { id: string; name: string; folderId: string | null };

function choicesFrom(folders: Folder[]): FolderChoice[] {
  return [
    ...folders.map((folder) => ({ id: folder.id, name: folder.name, folderId: folder.id })),
    { id: UNFILED, name: "No Folder", folderId: null },
  ];
}

export function TagsPage() {
  const folders = useQuery({ queryKey: ["folders"], queryFn: listFolders });
  const grouped = useQuery({ queryKey: ["tags", "grouped"], queryFn: listTagsGrouped });
  const [selected, setSelected] = useState<string[]>([]);
  const options = useMemo(() => choicesFrom(folders.data ?? []), [folders.data]);
  const groupsByFolder = useMemo(() => {
    const map = new Map<string, FolderTagGroup>();
    for (const group of grouped.data ?? []) {
      map.set(group.folder_id ?? UNFILED, group);
    }
    return map;
  }, [grouped.data]);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  const openSets = options.filter((option) => selected.includes(option.id));

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <h1 className="font-serif text-3xl">Tags</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Choose One Or More Folders. Each Selected Folder Shows Only The Tags Used On Bookmarks Inside It.
        </p>
      </header>
      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="rounded-2xl border border-line bg-paper-raised p-4">
          <p className="text-xs font-semibold tracking-wide text-ink-faint">Folders</p>
          <ul className="mt-3 space-y-2">
            {options.map((option) => (
              <li key={option.id}>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(option.id)}
                    onChange={() => toggle(option.id)}
                  />
                  <span className="truncate">{option.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </aside>
        <div className="space-y-6">
          {openSets.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-sm text-ink-muted">
              Select A Folder On The Left To Open Its Tags.
            </p>
          ) : (
            openSets.map((option) => {
              const tags = groupsByFolder.get(option.id)?.tags ?? [];
              return (
                <section key={option.id} className="rounded-2xl border border-line bg-paper-raised p-5">
                  <h2 className="font-medium">{option.name}</h2>
                  {tags.length === 0 ? (
                    <p className="mt-3 text-sm text-ink-muted">No Tags In This Folder.</p>
                  ) : (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <li key={tag.id}>
                          <Link
                            to={
                              option.folderId
                                ? `/app/folder/${option.folderId}?tag=${encodeURIComponent(tag.name)}`
                                : `/app?tag=${encodeURIComponent(tag.name)}`
                            }
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent-hover hover:bg-accent/20",
                            )}
                          >
                            {tag.name}
                            <span className="text-xs text-ink-muted">{tag.bookmark_count}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
