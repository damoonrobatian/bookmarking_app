import { LoginForm } from "@/features/auth/LoginForm";
import { AuthLayout } from "@/layouts/AuthLayout";

export function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to open your bookmark library.">
      <LoginForm />
    </AuthLayout>
  );
}
