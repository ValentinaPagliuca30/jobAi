type LogoProps = {
  size?: number;
  className?: string;
};

export function Logo({ size = 22, className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path d="M22.42 2.59a.9.9 0 0 0-1.16-1.17L1.74 8.96a.9.9 0 0 0-.05 1.67l7 2.79 2.79 7a.9.9 0 0 0 1.67-.05L22.42 2.59Zm-3.32 2.49-9.5 9.5-5.6-2.23 15.1-7.27Zm-8.22 10.78 9.5-9.5-7.27 15.1-2.23-5.6Z" />
    </svg>
  );
}
