"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { useAdminAuthStore } from "@/stores/adminAuth";
import axios from "axios";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  password: z.string().min(1, "Şifre gereklidir."),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAdminAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    try {
      await login(data.email, data.password);
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setApiError(
          err.response?.data?.message || "Giriş başarısız. Lütfen tekrar deneyin."
        );
      } else {
        setApiError("Giriş başarısız. Lütfen tekrar deneyin.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-semantic-error/10 mb-6">
            <Shield className="w-8 h-8 text-semantic-error" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-primary-text">Admin Panel</h1>
          <p className="mt-2 text-sm text-secondary-text">
            Yönetici hesabınızla giriş yapın.
          </p>
        </div>

        {/* API Error */}
        {apiError && (
          <div className="px-4 py-3 rounded-lg bg-semantic-error/10 border border-semantic-error/20 text-sm text-semantic-error">
            {apiError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-secondary-text"
            >
              E-posta
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@watchsync.ai"
              {...register("email")}
              className={`w-full h-11 px-4 rounded-lg bg-surface text-sm text-primary-text
                placeholder-disabled-text border transition-all duration-150 outline-none
                ${
                  errors.email
                    ? "border-semantic-error focus:border-semantic-error"
                    : "border-border-subtle focus:border-accent-blue focus:shadow-[var(--shadow-focus)]"
                }`}
            />
            {errors.email && (
              <p className="text-xs text-semantic-error">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-secondary-text"
            >
              Şifre
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                className={`w-full h-11 px-4 pr-11 rounded-lg bg-surface text-sm text-primary-text
                  placeholder-disabled-text border transition-all duration-150 outline-none
                  ${
                    errors.password
                      ? "border-semantic-error focus:border-semantic-error"
                      : "border-border-subtle focus:border-accent-blue focus:shadow-[var(--shadow-focus)]"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-disabled-text hover:text-secondary-text transition-colors"
                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-semantic-error">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-lg bg-semantic-error text-white text-sm font-semibold
              hover:bg-semantic-error/90 active:scale-[0.98] transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Giriş yapılıyor...
              </>
            ) : (
              "Giriş Yap"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-disabled-text">
          Bu sayfa sadece yetkili yöneticiler içindir.
        </p>
      </div>
    </div>
  );
}
