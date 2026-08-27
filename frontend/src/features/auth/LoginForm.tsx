import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { errorMessage, useLogin } from "@/hooks/useAuth";

export function LoginForm() {
  const login = useLogin();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await login.mutateAsync({ email, password, remember_me: rememberMe });
      navigate("/app");
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
        Remember Me
      </label>
      {login.isError ? (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage(login.error, "Invalid Email Or Password.")}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? "Signing In…" : "Sign In"}
      </Button>
      <p className="text-center text-sm text-ink-muted">
        New Here?{" "}
        <Link className="font-medium text-accent hover:underline" to="/register">
          Create An Account
        </Link>
      </p>
    </form>
  );
}
