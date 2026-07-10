type NexoMarkProps = {
  size?: number;
  className?: string;
  animated?: boolean;
  variant?: "flat" | "premium";
};

export default function NexoMark({
  size = 48,
  className = "",
  animated = false,
  variant = "flat",
}: NexoMarkProps) {
  const isPremium = variant === "premium";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="شعار NEXO"
      className={[
        animated ? "nexo-breathe" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        color: "#FF6A00",
        filter: isPremium
          ? "drop-shadow(0 0 7px rgba(255,106,0,.65))"
          : undefined,
      }}
    >
      {/* العمود الأيسر */}
      <path
        d="M14 82V18L28 18V82H14Z"
        fill="currentColor"
      />

      {/* الجزء القطري العلوي */}
      <path
        d="M22 18H39L78 66V84H68L22 30V18Z"
        fill="currentColor"
      />

      {/* العمود الأيمن */}
      <path
        d="M72 18H86V82H72V18Z"
        fill="currentColor"
      />

      {/* القطع الهندسي الوسطي المميز */}
      <path
        d="M43 48L55 48L66 61V73L43 48Z"
        fill="#070707"
        opacity="0.95"
      />

      {/* الخط الداخلي البرتقالي */}
      <path
        d="M42 51L63 75"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="square"
      />

      {/* لمعة خفيفة للنسخة الفاخرة */}
      {isPremium && (
        <>
          <path
            d="M17 21V78"
            stroke="white"
            strokeOpacity="0.22"
            strokeWidth="2"
          />

          <path
            d="M30 21L76 75"
            stroke="white"
            strokeOpacity="0.18"
            strokeWidth="2"
          />

          <path
            d="M75 21V78"
            stroke="white"
            strokeOpacity="0.18"
            strokeWidth="2"
          />
        </>
      )}
    </svg>
  );
}