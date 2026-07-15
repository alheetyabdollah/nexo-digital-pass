"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { supabase } from "@/lib/supabase";
import { hashText } from "@/lib/accountRules";

import { useVaultSession } from "@/components/providers/VaultSessionProvider";

import AccountInfoCard from "@/components/account/AccountInfoCard";
import PasswordSection from "@/components/account/PasswordSection";
import AccountActions from "@/components/account/AccountActions";
import DeleteDialog from "@/components/account/DeleteDialog";

import {
  FaApple,
  FaFacebook,
  FaWhatsapp,
  FaTelegramPlane,
} from "react-icons/fa";

import {
  SiGoogleplay,
  SiInstagram,
  SiTiktok,
} from "react-icons/si";

import {
  HiOutlineArrowRight,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineSquares2X2,
} from "react-icons/hi2";

type Account = {
  id: string;
  card_id: string;
  service: string;
  email: string | null;
  username: string | null;
  password: string | null;
  phone: string | null;
  recovery: string | null;
  notes: string | null;
};

function getServiceIcon(service: string) {
  if (service === "Apple") {
    return <FaApple size={38} className="text-white" />;
  }

  if (service === "Google") {
    return <SiGoogleplay size={36} className="text-white" />;
  }

  if (service === "Instagram") {
    return <SiInstagram size={36} className="text-pink-500" />;
  }

  if (service === "Facebook") {
    return <FaFacebook size={36} className="text-blue-500" />;
  }

  if (service === "WhatsApp") {
    return <FaWhatsapp size={37} className="text-green-500" />;
  }

  if (service === "Telegram") {
    return (
      <FaTelegramPlane
        size={36}
        className="text-sky-400"
      />
    );
  }

  if (service === "TikTok") {
    return <SiTiktok size={35} className="text-white" />;
  }

  return (
    <HiOutlineSquares2X2
      size={38}
      className="text-orange-400"
    />
  );
}

export default function AccountDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const cardCode = searchParams.get("card");
  const {
  isUnlocked,
  matchesCard,
  decryptText,
  encryptText,
} = useVaultSession();
  const id = params.id as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [originalAccount, setOriginalAccount] =
    useState<Account | null>(null);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
  let cancelled = false;

  async function loadAccount() {
    const cleanedCardCode =
      cardCode?.trim();

    if (!cleanedCardCode) {
      router.replace("/");
      return;
    }

    if (
      !isUnlocked ||
      !matchesCard(cleanedCardCode)
    ) {
      router.replace(
        `/unlock?card=${encodeURIComponent(
          cleanedCardCode
        )}`
      );

      return;
    }

    try {
      const {
        data: card,
        error: cardError,
      } = await supabase
        .from("cards")
        .select("id, status, crypto_version")
        .eq(
          "card_code",
          cleanedCardCode
        )
        .maybeSingle();

      if (cancelled) return;

      if (
        cardError ||
        !card ||
        card.status !== "Activated" ||
        card.crypto_version !== 2
      ) {
        router.replace(
          `/card/${encodeURIComponent(
            cleanedCardCode
          )}`
        );

        return;
      }

      const {
        data,
        error: accountError,
      } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", id)
        .eq("card_id", card.id)
        .maybeSingle();

      if (cancelled) return;

      if (accountError || !data) {
        router.replace(
          `/service/all?card=${encodeURIComponent(
            cleanedCardCode
          )}`
        );

        return;
      }

      const [
        email,
        username,
        password,
        phone,
        recovery,
        notes,
      ] = await Promise.all([
        data.email
          ? decryptText(
              data.email,
              cleanedCardCode
            )
          : null,

        data.username
          ? decryptText(
              data.username,
              cleanedCardCode
            )
          : null,

        data.password
          ? decryptText(
              data.password,
              cleanedCardCode
            )
          : null,

        data.phone
          ? decryptText(
              data.phone,
              cleanedCardCode
            )
          : null,

        data.recovery
          ? decryptText(
              data.recovery,
              cleanedCardCode
            )
          : null,

        data.notes
          ? decryptText(
              data.notes,
              cleanedCardCode
            )
          : null,
      ]);

      if (cancelled) return;

      const decryptedAccount: Account = {
        ...data,
        email,
        username,
        password,
        phone,
        recovery,
        notes,
      };

      setAccount(decryptedAccount);
      setOriginalAccount({
        ...decryptedAccount,
      });
    } catch (error) {
      console.error(error);

      if (!cancelled) {
        setStatus(
          "تعذر فك تشفير معلومات الحساب"
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  void loadAccount();

  return () => {
    cancelled = true;
  };
}, [
  id,
  cardCode,
  isUnlocked,
  matchesCard,
  decryptText,
  router,
]);

  const updateField = (
    field: keyof Account,
    value: string
  ) => {
    if (!account) return;

    setAccount({
      ...account,
      [field]: value,
    });
  };

  const cancelEditing = () => {
    if (originalAccount) {
      setAccount({ ...originalAccount });
    }

    setEditing(false);
    setStatus("");
  };

  const saveChanges = async () => {
    if (!account) return;

    setStatus("جاري حفظ التعديلات...");

    if (!cardCode) {
      setStatus("لم يتم العثور على البطاقة");
      return;
    }

    const cleanedCardCode =
  cardCode?.trim();

if (!cleanedCardCode) {
  setStatus("لم يتم العثور على البطاقة");
  return;
}

if (
  !isUnlocked ||
  !matchesCard(cleanedCardCode)
) {
  setStatus("انتهت جلسة الخزنة");

  router.replace(
    `/unlock?card=${encodeURIComponent(
      cleanedCardCode
    )}`
  );

  return;
}

const encryptField = async (
  value: string | null
) => {
  if (!value?.trim()) {
    return null;
  }

  return encryptText(
    value.trim(),
    cleanedCardCode
  );
};

    const cleanEmail =
      account.email?.trim().toLowerCase() || "";

    const emailHash = cleanEmail
      ? await hashText(cleanEmail)
      : null;

    const { error } = await supabase
      .from("accounts")
      .update({
        email_hash: emailHash,
        email: await encryptField(account.email),
        username: await encryptField(account.username),
        password: await encryptField(account.password),
        phone: await encryptField(account.phone),
        recovery: await encryptField(account.recovery),
        notes: await encryptField(account.notes),
      })
      .eq("id", account.id)
      .eq("card_id", account.card_id);

    if (error) {
      console.error(error);
      setStatus("حدث خطأ أثناء حفظ التعديلات");
      return;
    }

    setOriginalAccount({ ...account });
    setEditing(false);
    setStatus("تم تحديث الحساب بنجاح ✅");

    setTimeout(() => {
      setStatus("");
    }, 2500);
  };

  const deleteAccount = async () => {
    if (!account || deleting) return;

    setDeleting(true);
    setStatus("");

    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", account.id)
      .eq("card_id", account.card_id);

    if (error) {
      console.error(error);
      setStatus("حدث خطأ أثناء الحذف");
      setDeleting(false);
      return;
    }

    setDeleting(false);
    setDeleted(true);

    setTimeout(() => {
      router.replace(
        `/service/all?card=${cardCode}`
      );
    }, 1800);
  };

  if (loading || !account) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070707] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />

          <p className="text-sm text-white/50">
            جاري تحميل الحساب...
          </p>
        </div>
      </main>
    );
  }

  const accountName =
    account.email ||
    account.username ||
    account.phone ||
    "حساب محفوظ";

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#070707] text-white"
    >
      <div className="relative mx-auto min-h-screen w-full max-w-[480px] overflow-hidden px-4 pb-12 pt-5">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-500/10 blur-[90px]" />

        <header className="relative mb-6 flex items-center justify-between">
          <Link
            href={
              cardCode
                ? `/service/all?card=${cardCode}`
                : "/"
            }
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-orange-500/30 hover:text-orange-400 active:scale-95"
            aria-label="الرجوع إلى الحسابات"
          >
            <HiOutlineArrowRight size={22} />
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-black tracking-[0.12em] text-orange-500">
              NEXO
            </h1>

            <p className="mt-1 text-[9px] tracking-[0.35em] text-white/60">
              DIGITAL PASS
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
            <HiOutlineLockClosed size={21} />
          </div>
        </header>

        <section className="relative mb-5 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.035] to-orange-500/[0.03] p-5 shadow-[0_20px_70px_rgba(255,106,0,0.08)]">
          <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border border-white/10 bg-black/40">
              {getServiceIcon(account.service)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/45">
                تفاصيل الحساب
              </p>

              <h2 className="mt-1 truncate text-3xl font-black">
                {account.service}
              </h2>

              <p
                dir="ltr"
                className="mt-2 truncate text-left text-sm text-white/50"
              >
                {accountName}
              </p>
            </div>
          </div>

          <div className="relative mt-5 flex items-start gap-2 border-t border-white/10 pt-4">
            <HiOutlineShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-orange-400"
            />

            <p className="text-xs leading-6 text-white/45">
              يتم فك تشفير معلومات هذا الحساب على جهازك فقط.
            </p>
          </div>
        </section>

        {status && (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3 text-center text-sm font-bold ${
              status.includes("بنجاح")
                ? "border-green-500/20 bg-green-500/10 text-green-300"
                : status.includes("جاري")
                  ? "border-orange-500/20 bg-orange-500/10 text-orange-300"
                  : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {status}
          </div>
        )}

        <section className="space-y-4">
          <AccountInfoCard
            label="البريد الإلكتروني"
            value={account.email}
            editing={editing}
            onChange={(value) =>
              updateField("email", value)
            }
          />

          <AccountInfoCard
            label="اسم المستخدم"
            value={account.username}
            editing={editing}
            onChange={(value) =>
              updateField("username", value)
            }
          />

          <PasswordSection
            password={account.password}
            editing={editing}
            onChange={(value) =>
              updateField("password", value)
            }
          />

          <AccountInfoCard
            label="رقم الهاتف"
            value={account.phone}
            editing={editing}
            onChange={(value) =>
              updateField("phone", value)
            }
          />

          <AccountInfoCard
            label="بيانات الاسترداد"
            value={account.recovery}
            editing={editing}
            onChange={(value) =>
              updateField("recovery", value)
            }
          />

          <AccountInfoCard
            label="الملاحظات"
            value={account.notes}
            editing={editing}
            onChange={(value) =>
              updateField("notes", value)
            }
          />

          <AccountActions
            editing={editing}
            onEdit={() => {
              setOriginalAccount({ ...account });
              setEditing(true);
              setStatus("");
            }}
            onSave={saveChanges}
            onCancel={cancelEditing}
            onDelete={() => {
              setDeleted(false);
              setStatus("");
              setShowDeleteConfirm(true);
            }}
          />
        </section>

        <section className="mt-5 flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.025] p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
            <HiOutlineLockClosed size={22} />
          </div>

          <p className="text-xs leading-6 text-white/45">
            بيانات الحساب مشفرة ولا يستطيع فريق NEXO الاطلاع
            عليها.
          </p>
        </section>
      </div>

      <DeleteDialog
        open={showDeleteConfirm}
        service={account.service}
        accountName={accountName}
        deleting={deleting}
        deleted={deleted}
        onCancel={() => {
          if (deleting || deleted) return;

          setShowDeleteConfirm(false);
        }}
        onConfirm={deleteAccount}
      />
    </main>
  );
}