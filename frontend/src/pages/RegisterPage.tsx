import { RegisterForm } from "@/features/auth/RegisterForm";
import { AuthLayout } from "@/layouts/AuthLayout";

export function RegisterPage() {
  return (
    <AuthLayout title="Create Your Neshanak" subtitle="A personal library for the web, kept just for you.">
      <RegisterForm />
    </AuthLayout>
  );
}
