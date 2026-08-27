import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { errorMessage, useChangePassword } from "@/hooks/useAuth";

export function ChangePasswordForm() {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatch, setMismatch] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    try {
      await changePassword.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      // error rendered below
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="current-password">Current Password</Label>
        <PasswordInput
          id="current-password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-password">New Password</Label>
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
          minLength={8}
          required
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <PasswordInput
          id="confirm-password"
          autoComplete="new-password"
          minLength={8}
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>
      {mismatch ? (
        <p role="alert" className="text-sm text-red-700">
          New Passwords Do Not Match.
        </p>
      ) : changePassword.isError ? (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage(changePassword.error, "Unable To Change Password.")}
        </p>
      ) : changePassword.isSuccess ? (
        <p className="text-sm text-ink-muted">Password Updated.</p>
      ) : null}
      <Button type="submit" disabled={changePassword.isPending}>
        {changePassword.isPending ? "Saving…" : "Change Password"}
      </Button>
    </form>
  );
}
