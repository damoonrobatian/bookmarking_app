import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { updateBookmark } from "@/services/bookmarks";
import { listFolders } from "@/services/folders";
import type { Bookmark } from "@/types";
import { useState } from "react";

export function MoveBookmarkDialog({
  bookmark,
  onClose,
}: {
  bookmark: Bookmark | null;
  onClose: () => void;
}) {
  const folders = useQuery({
    queryKey: ["folders"],
    queryFn: listFolders,
    enabled: Boolean(bookmark),
  });
  const [folderId, setFolderId] = useState(bookmark?.folder_id ?? "");
  const queryClient = useQueryClient();
  const move = useMutation({
    mutationFn: () => updateBookmark(bookmark!.id, { folder_id: folderId || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      onClose();
    },
  });

  return (
    <Modal
      open={Boolean(bookmark)}
      onOpenChange={(open) => !open && onClose()}
      title="Move bookmark"
      description="Choose a folder for this bookmark."
    >
      <div className="space-y-3">
        <Label htmlFor="move-folder">Folder</Label>
        <select
          id="move-folder"
          className="h-10 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm"
          value={folderId}
          onChange={(event) => setFolderId(event.target.value)}
        >
          <option value="">No folder</option>
          {(Array.isArray(folders.data) ? folders.data : []).map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
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
