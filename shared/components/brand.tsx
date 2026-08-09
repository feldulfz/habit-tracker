type BrandProps = {
  large?: boolean;
};

export function Brand({ large = false }: BrandProps) {
  return (
    <a
      className={`brand ${large ? "brand-large" : ""}`}
      href="/"
      aria-label="Daymark home"
    >
      <span className="brand-mark" aria-hidden="true">
        D
      </span>
      <span>Daymark</span>
    </a>
  );
}
