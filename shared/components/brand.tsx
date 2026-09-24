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
      <img
        alt=""
        aria-hidden="true"
        className="brand-mark"        
        src="/daymark-logo.gif"        
      />
      <span>Daymark</span>
    </a>
  );
}
