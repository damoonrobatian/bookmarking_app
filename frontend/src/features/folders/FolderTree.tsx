import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, FolderPlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { createFolder, deleteFolder, listFolders, moveFolder, updateFolder } from "@/services/folders";
import type { Folder } from "@/types";
import { cn } from "@/utils/cn";

type TreeNode = Folder & { children: TreeNode[] };

function buildTree(folders: Folder[]): TreeNode[] {
  const nodes = new Map<string, TreeNode>(
    folders.map((folder) => [folder.id, { ...folder, children: [] }]),
  );
  const roots: TreeNode[] = [];
  nodes.forEach((node) => {
    if (node.parent_id && nodes.has(node.parent_id)) {
      nodes.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortNodes = (items: TreeNode[]) => {
    items.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
    items.forEach((item) => sortNodes(item.children));
  };
  sortNodes(roots);
  return roots;
}

export function FolderTree() {
  const queryClient = useQueryClient();
  const folders = useQuery({ queryKey: ["folders"], queryFn: listFolders });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState<{ parentId: string | null } | null>(null);
  const [renaming, setRenaming] = useState<Folder | null>(null);
  const [moving, setMoving] = useState<Folder | null>(null);
  const [deleting, setDeleting] = useState<Folder | null>(null);
  const tree = useMemo(() => buildTree(folders.data ?? []), [folders.data]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-2">
        <p className="text-xs font-semibold tracking-wide text-ink-faint">Folders</p>
        <button
          type="button"
          className="rounded-md p-1 text-ink-faint hover:bg-paper-sunken hover:text-ink"
          aria-label="Create Folder"
          onClick={() => setCreating({ parentId: null })}
        >
          <FolderPlus className="h-4 w-4" />
        </button>
      </div>
      {tree.length === 0 ? (
        <p className="px-2 text-xs text-ink-faint">No Folders Yet.</p>
      ) : (
        <ul>{tree.map((node) => (
          <FolderNode
            key={node.id}
            node={node}
            depth={0}
            expanded={expanded}
            setExpanded={setExpanded}
            onCreate={(parentId) => setCreating({ parentId })}
            onRename={setRenaming}
            onMove={setMoving}
            onDelete={setDeleting}
          />
        ))}</ul>
      )}
      <FolderNameDialog
        open={Boolean(creating)}
        title="New Folder"
        onOpenChange={(open) => !open && setCreating(null)}
        onSubmit={async (name) => {
          await createFolder({ name, parent_id: creating?.parentId });
        }}
      />
      <FolderNameDialog
        open={Boolean(renaming)}
        title="Rename Folder"
        initialValue={renaming?.name}
        onOpenChange={(open) => !open && setRenaming(null)}
        onSubmit={async (name) => {
          if (renaming) await updateFolder(renaming.id, { name });
        }}
      />
      <MoveFolderDialog folder={moving} folders={folders.data ?? []} onClose={() => setMoving(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete This Folder?"
        description="Bookmarks And Subfolders Inside It Will Be Moved To The Parent Folder (Or To All Bookmarks If This Is A Top-Level Folder). This Cannot Be Undone."
        onConfirm={async () => {
          if (deleting) {
            await deleteFolder(deleting.id);
            await queryClient.invalidateQueries({ queryKey: ["folders"] });
            await queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
          }
          setDeleting(null);
        }}
      />
    </div>
  );
}

function FolderNode({
  node,
  depth,
  expanded,
  setExpanded,
  onCreate,
  onRename,
  onMove,
  onDelete,
}: {
  node: TreeNode;
  depth: number;
  expanded: Record<string, boolean>;
  setExpanded: (value: Record<string, boolean>) => void;
  onCreate: (parentId: string) => void;
  onRename: (folder: Folder) => void;
  onMove: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
}) {
  const isOpen = expanded[node.id] ?? true;
  return (
    <li>
      <div className="group flex items-center rounded-lg hover:bg-paper-sunken" style={{ paddingLeft: depth * 12 }}>
        {node.children.length > 0 ? (
          <button
            type="button"
            className="p-1 text-ink-faint"
            aria-label={isOpen ? "Collapse Folder" : "Expand Folder"}
            onClick={() => setExpanded({ ...expanded, [node.id]: !isOpen })}
          >
            <ChevronRight className={cn("h-3.5 w-3.5 transition", isOpen && "rotate-90")} />
          </button>
        ) : (
          <span className="w-6" />
        )}
        <NavLink
          to={`/app/folder/${node.id}`}
          className={({ isActive }) =>
            cn("flex-1 truncate px-1 py-1.5 text-sm", isActive && "font-semibold text-accent")
          }
        >
          {node.name}
        </NavLink>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="rounded p-1 text-ink-faint opacity-0 hover:text-ink group-hover:opacity-100"
              aria-label={`${node.name} Folder Actions`}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="z-50 min-w-40 rounded-xl border border-line bg-paper-raised p-1 shadow-card">
              <DropdownMenu.Item className="rounded-lg px-2 py-1.5 text-sm hover:bg-paper-sunken" onSelect={() => onCreate(node.id)}>
                New Subfolder
              </DropdownMenu.Item>
              <DropdownMenu.Item className="rounded-lg px-2 py-1.5 text-sm hover:bg-paper-sunken" onSelect={() => onRename(node)}>
                <span className="inline-flex items-center gap-2"><Pencil className="h-3.5 w-3.5" /> Rename</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item className="rounded-lg px-2 py-1.5 text-sm hover:bg-paper-sunken" onSelect={() => onMove(node)}>
                Move
              </DropdownMenu.Item>
              <DropdownMenu.Item className="rounded-lg px-2 py-1.5 text-sm text-red-700 hover:bg-paper-sunken" onSelect={() => onDelete(node)}>
                <span className="inline-flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      {isOpen ? (
        <ul>
          {node.children.map((child) => (
            <FolderNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              setExpanded={setExpanded}
              onCreate={onCreate}
              onRename={onRename}
              onMove={onMove}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function FolderNameDialog({
  open,
  title,
  initialValue = "",
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  initialValue?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialValue);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (open) setName(initialValue);
  }, [open, initialValue]);
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title}>
      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSubmit(name);
          await queryClient.invalidateQueries({ queryKey: ["folders"] });
          onOpenChange(false);
          setName("");
        }}
      >
        <Label htmlFor="folder-name">Name</Label>
        <Input id="folder-name" required value={name} onChange={(event) => setName(event.target.value)} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}

function MoveFolderDialog({
  folder,
  folders,
  onClose,
}: {
  folder: Folder | null;
  folders: Folder[];
  onClose: () => void;
}) {
  const [parentId, setParentId] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const move = useMutation({
    mutationFn: () => moveFolder(folder!.id, parentId || null),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["folders"] });
      onClose();
      navigate(`/app/folder/${folder!.id}`);
    },
  });
  return (
    <Modal open={Boolean(folder)} onOpenChange={(open) => !open && onClose()} title="Move Folder">
      <div className="space-y-3">
        <Label htmlFor="folder-parent">New Parent</Label>
        <select
          id="folder-parent"
          className="h-10 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm"
          value={parentId}
          onChange={(event) => setParentId(event.target.value)}
        >
          <option value="">Top Level</option>
          {folders
            .filter((item) => item.id !== folder?.id)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </select>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => move.mutate()} disabled={move.isPending}>
            Move
          </Button>
        </div>
      </div>
    </Modal>
  );
}
