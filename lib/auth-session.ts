import { supabase } from "@/lib/supabase";

export async function getAnonymousSessionUserId() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!session) {
    return null;
  }

  if (!session.user.is_anonymous) {
    throw new Error(
      "توجد جلسة مستخدم أخرى فعالة في هذا المتصفح"
    );
  }

  return session.user.id;
}

export async function ensureAnonymousSession(
  captchaToken?: string
) {
  const existingUserId =
    await getAnonymousSessionUserId();

  if (existingUserId) {
    return existingUserId;
  }

  const cleanToken =
    captchaToken?.trim() ?? "";

  if (!cleanToken) {
    throw new Error(
      "يجب إكمال التحقق الأمني أولًا"
    );
  }

  const { data, error } =
    await supabase.auth.signInAnonymously({
      options: {
        captchaToken: cleanToken,
      },
    });

  if (error) {
    throw error;
  }

  if (
    !data.user?.id ||
    !data.user.is_anonymous ||
    !data.session
  ) {
    throw new Error(
      "تعذر إنشاء جلسة آمنة لهذا الجهاز"
    );
  }

  return data.user.id;
}
