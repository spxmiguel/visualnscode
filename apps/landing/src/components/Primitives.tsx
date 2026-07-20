import { ArrowUpRight, Check } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';

export function Container({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function SectionHeading({
  index,
  label,
  title,
  description,
  align = 'left',
}: {
  index: string;
  label: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <div className={`mb-5 flex items-center gap-3 ${align === 'center' ? 'justify-center' : ''}`}>
        <span className="font-mono text-[10px] text-[rgb(var(--accent))]">{index}</span>
        <span className="h-px w-8 bg-[rgb(var(--accent))]" />
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[rgb(var(--muted))]">
          {label}
        </p>
      </div>
      <h2 className="text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-pretty text-base leading-7 text-[rgb(var(--muted))]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function FeatureCard({
  icon: Icon,
  index,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="group border-t border-[rgb(var(--line))] bg-[rgb(var(--page))] py-6 sm:p-6 sm:ring-1 sm:ring-[rgb(var(--line))] sm:[border-top:0]">
      <div className="flex items-center justify-between">
        <Icon className="size-5 text-[rgb(var(--accent))]" />
        <span className="font-mono text-[10px] text-[rgb(var(--subtle))]">{index}</span>
      </div>
      <h3 className="mt-8 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{children}</p>
    </article>
  );
}

export function CheckList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          className="flex items-start gap-3 text-sm leading-6 text-[rgb(var(--muted))]"
          key={item}
        >
          <Check aria-hidden className="mt-1 size-4 shrink-0 text-[rgb(var(--accent))]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ExternalLink({
  children,
  className = '',
  href,
}: {
  children: ReactNode;
  className?: string;
  href: string;
}) {
  return (
    <a className={className} href={href} rel="noreferrer" target="_blank">
      {children}
      <ArrowUpRight aria-hidden className="size-4" />
    </a>
  );
}
