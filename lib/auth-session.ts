import { supabase } from "@/lib/supabase";

let sessionPromise: Promise<string> | null = null;

async function createOrRestoreSession() {
  const {
    data: sessionData,
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const existingUserId =
    sessionData.session?.user.id;

  if (existingUserId) {
    return existingUserId;
  }

  const {
    data,
    error,
  } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  const userId =
    data.user?.id ??
    data.session?.user.id;

  if (!userId) {
    throw new Error(
      "تعذر إنشاء جلسة آمنة لهذا الجهاز"
    );
  }

  return userId;
}

export async function ensureAnonymousSession() {
  if (!sessionPromise) {
    sessionPromise =
      createOrRestoreSession().catch(
        (error) => {
          sessionPromise = null;
          throw error;
        }
      );
  }

  return sessionPromise;
}