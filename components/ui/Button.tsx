"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "landlord" | "accent" | "inverse";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark disabled:bg-grey-300 disabled:text-grey-500",
  landlord:
    "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark disabled:bg-grey-300 disabled:text-grey-500",
  accent:
    "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark disabled:bg-grey-300 disabled:text-grey-500",
  secondary:
    "bg-surface text-grey-800 border border-line hover:border-grey-800 active:bg-grey-100 disabled:border-grey-300 disabled:text-grey-400",
  inverse:
    "bg-transparent text-white border border-white hover:bg-white/10 active:bg-white/15 disabled:border-white/40 disabled:text-white/40",
  ghost:
    "bg-transparent text-grey-700 hover:bg-grey-200 active:bg-grey-300",
  danger:
    "bg-surface text-error border border-error hover:bg-error-light active:bg-error-light",
};

interface BaseProps {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkProps = BaseProps & { href: string; onClick?: () => void };

export default function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", fullWidth, children, className } = props;
  const classes = cn(
    "inline-flex h-10 min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-bold transition-colors duration-200 ease-out disabled:cursor-not-allowed sm:min-h-11 sm:h-11",
    variantClasses[variant],
    fullWidth && "w-full",
    className
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes} onClick={props.onClick}>
        {children}
      </Link>
    );
  }

  const { variant: _v, fullWidth: _fw, className: _c, ...rest } =
    props as ButtonProps;
  void _v;
  void _fw;
  void _c;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
