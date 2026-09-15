"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileRenderOptions = {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "flexible";
  language?: string;
  appearance?: "always" | "execute" | "interaction-only";
  callback?: (token: string) => void;
  "error-callback"?: (errorCode?: string) => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
};

type TurnstileApi = {
  render: (
    container: HTMLElement | string,
    options: TurnstileRenderOptions
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId?: string) => void;
};

type TurnstileWindow = Window & {
  turnstile?: TurnstileApi;
};

type MigrationTurnstileProps = {
  onToken: (token: string) => void;
  onError: (message: string) => void;
};

export default function MigrationTurnstile({
  onToken,
  onError,
}: MigrationTurnstileProps) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const widgetIdRef =
    useRef<string | null>(null);

  const [scriptReady, setScriptReady] =
    useState(false);

  const siteKey =
    process.env
      .NEXT_PUBLIC_TURNSTILE_SITE_KEY
      ?.trim() ?? "";

  useEffect(() => {
    const turnstileWindow =
      window as TurnstileWindow;

    if (
      !scriptReady ||
      !siteKey ||
      !containerRef.current ||
      !turnstileWindow.turnstile
    ) {
      return;
    }

    try {
      const widgetId =
        turnstileWindow.turnstile.render(
          containerRef.current,
          {
            sitekey: siteKey,
            theme: "dark",
            size: "flexible",
            language: "ar",
            appearance: "always",

            callback: (token) => {
              onToken(token.trim());
              onError("");
            },

            "error-callback": () => {
              onToken("");
              onError(
                "تعذر إكمال التحقق الأمني."
              );
            },

            "expired-callback": () => {
              onToken("");
              onError(
                "انتهت صلاحية التحقق الأمني. أعد التحقق."
              );
            },

            "timeout-callback": () => {
              onToken("");
              onError(
                "انتهت مهلة التحقق الأمني. حاول مرة أخرى."
              );
            },
          }
        );

      widgetIdRef.current = widgetId;
    } catch (error) {
      console.error(
        "Migration Turnstile render error:",
        error
      );

      onToken("");
      onError(
        "تعذر تشغيل التحقق الأمني."
      );
    }

    return () => {
      if (
        widgetIdRef.current &&
        turnstileWindow.turnstile
      ) {
        try {
          turnstileWindow.turnstile.remove(
            widgetIdRef.current
          );
        } catch {
          // Ignore cleanup errors.
        }
      }

      widgetIdRef.current = null;
    };
  }, [
    scriptReady,
    siteKey,
    onToken,
    onError,
  ]);

  if (!siteKey) {
    return (
      <p className="text-center text-sm text-red-300">
        إعداد التحقق الأمني غير مكتمل.
      </p>
    );
  }

  return (
    <>
      <Script
        id="cloudflare-turnstile-migration"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() =>
          onError(
            "تعذر تحميل التحقق الأمني."
          )
        }
      />

      <div
        ref={containerRef}
        className="min-h-[65px] w-full"
      />
    </>
  );
}
