type PageHeaderProps = {
  title: string;
  subtitle: string;
};

export default function PageHeader({
  title,
  subtitle,
}: PageHeaderProps) {
  return (
    <div className="text-center mb-14">
      <h1 className="text-6xl font-black text-orange-500">
        NEXO
      </h1>

      <p className="tracking-[8px] text-orange-400 mt-2">
        DIGITAL PASS
      </p>

      <h2 className="mt-12 text-5xl font-bold">
        {title}
      </h2>

      <p className="mt-4 text-gray-400 text-xl">
        {subtitle}
      </p>
    </div>
  );
}