"use client";

import { useEffect, useMemo, useState, use } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Watch, ShieldAlert, Clock } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { invitationApi, type InvitationInfo } from "@/lib/team-api";
import { getCsrfCookie } from "@/lib/api";
import axios from "axios";

type AcceptFormData = {
  name: string;
  password: string;
  password_confirmation: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; info: InvitationInfo }
  | { status: "invalid" }
  | { status: "expired" };

function MobileLogo() {
  return (
    <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
      <div className="w-9 h-9 rounded-lg bg-accent-blue/20 flex items-center justify-center">
        <Watch className="w-5 h-5 text-accent-blue" strokeWidth={1.5} />
      </div>
      <span className="text-lg font-bold tracking-tight">
        WatchSync<span className="text-accent-blue"> AI</span>
      </span>
    </div>
  );
}

export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const t = useTranslations("Invite");
  const tc = useTranslations("Common");
  const router = useRouter();
  const fetchUser = useAuthStore((s) => s.fetchUser);

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const info = await invitationApi.show(token);
        if (active) setState({ status: "ready", info });
      } catch (err) {
        if (!active) return;
        if (axios.isAxiosError(err) && err.response?.status === 410) {
          setState({ status: "expired" });
        } else {
          setState({ status: "invalid" });
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(2, t("name_too_short")),
          password: z
            .string()
            .min(8, t("password_too_short"))
            .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, t("password_requirements")),
          password_confirmation: z.string(),
        })
        .refine((d) => d.password === d.password_confirmation, {
          message: t("passwords_mismatch"),
          path: ["password_confirmation"],
        }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptFormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: AcceptFormData) => {
    setApiError(null);
    try {
      await getCsrfCookie();
      await invitationApi.accept(token, {
        name: data.name,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      await fetchUser();
      router.push("/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 410) {
          setState({ status: "expired" });
          return;
        }
        if (err.response?.status === 404) {
          setState({ status: "invalid" });
          return;
        }
        if (err.response?.data?.errors) {
          const first = Object.values(
            err.response.data.errors as Record<string, string[]>,
          )[0];
          setApiError(first?.[0] || t("accept_failed"));
        } else {
          setApiError(err.response?.data?.message || t("accept_failed"));
        }
      } else {
        setApiError(t("accept_failed"));
      }
    }
  };

  const roleLabel = (role: string) =>
    role === "owner"
      ? t("role_owner")
      : role === "manager"
        ? t("role_manager")
        : t("role_staff");

  if (state.status === "loading") {
    return (
      <div className="space-y-8">
        <MobileLogo />
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
          <p className="text-sm text-secondary-text">{t("verifying")}</p>
        </div>
      </div>
    );
  }

  if (state.status === "invalid" || state.status === "expired") {
    const expired = state.status === "expired";
    return (
      <div className="space-y-8">
        <MobileLogo />
        <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              expired ? "bg-accent-gold/15" : "bg-semantic-error/15"
            }`}
          >
            {expired ? (
              <Clock className="w-7 h-7 text-accent-gold" />
            ) : (
              <ShieldAlert className="w-7 h-7 text-semantic-error" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary-text">
              {expired ? t("expired_title") : t("invalid_title")}
            </h2>
            <p className="mt-2 text-sm text-secondary-text max-w-sm">
              {expired ? t("expired_desc") : t("invalid_desc")}
            </p>
          </div>
          <Link
            href="/login"
            className="text-accent-blue hover:text-accent-blue-hover font-medium text-sm transition-colors"
          >
            {t("go_login")}
          </Link>
        </div>
      </div>
    );
  }

  const { info } = state;

  return (
    <div className="space-y-8">
      <MobileLogo />

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-primary-text">{t("title")}</h2>
        <p className="mt-2 text-sm text-secondary-text">
          {t("subtitle", { dealer: info.dealer_name })}
        </p>
      </div>

      {/* Invitation summary */}
      <div className="px-4 py-3 rounded-lg bg-surface border border-border-subtle space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-secondary-text">{t("email")}</span>
          <span className="text-primary-text font-medium">{info.email}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-secondary-text">{t("invited_as")}</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent-blue/15 text-accent-blue text-xs font-semibold">
            {roleLabel(info.role)}
          </span>
        </div>
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
          <label htmlFor="name" className="block text-sm font-medium text-secondary-text">
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
          {errors.name && <p className="text-xs text-semantic-error">{errors.name.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-secondary-text">
            {t("password")}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("password_min")}
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
            <p className="text-xs text-semantic-error">{errors.password.message}</p>
          )}
        </div>

        {/* Password confirm */}
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
            placeholder={t("password_min")}
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
              {t("submitting")}
            </>
          ) : (
            t("submit")
          )}
        </button>
      </form>
    </div>
  );
}
