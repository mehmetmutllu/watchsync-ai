"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Watch } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import axios from "axios";

const registerSchemaBase = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    company_name: z.string().optional(),
    password: z.string().min(8),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
  });

type RegisterFormData = z.infer<typeof registerSchemaBase>;

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const tc = useTranslations("Common");
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const registerSchema = z
    .object({
      name: z.string().min(2, t("name_too_short")),
      email: z.string().email(t("invalid_email")),
      company_name: z.string().optional(),
      password: z.string().min(8, t("password_too_short")),
      password_confirmation: z.string(),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: t("passwords_mismatch"),
      path: ["password_confirmation"],
    });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        company_name: data.company_name,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.data?.errors) {
          const firstError = Object.values(err.response.data.errors as Record<string, string[]>)[0];
          setApiError(firstError?.[0] || t("register_failed"));
        } else {
          setApiError(err.response?.data?.message || t("register_failed"));
        }
      } else {
        setApiError(t("register_failed"));
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
        <div className="w-9 h-9 rounded-lg bg-accent-blue/20 flex items-center justify-center">
          <Watch className="w-5 h-5 text-accent-blue" strokeWidth={1.5} />
        </div>
        <span className="text-lg font-bold tracking-tight">
          WatchSync<span className="text-accent-blue"> AI</span>
        </span>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-primary-text">{t("register")}</h2>
        <p className="mt-2 text-sm text-secondary-text">
          {t("register_subtitle")}
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
        {/* Name */}
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-secondary-text"
          >
            {t("name")}
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder={t("name_placeholder")}
            {...register("name")}
            className={`w-full h-11 px-4 rounded-lg bg-surface text-sm text-primary-text
              placeholder-disabled-text border transition-all duration-150 outline-none
              ${
                errors.name
                  ? "border-semantic-error focus:border-semantic-error"
                  : "border-border-subtle focus:border-accent-blue focus:shadow-[var(--shadow-focus)]"
              }`}
          />
          {errors.name && (
            <p className="text-xs text-semantic-error">{errors.name.message}</p>
          )}
        </div>

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
            placeholder={t("email_placeholder")}
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
            <p className="text-xs text-semantic-error">{errors.email.message}</p>
          )}
        </div>

        {/* Company Name */}
        <div className="space-y-2">
          <label
            htmlFor="company_name"
            className="block text-sm font-medium text-secondary-text"
          >
            {t("company_name")}{" "}
            <span className="text-disabled-text font-normal">{t("optional")}</span>
          </label>
          <input
            id="company_name"
            type="text"
            placeholder={t("company_placeholder")}
            {...register("company_name")}
            className="w-full h-11 px-4 rounded-lg bg-surface text-sm text-primary-text
              placeholder-disabled-text border border-border-subtle
              focus:border-accent-blue focus:shadow-[var(--shadow-focus)]
              transition-all duration-150 outline-none"
          />
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
              autoComplete="new-password"
              placeholder={t("password_min_length")}
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? tc("hide_password") : tc("show_password")}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Eye className="w-4 h-4" strokeWidth={1.5} />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-semantic-error">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Password Confirm */}
        <div className="space-y-2">
          <label
            htmlFor="password_confirmation"
            className="block text-sm font-medium text-secondary-text"
          >
            {t("password_confirm")}
          </label>
          <input
            id="password_confirmation"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder={t("password_min_length")}
            {...register("password_confirmation")}
            className={`w-full h-11 px-4 rounded-lg bg-surface text-sm text-primary-text
              placeholder-disabled-text border transition-all duration-150 outline-none
              ${
                errors.password_confirmation
                  ? "border-semantic-error focus:border-semantic-error"
                  : "border-border-subtle focus:border-accent-blue focus:shadow-[var(--shadow-focus)]"
              }`}
          />
          {errors.password_confirmation && (
            <p className="text-xs text-semantic-error">
              {errors.password_confirmation.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-lg bg-accent-blue text-white text-sm font-semibold
            hover:bg-accent-blue-hover disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg shadow-accent-blue/25 hover:shadow-accent-blue/40
            transition-all duration-150 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("registering")}
            </>
          ) : (
            t("submit_register")
          )}
        </button>
      </form>

      {/* Login link */}
      <p className="text-center text-sm text-secondary-text">
        {t("have_account")}{" "}
        <Link
          href="/login"
          className="text-accent-blue hover:text-accent-blue-hover font-medium transition-colors"
        >
          {t("submit_login")}
        </Link>
      </p>
    </div>
  );
}
