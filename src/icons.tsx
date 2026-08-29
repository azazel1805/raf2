interface IconProps {
  size?: number;
  className?: string;
}

const base = (size: number | undefined, className: string | undefined) => ({
  width: size ?? 18,
  height: size ?? 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true,
});

export const LogoMark = ({ size, className }: IconProps) => (
  <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" className={className} aria-hidden>
    <path d="M4.5 4h3.4v13H4.5z" fill="currentColor" />
    <path d="M9.6 4H13v13H9.6z" fill="currentColor" />
    <path d="M14.6 5.4l3.3 1-3.4 11.2-3.3-1z" fill="currentColor" />
    <rect x="3" y="19" width="18" height="2.2" rx="1.1" fill="currentColor" />
  </svg>
);

export const BookIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

export const GlobeIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const PlusIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const SearchIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const StarIcon = ({
  size,
  className,
  filled = true,
}: IconProps & { filled?: boolean }) => (
  <svg
    width={size ?? 14}
    height={size ?? 14}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke={filled ? "none" : "currentColor"}
    strokeWidth={filled ? 0 : 1.8}
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <path d="M12 2.8l2.9 5.9 6.5.9-4.7 4.5 1.1 6.4L12 17.5l-5.8 3 1.1-6.4-4.7-4.5 6.5-.9L12 2.8z" />
  </svg>
);

export const ExternalIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
  </svg>
);

export const TrashIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const XIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const PencilIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

export const UndoIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

export const SpinnerIcon = ({ size, className }: IconProps) => (
  <svg
    width={size ?? 18}
    height={size ?? 18}
    viewBox="0 0 24 24"
    fill="none"
    className={`spin ${className ?? ""}`}
    aria-hidden
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const SparkIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
  </svg>
);

export const EyeIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const LinkIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </svg>
);

export const AlertIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
  </svg>
);

export const InfoIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

export const NoteIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <path d="M14 3v5h5" />
    <path d="M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5z" />
    <path d="M9 13h6M9 17h4" />
  </svg>
);

export const LockIcon = (p: IconProps) => (
  <svg {...base(p.size, p.className)}>
    <rect width="18" height="11" x="3" y="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
