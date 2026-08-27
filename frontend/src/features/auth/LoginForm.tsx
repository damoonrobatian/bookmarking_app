import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { errorMessage, useLogin } from "@/hooks/useAuth";
import { safeInternalPath } from "@/utils/paths";

export function LoginForm() {
  const login = useLogin();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeInternalPath(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await login.mutateAsync({ email, password, remember_me: rememberMe });
      navigate(next);
    } catch {
      // error rendered below
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
        <PasswordInput
          id="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          id="remember-me"
          type="checkbox"
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
        />
        Remember me
      </label>
      {login.isError ? (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage(login.error, "Invalid email or password.")}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-ink-muted">
        New here?{" "}
        <Link className="font-medium text-accent hover:underline" to={next === "/app" ? "/register" : `/register?next=${encodeURIComponent(next)}`}>
          Create an account
        </Link>
      </p>
    </form>
  );
}
