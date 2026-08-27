import { LoginForm } from "@/features/auth/LoginForm";
import { AuthLayout } from "@/layouts/AuthLayout";

export function LoginPage() {
  return (
    <AuthLayout title="Welcome Back" subtitle="Sign In To Open Your Bookmark Library.">
      <LoginForm />
    </AuthLayout>
  );
}
