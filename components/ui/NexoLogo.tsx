import NexoMark from "@/components/ui/NexoMark";

type NexoLogoProps = {
  variant?: "full" | "mark";
  size?: number;
  animated?: boolean;
  className?: string;
};

export default function NexoLogo({
  variant = "full",
  size = 52,
  animated = false,
  className = "",
}: NexoLogoProps) {
  if (variant === "mark") {
    return (
      <NexoMark
        size={size}
        animated={animated}
        variant="premium"
        className={className}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-3 ${className}`}
      aria-label="NEXO Digital Pass"
    >
      <NexoMark
        size={size}
        animated={animated}
        variant="premium"
      />

      <div className="text-left leading-none">
        <div className="text-[38px] font-black tracking-[0.14em] text-orange-500">
          NEXO
        </div>

        <div className="mt-2 text-[11px] font-bold tracking-[0.38em] text-white/65">
          DIGITAL PASS
        </div>
      </div>
    </div>
  );
}