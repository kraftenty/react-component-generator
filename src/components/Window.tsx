import type { CSSProperties, ReactNode } from 'react';

interface WindowProps {
  title: string;
  /** Accessible name when the title bar text is truncated or decorative. */
  label?: string;
  as?: 'section' | 'aside' | 'article' | 'div';
  className?: string;
  bodyClassName?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function Window({
  title,
  label,
  as: Tag = 'section',
  className = '',
  bodyClassName = 'win-body',
  style,
  children,
}: WindowProps) {
  return (
    <Tag className={`win ${className}`.trim()} aria-label={label ?? title} style={style}>
      <div className="win-titlebar" aria-hidden="true">
        <span className="win-title">{title}</span>
      </div>
      <div className={bodyClassName}>{children}</div>
    </Tag>
  );
}
