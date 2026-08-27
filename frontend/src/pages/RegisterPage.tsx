import { RegisterForm } from "@/features/auth/RegisterForm";
import { AuthLayout } from "@/layouts/AuthLayout";

export function RegisterPage() {
  return (
    <AuthLayout title="Create Your Neshanak" subtitle="A Personal Library For The Web, Kept Just For You.">
      <RegisterForm />
    </AuthLayout>
  );
}
