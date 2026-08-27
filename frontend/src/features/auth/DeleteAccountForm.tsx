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
      <form onSubmit={onSubmit} className="mt-4 space-y-3" autoComplete="off">
        <div className="space-y-1.5">
          <Label htmlFor="delete-password">Password</Label>
          <PasswordInput
            id="delete-password"
            name="neshanak-delete-password"
            preventAutofill
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {deleteAccount.isError ? (
          <p role="alert" className="text-sm text-red-700">
            {errorMessage(deleteAccount.error, "Unable to delete account.")}
          </p>
        ) : null}
        <Button type="submit" variant="danger" disabled={deleteAccount.isPending}>
          Delete account
        </Button>
      </form>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Your Account?"
        description="This permanently deletes your account and every bookmark, folder, and tag in your library. This cannot be undone."
        confirmLabel="Delete account"
        onConfirm={() => {
          void deleteAccount.mutateAsync({ password }).catch(() => undefined);
        }}
      />
    </>
  );
}
