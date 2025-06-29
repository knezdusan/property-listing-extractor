"use client";
import React from "react";

interface IconTooltipProps {
  // Accept the actual icon component directly
  className?: string;
  tooltip?: string;
  href?: string;
  size?: string;
  padding?: string;
  color?: string;
  colorHover?: string;
  bckColor?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

/**
 * IconTooltip component that wraps an icon with tooltip and link
 * @param className - The class name - optional
 * @param tooltip - The tooltip text - optional
 * @param href - The link href - optional
 * @param size - The icon size: --icn-tlt-wth (default: 2rem)
 * @param padding - The icon padding: --icn-tlt-p (default: 1rem)
 * @param color - The icon color: --icn-tlt-clr (default: var(--clr-txt-drk))
 * @param colorHover - The icon color on hover: --icn-tlt-clr-hover (default: var(--clr-txt-lht))
 * @param bckColor - The icon background color: --icn-tlt-bck (default: var(--clr-txt-drk))
 * @param children - The icon component
 * @returns The IconTooltip component
 *
 * Example:
 *
 * <IconTooltip className="custom-class-name" tooltip="Close this window" href="#" size="1.5rem" padding="0.5rem" color="var(--clr-txt-drk)" colorHover="#e7d6d6" bckColor="var(--clr-prm)">
 *   <MdClose />
 * </IconTooltip>
 */
export default function IconTooltip({
  className,
  tooltip,
  href,
  size,
  padding,
  color,
  colorHover,
  bckColor,
  onClick,
  children,
}: IconTooltipProps) {
  const iconStyle = {
    "--icn-tlt-wth": size,
    "--icn-tlt-p": padding,
    "--icn-tlt-clr": color,
    "--icn-tlt-clr-hover": colorHover,
    "--icn-tlt-bck": bckColor,
  } as React.CSSProperties;

  return (
    <div className={`icon-tooltip ${className || ""}`} style={iconStyle}>
      <div className="icon-tooltip-wrapper">
        <a
          href={href || ""}
          {...(!href ? { onClick: (e) => e.preventDefault() } : {})}
          aria-label={tooltip}
          onClick={onClick}
        >
          <div className="icon">{children}</div>
        </a>
        {tooltip && <div className="tooltip">{tooltip}</div>}
      </div>
    </div>
  );
}
