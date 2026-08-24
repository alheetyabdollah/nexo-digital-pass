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
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

function postToNative(
  type: string,
  payload: Record<string, unknown> = {}
) {
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({
      type,
      ...payload,
    })
  );
}

export default function TurnstilePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const [siteKey, setSiteKey] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const key = params.get("sitekey")?.trim() ?? "";

    if (!key) {
      setPageError(
        "Turnstile Site Key غير موجود."
      );
      postToNative("turnstile-error", {
        code: "missing-sitekey",
      });
      return;
    }

    setSiteKey(key);
  }, []);

  useEffect(() => {
    if (
      !scriptReady ||
      !siteKey ||
      !containerRef.current ||
      !window.turnstile
    ) {
      return;
    }

    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(
          widgetIdRef.current
        );
      } catch {
        // Ignore cleanup errors before re-rendering.
      }

      widgetIdRef.current = null;
    }

    setPageError("");

    try {
      widgetIdRef.current =
        window.turnstile.render(
          containerRef.current,
          {
            sitekey: siteKey,
            theme: "dark",
            size: "flexible",
            language: "ar",
            appearance: "interaction-only",

            callback: (token) => {
              postToNative(
                "turnstile-success",
                { token }
              );
            },

            "error-callback": (
              errorCode
            ) => {
              setPageError(
                "تعذر إكمال التحقق الأمني."
              );

              postToNative(
                "turnstile-error",
                {
                  code:
                    errorCode ??
                    "unknown",
                }
              );
            },

            "expired-callback": () => {
              postToNative(
                "turnstile-expired"
              );
            },

            "timeout-callback": () => {
              postToNative(
                "turnstile-timeout"
              );
            },
          }
        );
    } catch (error) {
      console.error(
        "Turnstile render error:",
        error
      );

      setPageError(
        "تعذر تشغيل التحقق الأمني."
      );

      postToNative("turnstile-error", {
        code: "render-failed",
      });
    }

    return () => {
      if (
        widgetIdRef.current &&
        window.turnstile
      ) {
        try {
          window.turnstile.remove(
            widgetIdRef.current
          );
        } catch {
          // Ignore cleanup errors.
        }
      }

      widgetIdRef.current = null;
    };
  }, [scriptReady, siteKey]);

  return (
    <main style={styles.page}>
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() =>
          setScriptReady(true)
        }
        onError={() => {
          setPageError(
            "تعذر تحميل خدمة التحقق الأمني."
          );

          postToNative(
            "turnstile-error",
            {
              code: "script-load-failed",
            }
          );
        }}
      />

      <section style={styles.card}>
        <div style={styles.brand}>
          NEXO
        </div>

        <div style={styles.subtitle}>
          DIGITAL PASS
        </div>

        <h1 style={styles.title}>
          التحقق الأمني
        </h1>

        <p style={styles.text}>
          جارٍ التأكد أن عملية الدخول
          حقيقية وآمنة.
        </p>

        <div
          ref={containerRef}
          style={styles.widget}
        />

        {pageError ? (
          <p style={styles.error}>
            {pageError}
          </p>
        ) : null}
      </section>
    </main>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    margin: 0,
    padding: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#050505",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    color: "#ffffff",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "28px 22px",
    borderRadius: "24px",
    border:
      "1px solid rgba(255,255,255,0.08)",
    background:
      "rgba(255,255,255,0.035)",
    textAlign: "center",
    boxSizing: "border-box",
  },

  brand: {
    color: "#ff6a00",
    fontSize: "30px",
    fontWeight: 900,
    letterSpacing: "0.5px",
  },

  subtitle: {
    marginTop: "-2px",
    color:
      "rgba(255,255,255,0.55)",
    fontSize: "8px",
    fontWeight: 700,
    letterSpacing: "3px",
  },

  title: {
    margin: "28px 0 0",
    fontSize: "25px",
    fontWeight: 900,
  },

  text: {
    margin: "10px 0 22px",
    color:
      "rgba(255,255,255,0.55)",
    fontSize: "14px",
    lineHeight: 1.7,
  },

  widget: {
    minHeight: "70px",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  error: {
    margin: "18px 0 0",
    color: "#ff8a3d",
    fontSize: "13px",
    fontWeight: 700,
  },
};
