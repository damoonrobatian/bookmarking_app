import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage, useRegister } from "@/hooks/useAuth";

export function RegisterForm() {
  const register = useRegister();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await register.mutateAsync({
        email,
        password,
        display_name: displayName,
      });
      navigate("/app");
    } catch {
      // error rendered below
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="display-name">Name</Label>
        <Input
          id="display-name"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {register.isError ? (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage(register.error, "Unable To Create Your Account.")}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={register.isPending}>
        {register.isPending ? "Creating Account…" : "Create Account"}
      </Button>
      <p className="text-center text-sm text-ink-muted">
        Already Have An Account?{" "}
        <Link className="font-medium text-accent hover:underline" to="/login">
          Sign In
        </Link>
      </p>
    </form>
  );
}
