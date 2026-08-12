"use client";

import { useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { useAdminAuthStore } from "@/stores/adminAuth";
import axios from "axios";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

const loginSchema = z.object({
  email: z.string().email("errors.email_invalid"),
  password: z.string().min(1, "errors.password_required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const t = useTranslations("AdminLogin");
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
          err.response?.data?.message || t("login_failed")
        );
      } else {
        setApiError(t("login_failed"));
      }
    }
  };

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4 relative">
      <div className="absolute top-4 end-4 z-50">
        <LanguageSwitcher variant="compact" />
      </div>
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-semantic-error/10 mb-6">
            <Shield className="w-8 h-8 text-semantic-error" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-primary-text">{t("title")}</h1>
          <p className="mt-2 text-sm text-secondary-text">
            {t("subtitle")}
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
              {t("email")}
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
                {t(errors.email.message as "errors.email_invalid")}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-secondary-text"
            >
              {t("password")}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                className={`w-full h-11 px-4 pe-11 rounded-lg bg-surface text-sm text-primary-text
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
                className="absolute end-3 top-1/2 -translate-y-1/2 text-disabled-text hover:text-secondary-text transition-colors"
                aria-label={showPassword ? t("hide_password") : t("show_password")}
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
                {t(errors.password.message as "errors.password_required")}
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
                {t("submitting")}
              </>
            ) : (
              t("submit")
            )}
          </button>
        </form>

        <p className="text-center text-xs text-disabled-text">
          {t("restricted_notice")}
        </p>
      </div>
    </div>
  );
}
