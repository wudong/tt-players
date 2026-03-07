import type { ReactNode } from 'react';
import { AppShellPage } from './ui/appkit';
import { TabFooterBar } from './TabFooterBar';

interface TabShellPageProps {
  children: ReactNode;
}

export function TabShellPage({ children }: TabShellPageProps) {
  return (
    <AppShellPage>
      {children}
      <TabFooterBar reselectBehavior="root" />
    </AppShellPage>
  );
}
