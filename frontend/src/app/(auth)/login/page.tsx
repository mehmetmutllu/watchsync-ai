"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Watch } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import axios from "axios";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  password: z.string().min(1, "Şifre gereklidir."),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
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
      router.push("/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setApiError(err.response?.data?.message || "Giriş başarısız. Lütfen tekrar deneyin.");
      } else {
        setApiError("Giriş başarısız. Lütfen tekrar deneyin.");
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
        <h2 className="text-2xl font-bold text-primary-text">Giriş Yap</h2>
        <p className="mt-2 text-sm text-secondary-text">
          Hesabınıza giriş yaparak envanter yönetiminize devam edin.
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
            placeholder="ornek@watchsync.ai"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
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
              Giriş yapılıyor...
            </>
          ) : (
            "Giriş Yap"
          )}
        </button>
      </form>

      {/* Register link */}
      <p className="text-center text-sm text-secondary-text">
        Hesabınız yok mu?{" "}
        <Link
          href="/register"
          className="text-accent-blue hover:text-accent-blue-hover font-medium transition-colors"
        >
          Kayıt Ol
        </Link>
      </p>
    </div>
  );
}
