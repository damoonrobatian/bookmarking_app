import { useMemo, useState } from "react";
import type { Tag } from "@/types";
import { Button } from "@/components/ui/button";
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
  const [highlight, setHighlight] = useState(-1);
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
    setHighlight(-1);
  }

  function commit() {
    if (highlight >= 0 && matches[highlight]) {
      add(matches[highlight].name);
    } else {
      add(draft);
    }
  }

  return (
    <div className="relative">
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
      <div className="mt-2 flex gap-2">
        <Input
          className="min-w-0 flex-1"
          value={draft}
          placeholder="Add a tag"
          enterKeyHint="done"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={matches.length > 0}
          aria-autocomplete="list"
          aria-activedescendant={highlight >= 0 ? `tag-option-${highlight}` : undefined}
          onChange={(event) => {
            setDraft(event.target.value);
            setHighlight(-1);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "ArrowDown" && matches.length > 0) {
              event.preventDefault();
              setHighlight((current) => (current + 1) % matches.length);
              return;
            }
            if (event.key === "ArrowUp" && matches.length > 0) {
              event.preventDefault();
              setHighlight((current) => (current <= 0 ? matches.length - 1 : current - 1));
              return;
            }
            if (event.key === "Escape" && (draft || matches.length > 0)) {
              event.preventDefault();
              setDraft("");
              setHighlight(-1);
              return;
            }
            if (event.key === "," || event.key === "Enter") {
              event.preventDefault();
              commit();
            }
          }}
          aria-label="Add tag"
        />
        <Button type="button" variant="secondary" aria-label="Add this tag" disabled={!draft.trim()} onClick={commit}>
          Add
        </Button>
      </div>
      {matches.length > 0 ? (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-line bg-paper-raised shadow-sm"
        >
          {matches.map((tag, index) => (
            <li key={tag.id} role="presentation">
              <button
                type="button"
                id={`tag-option-${index}`}
                role="option"
                aria-selected={index === highlight}
                className={cn(
                  "block w-full px-3 py-2 text-left text-sm hover:bg-paper-sunken",
                  index === highlight && "bg-paper-sunken",
                )}
                onPointerDown={(event) => event.preventDefault()}
                onMouseEnter={() => setHighlight(index)}
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
