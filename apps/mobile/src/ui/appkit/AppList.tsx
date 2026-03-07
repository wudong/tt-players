import type { MouseEventHandler, ReactNode } from 'react';
import { cx } from './cx';

type AppListSize = 'small' | 'large';

interface AppListGroupProps {
  children: ReactNode;
  size?: AppListSize;
  className?: string;
}

interface AppListItemProps {
  iconClassName: string;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  href?: string;
  borderless?: boolean;
  trailingIconClassName?: string;
}

export function AppListGroup({ children, size = 'large', className }: AppListGroupProps) {
  return (
    <div
      className={cx('list-group', size === 'large' ? 'list-custom-large' : 'list-custom-small', className)}
    >
      {children}
    </div>
  );
}

export function AppListItem({
  iconClassName,
  title,
  subtitle,
  className,
  onClick,
  href = '#',
  borderless = false,
  trailingIconClassName = 'fa fa-angle-right',
}: AppListItemProps) {
  return (
    <a href={href} onClick={onClick} className={cx(borderless && 'border-0', className)}>
      <i className={iconClassName} />
      <span>{title}</span>
      {subtitle ? <strong>{subtitle}</strong> : null}
      <i className={trailingIconClassName} />
    </a>
  );
}
