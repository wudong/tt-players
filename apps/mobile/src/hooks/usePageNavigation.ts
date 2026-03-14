import { useCallback, type MouseEvent } from 'react';
import { useTabNavigation, type AppTabId } from '../navigation/tab-navigation';

interface UsePageNavigationOptions {
  backPath?: string;
  homeTab?: AppTabId;
}

export function usePageNavigation(options: UsePageNavigationOptions = {}) {
  const { backPath, homeTab = 'home' } = options;
  const { goBackInActiveTab, switchTab, navigateInActiveTab, navigateInTab } = useTabNavigation();

  const goBack = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      goBackInActiveTab(backPath);
    },
    [goBackInActiveTab, backPath],
  );

  const goHome = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      switchTab(homeTab, 'root');
    },
    [switchTab, homeTab],
  );

  const navigate = useCallback(
    (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      navigateInActiveTab(path);
    },
    [navigateInActiveTab],
  );

  const navigateTo = useCallback(
    (path: string) => {
      navigateInActiveTab(path);
    },
    [navigateInActiveTab],
  );

  const preventDefault = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
  }, []);

  return {
    goBack,
    goHome,
    navigate,
    navigateTo,
    preventDefault,
    switchTab,
    navigateInActiveTab,
    navigateInTab,
    goBackInActiveTab,
  };
}
