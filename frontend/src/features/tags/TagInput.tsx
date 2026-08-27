import { useMemo, useState } from "react";
import type { Tag } from "@/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

export function TagInput({
  value,
  onChange,
  suggestions,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: Tag[];
}) {
  const [draft, setDraft] = useState("");
  const matches = useMemo(() => {
    const query = draft.trim().toLowerCase();
    if (!query) return [];
    return suggestions
      .filter((tag) => tag.name.includes(query) && !value.includes(tag.name))
      .slice(0, 6);
  }, [draft, suggestions, value]);

  function add(name: string) {
    const normalized = name.trim().toLowerCase();
    if (!normalized || value.includes(normalized)) return;
    onChange([...value, normalized]);
    setDraft("");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <button
            key={tag}
            type="button"
            className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-hover"
            onClick={() => onChange(value.filter((item) => item !== tag))}
          >
            {tag} ×
          </button>
        ))}
      </div>
      <Input
        className="mt-2"
        value={draft}
        placeholder="Add A Tag And Press Enter"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            add(draft);
          }
        }}
        aria-label="Add Tag"
      />
      {matches.length > 0 ? (
        <ul className="mt-1 overflow-hidden rounded-lg border border-line bg-paper-raised">
          {matches.map((tag) => (
            <li key={tag.id}>
              <button
                type="button"
                className={cn("block w-full px-3 py-2 text-left text-sm hover:bg-paper-sunken")}
                onClick={() => add(tag.name)}
              >
                {tag.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
