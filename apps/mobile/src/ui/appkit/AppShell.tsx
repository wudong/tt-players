import type { MouseEventHandler, ReactNode } from 'react';
import { cx } from './cx';

type HeaderIconPosition = 1 | 2 | 3 | 4;

type HeaderClearSize = 'small' | 'medium' | 'large';

export interface AppHeaderAction {
  iconClassName: string;
  onClick: MouseEventHandler<HTMLAnchorElement>;
  position: HeaderIconPosition;
  ariaLabel: string;
  className?: string;
}

interface AppShellPageProps {
  children: ReactNode;
  className?: string;
}

interface AppPageContentProps {
  children: ReactNode;
  className?: string;
}

interface AppHeaderSpacerProps {
  size?: HeaderClearSize;
}

interface AppHeaderProps {
  title: ReactNode;
  onTitleClick?: MouseEventHandler<HTMLAnchorElement>;
  leftAction?: AppHeaderAction;
  rightAction?: AppHeaderAction;
  className?: string;
}

function AppHeaderActionLink({ iconClassName, onClick, position, ariaLabel, className }: AppHeaderAction) {
  return (
    <a
      href="#"
      className={cx('header-icon', `header-icon-${position}`, className)}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <i className={iconClassName} />
    </a>
  );
}

export function AppShellPage({ children, className }: AppShellPageProps) {
  return <div id="page" className={cx('app-shell-page', className)}>{children}</div>;
}

export function AppHeaderSpacer({ size = 'medium' }: AppHeaderSpacerProps) {
  return <div className={`header-clear-${size}`} />;
}

export function AppPageContent({ children, className }: AppPageContentProps) {
  return <main className={cx('page-content app-shell-content', className)}>{children}</main>;
}

export function AppHeader({ title, onTitleClick, leftAction, rightAction, className }: AppHeaderProps) {
  return (
    <header className={cx('header header-fixed header-logo-center', className)}>
      {onTitleClick ? (
        <a href="#" className="header-title" onClick={onTitleClick}>{title}</a>
      ) : (
        <span className="header-title">{title}</span>
      )}
      {leftAction ? <AppHeaderActionLink {...leftAction} /> : null}
      {rightAction ? <AppHeaderActionLink {...rightAction} /> : null}
    </header>
  );
}
