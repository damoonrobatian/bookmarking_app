import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { errorMessage, useDeleteAccount } from "@/hooks/useAuth";

export function DeleteAccountForm() {
  const deleteAccount = useDeleteAccount();
  const [password, setPassword] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setConfirmOpen(true);
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="delete-password">Password</Label>
          <PasswordInput
            id="delete-password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {deleteAccount.isError ? (
          <p role="alert" className="text-sm text-red-700">
            {errorMessage(deleteAccount.error, "Unable To Delete Account.")}
          </p>
        ) : null}
        <Button type="submit" variant="danger" disabled={deleteAccount.isPending}>
          Delete Account
        </Button>
      </form>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Your Account?"
        description="This Permanently Deletes Your Account And Every Bookmark, Folder, And Tag In Your Library. This Cannot Be Undone."
        confirmLabel="Delete Account"
        onConfirm={() => {
          void deleteAccount.mutateAsync({ password }).catch(() => undefined);
        }}
      />
    </>
  );
}
