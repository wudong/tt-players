import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import './app-shell.css';
import { H2HTabContent } from './H2HTabContent';
import { LeaguesTabContent } from './LeaguesTabContent';
import { TabFooterBar } from './TabFooterBar';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { useTabNavigation, type AppTabId } from './navigation/tab-navigation';
import { useLeadersQuery, useLeaguesQuery, usePlayerSearchQuery } from './queries';

type MenuId = 'menu-main' | 'menu-share' | 'menu-colors' | 'menu-leagues';
type MenuPlacement = 'left' | 'right' | 'top' | 'bottom';
type MenuEffect = 'none' | 'menu-push' | 'menu-parallax';
type HighlightName =
  | 'blue'
  | 'red'
  | 'orange'
  | 'green'
  | 'yellow'
  | 'dark'
  | 'gray'
  | 'teal'
  | 'magenta'
  | 'brown';
type GradientName = 'default' | 'ocean' | 'sunset' | 'forest' | 'midnight';

type MenuConfig = {
  effect: MenuEffect;
  height?: number;
  id: MenuId;
  placement: MenuPlacement;
  width?: number;
};

type PlayerSearchItem = {
  id: string;
  name: string;
  played: number;
  wins: number;
};

const tabTitles: Record<AppTabId, string> = {
  players: 'Players',
  leagues: 'Leagues',
  h2h: 'Head to Head',
};

const menuConfigs: Record<MenuId, MenuConfig> = {
  'menu-colors': { id: 'menu-colors', placement: 'bottom', height: 520, effect: 'none' },
  'menu-leagues': { id: 'menu-leagues', placement: 'bottom', width: 350, height: 520, effect: 'none' },
  'menu-main': { id: 'menu-main', placement: 'left', width: 280, effect: 'none' },
  'menu-share': { id: 'menu-share', placement: 'bottom', height: 370, effect: 'none' },
};

const highlightOptions: { label: string; value: HighlightName }[] = [
  { label: 'Blue', value: 'blue' },
  { label: 'Red', value: 'red' },
  { label: 'Orange', value: 'orange' },
  { label: 'Green', value: 'green' },
  { label: 'Yellow', value: 'yellow' },
  { label: 'Dark', value: 'dark' },
  { label: 'Gray', value: 'gray' },
  { label: 'Teal', value: 'teal' },
  { label: 'Plum', value: 'magenta' },
  { label: 'Brown', value: 'brown' },
];

const gradientOptions: { label: string; value: GradientName; iconClass: string }[] = [
  { label: 'Default', value: 'default', iconClass: 'gradient-gray' },
  { label: 'Ocean', value: 'ocean', iconClass: 'gradient-blue' },
  { label: 'Sunset', value: 'sunset', iconClass: 'gradient-orange' },
  { label: 'Forest', value: 'forest', iconClass: 'gradient-green' },
  { label: 'Midnight', value: 'midnight', iconClass: 'gradient-dark' },
];

const HEADER_SWITCH_SCROLL = 40;
const SEARCH_DEBOUNCE_MS = 250;
const TOP_PLAYERS_LIMIT = 12;
const TOP_PLAYERS_MIN_PLAYED = 3;

const THEME_STORAGE_KEY = 'TTPlayers-Theme';
const HIGHLIGHT_STORAGE_KEY = 'TTPlayers-Highlight';
const GRADIENT_STORAGE_KEY = 'TTPlayers-Gradient';
const FAVOURITES_STORAGE_KEY = 'tt_players_favourite_players';
const FAVOURITES_UPDATED_EVENT = 'tt_players_favourite_players_updated';
const LEAGUES_STORAGE_KEY = 'tt_players_selected_league_ids';

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return (parts[0] ?? 'P').slice(0, 2).toUpperCase();
}

function getWinRate(player: Pick<PlayerSearchItem, 'wins' | 'played'>): number {
  if (player.played <= 0) return 0;
  return Math.round((player.wins / player.played) * 100);
}

function isValidFavouritePlayer(value: unknown): value is PlayerSearchItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string'
    && typeof item.name === 'string'
    && typeof item.played === 'number'
    && typeof item.wins === 'number';
}

function parseStoredFavouritePlayers(): PlayerSearchItem[] {
  try {
    const raw = localStorage.getItem(FAVOURITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidFavouritePlayer);
  } catch {
    return [];
  }
}

function parseStoredLeagueIds(): string[] {
  try {
    const raw = localStorage.getItem(LEAGUES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function persistFavouritePlayers(players: PlayerSearchItem[]) {
  localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(players));
  window.dispatchEvent(new Event(FAVOURITES_UPDATED_EVENT));
}

function App() {
  const { activeTab, handleSystemBack, navigateInActiveTab, switchTab } = useTabNavigation();
  const [activeGradient, setActiveGradient] = useState<GradientName>('default');
  const [activeHighlight, setActiveHighlight] = useState<HighlightName>('red');
  const [activeMenuId, setActiveMenuId] = useState<MenuId | null>(null);
  const [favouritePlayers, setFavouritePlayers] = useState<PlayerSearchItem[]>(() => parseStoredFavouritePlayers());
  const [isBooting, setIsBooting] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLeagueSelectionReady, setIsLeagueSelectionReady] = useState(false);
  const [leagueQuery, setLeagueQuery] = useState('');
  const [playersListTab, setPlayersListTab] = useState<'top' | 'trending'>('top');
  const [query, setQuery] = useState('');
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<string[]>([]);

  const headerRef = useRef<HTMLElement | null>(null);
  const pageTitleRef = useRef<HTMLDivElement | null>(null);

  const normalizedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const normalizedDebouncedQuery = debouncedQuery.trim();
  const normalizedLeagueQuery = leagueQuery.trim().toLowerCase();
  const leaguesQuery = useLeaguesQuery();
  const allLeagues = useMemo(
    () => (Array.isArray(leaguesQuery.data?.data) ? leaguesQuery.data.data : []),
    [leaguesQuery.data],
  );
  const isLeaguesLoading = leaguesQuery.isLoading;
  const leaguesError = leaguesQuery.error instanceof Error ? leaguesQuery.error.message : null;
  const hasSelectedLeagues = selectedLeagueIds.length > 0;
  const selectedLeagueNames = useMemo(() => {
    if (selectedLeagueIds.length === 0) return [];
    const leagueNameById = new Map(allLeagues.map((league) => [league.id, league.name]));
    return selectedLeagueIds
      .map((leagueId) => leagueNameById.get(leagueId))
      .filter((name): name is string => Boolean(name));
  }, [allLeagues, selectedLeagueIds]);
  const searchScopeLabel = useMemo(() => {
    if (selectedLeagueIds.length === 0) return 'All leagues';
    if (selectedLeagueNames.length === 0) return `${selectedLeagueIds.length} selected`;
    if (selectedLeagueNames.length <= 2) return selectedLeagueNames.join(', ');
    return `${selectedLeagueNames.slice(0, 2).join(', ')} +${selectedLeagueNames.length - 2} more`;
  }, [selectedLeagueIds.length, selectedLeagueNames]);
  const filteredLeagues = useMemo(() => {
    if (normalizedLeagueQuery.length === 0) return allLeagues;
    return allLeagues.filter((league) => league.name.toLowerCase().includes(normalizedLeagueQuery));
  }, [allLeagues, normalizedLeagueQuery]);
  const isSearchMode = normalizedQuery.length > 2;
  const isShortSearchQuery = normalizedQuery.length > 0 && normalizedQuery.length <= 2;
  const shouldFetchPlayers = activeTab === 'players'
    && isLeagueSelectionReady
    && (normalizedDebouncedQuery.length === 0 || normalizedDebouncedQuery.length > 2);
  const playersSearchQuery = usePlayerSearchQuery(normalizedDebouncedQuery, selectedLeagueIds, {
    enabled: shouldFetchPlayers,
    allLeaguesCount: allLeagues.length,
  });
  const topPlayersQuery = useLeadersQuery({
    mode: 'combined',
    leagueIds: selectedLeagueIds,
    limit: TOP_PLAYERS_LIMIT,
    minPlayed: TOP_PLAYERS_MIN_PLAYED,
    enabled: activeTab === 'players' && isLeagueSelectionReady,
  });
  const searchResults = playersSearchQuery.data?.data ?? [];
  const topPlayers = topPlayersQuery.data?.data ?? [];
  const topPlayersFormula = topPlayersQuery.data?.formula ?? null;
  const isSearchLoading = shouldFetchPlayers
    && (playersSearchQuery.isLoading || (playersSearchQuery.isFetching && !playersSearchQuery.data));
  const isTopPlayersLoading = topPlayersQuery.isLoading || (topPlayersQuery.isFetching && !topPlayersQuery.data);
  const searchError = playersSearchQuery.error instanceof Error ? playersSearchQuery.error.message : null;
  const topPlayersError = topPlayersQuery.error instanceof Error ? topPlayersQuery.error.message : null;
  const activeMenuConfig = activeMenuId ? menuConfigs[activeMenuId] : null;

  const wrapperTransform = useMemo(() => {
    if (!activeMenuConfig || activeMenuConfig.effect === 'none') {
      return undefined;
    }

    const multiplier = activeMenuConfig.effect === 'menu-push' ? 1 : 0.1;

    if (activeMenuConfig.placement === 'left') {
      return `translateX(${(activeMenuConfig.width ?? 0) * multiplier}px)`;
    }
    if (activeMenuConfig.placement === 'right') {
      return `translateX(-${(activeMenuConfig.width ?? 0) * multiplier}px)`;
    }
    if (activeMenuConfig.placement === 'top') {
      return `translateY(${(activeMenuConfig.height ?? 0) * multiplier}px)`;
    }

    return `translateY(-${(activeMenuConfig.height ?? 0) * multiplier}px)`;
  }, [activeMenuConfig]);

  const wrapperStyle: CSSProperties | undefined = wrapperTransform
    ? { transform: wrapperTransform }
    : undefined;

  const closeActiveMenu = () => setActiveMenuId(null);

  const onMenuTrigger =
    (menuId: MenuId) =>
    (event: MouseEvent<HTMLAnchorElement>): void => {
      event.preventDefault();
      setActiveMenuId(menuId);
    };

  const onCloseMenuClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
    closeActiveMenu();
  };

  const onFooterTabClick =
    (tabId: AppTabId) =>
    (event: MouseEvent<HTMLAnchorElement>): void => {
      event.preventDefault();
      closeActiveMenu();
      switchTab(tabId, 'root');
    };

  const onMenuTabClick =
    (tabId: AppTabId) =>
    (event: MouseEvent<HTMLAnchorElement>): void => {
      event.preventDefault();
      closeActiveMenu();
      switchTab(tabId, 'root');
    };

  const onSystemBackPressed = useCallback((): boolean => {
    if (activeMenuId) {
      closeActiveMenu();
      return true;
    }

    return handleSystemBack();
  }, [activeMenuId, handleSystemBack]);

  const activateDarkMode = () => {
    document.body.classList.add('theme-dark');
    document.body.classList.remove('theme-light', 'detect-theme');
    localStorage.setItem(THEME_STORAGE_KEY, 'dark-mode');
    setIsDarkMode(true);
  };

  const activateLightMode = () => {
    document.body.classList.add('theme-light');
    document.body.classList.remove('theme-dark', 'detect-theme');
    localStorage.setItem(THEME_STORAGE_KEY, 'light-mode');
    setIsDarkMode(false);
  };

  const applyHighlight = (highlight: HighlightName) => {
    const currentHighlightLinks = document.querySelectorAll('link.page-highlight');
    currentHighlightLinks.forEach((link) => link.remove());

    const highlightStylesheet = document.createElement('link');
    highlightStylesheet.rel = 'stylesheet';
    highlightStylesheet.className = 'page-highlight';
    highlightStylesheet.type = 'text/css';
    highlightStylesheet.href = `/appkit/styles/highlights/highlight_${highlight}.css`;
    document.head.appendChild(highlightStylesheet);

    document.body.setAttribute('data-highlight', `highlight-${highlight}`);
    localStorage.setItem(HIGHLIGHT_STORAGE_KEY, highlight);
    setActiveHighlight(highlight);
  };

  const applyGradient = (gradient: GradientName) => {
    document.body.setAttribute('data-gradient', `body-${gradient}`);
    localStorage.setItem(GRADIENT_STORAGE_KEY, gradient);
    setActiveGradient(gradient);
  };

  const toggleTheme = (event: MouseEvent<HTMLAnchorElement | HTMLInputElement>): void => {
    event.preventDefault();
    if (document.body.classList.contains('theme-dark')) {
      activateLightMode();
      return;
    }
    activateDarkMode();
  };

  const onSelectHighlight =
    (highlight: HighlightName) =>
    (event: MouseEvent<HTMLAnchorElement>): void => {
      event.preventDefault();
      applyHighlight(highlight);
    };

  const onSelectGradient =
    (gradient: GradientName) =>
    (event: MouseEvent<HTMLAnchorElement>): void => {
      event.preventDefault();
      applyGradient(gradient);
    };

  const isFavouritePlayer = (playerId: string) => (
    favouritePlayers.some((player) => player.id === playerId)
  );

  const toggleFavouritePlayer = (player: PlayerSearchItem) => {
    setFavouritePlayers((previous) => {
      const exists = previous.some((item) => item.id === player.id);
      const next = exists
        ? previous.filter((item) => item.id !== player.id)
        : [player, ...previous.filter((item) => item.id !== player.id)];
      persistFavouritePlayers(next);
      return next;
    });
  };

  const toggleLeagueSelection = (leagueId: string) => {
    setSelectedLeagueIds((previous) => (
      previous.includes(leagueId)
        ? previous.filter((id) => id !== leagueId)
        : [...previous, leagueId]
    ));
  };

  const onSelectAllLeagues = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setSelectedLeagueIds(allLeagues.map((league) => league.id));
  };

  const onClearLeagueSelection = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setSelectedLeagueIds([]);
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => setIsBooting(false), 350);
    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    const rememberedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (rememberedTheme === 'dark-mode') {
      activateDarkMode();
    } else {
      activateLightMode();
    }

    const rememberedHighlight = localStorage.getItem(HIGHLIGHT_STORAGE_KEY) as HighlightName | null;
    const validRememberedHighlight: HighlightName =
      rememberedHighlight && highlightOptions.some((option) => option.value === rememberedHighlight)
        ? rememberedHighlight
        : 'red';
    applyHighlight(validRememberedHighlight);

    const rememberedGradient = localStorage.getItem(GRADIENT_STORAGE_KEY) as GradientName | null;
    const validRememberedGradient: GradientName =
      rememberedGradient && gradientOptions.some((option) => option.value === rememberedGradient)
        ? rememberedGradient
        : 'default';
    applyGradient(validRememberedGradient);
  }, []);

  useEffect(() => {
    const syncFromStorage = () => {
      setFavouritePlayers(parseStoredFavouritePlayers());
    };

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener(FAVOURITES_UPDATED_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener(FAVOURITES_UPDATED_EVENT, syncFromStorage);
    };
  }, []);

  useEffect(() => {
    if (isLeaguesLoading) return;

    if (leaguesError) {
      setSelectedLeagueIds([]);
      setIsLeagueSelectionReady(true);
      return;
    }

    const validLeagueIds = new Set(allLeagues.map((league) => league.id));
    const storedSelection = parseStoredLeagueIds().filter((id) => validLeagueIds.has(id));

    setSelectedLeagueIds((previous) => {
      const validPrevious = previous.filter((id) => validLeagueIds.has(id));
      if (validPrevious.length > 0) {
        return validPrevious;
      }
      return storedSelection.length > 0
        ? storedSelection
        : allLeagues.map((league) => league.id);
    });

    setIsLeagueSelectionReady(true);
  }, [allLeagues, isLeaguesLoading, leaguesError]);

  useEffect(() => {
    if (!isLeagueSelectionReady) return;
    localStorage.setItem(LEAGUES_STORAGE_KEY, JSON.stringify(selectedLeagueIds));
  }, [isLeagueSelectionReady, selectedLeagueIds]);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

      if (headerRef.current) {
        if (scrollTop >= HEADER_SWITCH_SCROLL) {
          headerRef.current.classList.add('header-active');
        } else {
          headerRef.current.classList.remove('header-active');
        }
      }

      if (pageTitleRef.current) {
        pageTitleRef.current.style.opacity = scrollTop >= HEADER_SWITCH_SCROLL ? '0' : '1';
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeActiveMenu();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onBackButton = (event: Event) => {
      event.preventDefault();
      onSystemBackPressed();
    };

    document.addEventListener('backbutton', onBackButton, false);
    return () => document.removeEventListener('backbutton', onBackButton, false);
  }, [onSystemBackPressed]);

  useEffect(() => {
    type CapacitorListenerHandle = { remove: () => void };
    type CapacitorAppPlugin = {
      addListener?: (eventName: string, listenerFunc: () => void) => CapacitorListenerHandle | Promise<CapacitorListenerHandle>;
      exitApp?: () => void;
    };
    type CapacitorGlobal = {
      Capacitor?: {
        App?: CapacitorAppPlugin;
        Plugins?: { App?: CapacitorAppPlugin };
      };
    };

    const capacitorGlobal = window as Window & CapacitorGlobal;
    const appPlugin = capacitorGlobal.Capacitor?.Plugins?.App ?? capacitorGlobal.Capacitor?.App;
    if (!appPlugin?.addListener) return;

    let isActive = true;
    let listenerHandle: CapacitorListenerHandle | null = null;

    const handleBack = () => {
      const handled = onSystemBackPressed();
      if (!handled) {
        appPlugin.exitApp?.();
      }
    };

    Promise.resolve(appPlugin.addListener('backButton', handleBack))
      .then((handle) => {
        if (!isActive) {
          handle.remove();
          return;
        }
        listenerHandle = handle;
      })
      .catch(() => {
        // Ignore plugin binding issues when not running in a Capacitor container.
      });

    return () => {
      isActive = false;
      listenerHandle?.remove();
    };
  }, [onSystemBackPressed]);

  const pageHref = encodeURIComponent(window.location.href);
  const pageTitle = encodeURIComponent(document.title || 'TT Players');

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${pageHref}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${pageHref}`,
    mail: `mailto:?subject=${pageTitle}&body=${pageHref}`,
    twitter: `https://twitter.com/intent/tweet?url=${pageHref}&text=${pageTitle}`,
    whatsapp: `https://wa.me/?text=${pageTitle}%20${pageHref}`,
  };

  const listItems = normalizedQuery.length === 0 ? searchResults.slice(1) : searchResults;

  return (
    <>
      {isBooting ? (
        <div id="preloader">
          <div className="spinner-border color-highlight" role="status" />
        </div>
      ) : null}

      <div className={`menu-hider ${activeMenuId ? 'menu-active' : ''}`} onClick={closeActiveMenu} aria-hidden="true" />

      <div id="page" className="app-shell-page">
        <header ref={headerRef} style={wrapperStyle} className="header header-auto-show header-fixed header-logo-center">
          <a href="#" className="header-title" onClick={onFooterTabClick(activeTab)}>TT Players</a>
          <a href="#" className="header-icon header-icon-1" data-menu="menu-main" onClick={onMenuTrigger('menu-main')}>
            <i className="fas fa-bars" />
          </a>
          <a
            href="#"
            className="header-icon header-icon-2 tt-header-league-filter"
            data-menu="menu-leagues"
            onClick={onMenuTrigger('menu-leagues')}
            aria-label="Select leagues"
          >
            <i className="fas fa-filter" />
            <span className="tt-page-league-count">{hasSelectedLeagues ? selectedLeagueIds.length : 'All'}</span>
          </a>
          <a href="#" className="header-icon header-icon-3" data-menu="menu-share" onClick={onMenuTrigger('menu-share')}>
            <i className="fas fa-share-alt" />
          </a>
          <a href="#" className="header-icon header-icon-4 show-on-theme-dark" data-toggle-theme onClick={toggleTheme}>
            <i className="fas fa-sun" />
          </a>
          <a href="#" className="header-icon header-icon-4 show-on-theme-light" data-toggle-theme onClick={toggleTheme}>
            <i className="fas fa-moon" />
          </a>
        </header>

        <TabFooterBar reselectBehavior="root" />

        <div ref={pageTitleRef} className="page-title page-title-fixed">
          <h1>{tabTitles[activeTab]}</h1>
          <a href="#" className="page-title-icon shadow-xl bg-theme color-theme" data-menu="menu-share" onClick={onMenuTrigger('menu-share')}>
            <i className="fa fa-share-alt" />
          </a>
          <a
            href="#"
            className="page-title-icon shadow-xl bg-theme color-theme tt-page-league-filter"
            data-menu="menu-leagues"
            onClick={onMenuTrigger('menu-leagues')}
            aria-label="Select leagues"
          >
            <i className="fa fa-filter" />
            <span className="tt-page-league-count">{hasSelectedLeagues ? selectedLeagueIds.length : 'All'}</span>
          </a>
          <a href="#" className="page-title-icon shadow-xl bg-theme color-theme show-on-theme-light" data-toggle-theme onClick={toggleTheme}>
            <i className="fa fa-moon" />
          </a>
          <a href="#" className="page-title-icon shadow-xl bg-theme color-theme show-on-theme-dark" data-toggle-theme onClick={toggleTheme}>
            <i className="fa fa-lightbulb color-yellow-dark" />
          </a>
          <a href="#" className="page-title-icon shadow-xl bg-theme color-theme" data-menu="menu-main" onClick={onMenuTrigger('menu-main')}>
            <i className="fa fa-bars" />
          </a>
        </div>
        <div className="page-title-clear" />

        <main className="page-content mt-n1 app-shell-content" style={wrapperStyle}>
          {activeTab === 'players' ? (
            <>
              <div className="content mt-n4 mb-3">
                <div className="tt-search-toolbar mt-4">
                  <div className="search-box search-dark shadow-sm border-0 bg-theme rounded-sm bottom-0 mb-0">
                    <i className="fa fa-search ms-1" />
                    <input
                      type="text"
                      className="border-0"
                      placeholder="Search players..."
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>
                  <p className="tt-search-scope mb-0">
                    Search scope: <strong>{searchScopeLabel}</strong>
                  </p>
                </div>
              </div>

              {favouritePlayers.length > 0 ? (
            <div className="card card-style mt-2">
              <div className="content mb-0">
                <div className="d-flex mb-2">
                  <div className="align-self-center">
                    <h1 className="mb-0 font-16">Favourite Players</h1>
                  </div>
                  <div className="ms-auto align-self-center">
                    <span className="font-11 opacity-60">{favouritePlayers.length} saved</span>
                  </div>
                </div>
                <div className="favourites-scroll">
                  <div className="list-group list-custom-large tt-player-large-list">
                    {favouritePlayers.map((player) => (
                      <a
                        key={player.id}
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          navigateInActiveTab(`player/${player.id}`);
                        }}
                      >
                        <i className="tt-player-avatar bg-highlight color-white">{getInitials(player.name)}</i>
                        <span>{player.name}</span>
                        <strong>{getWinRate(player)}% WR • {player.played} matches</strong>
                        <span
                          className="badge bg-red-dark color-white tt-player-remove-badge"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleFavouritePlayer(player);
                          }}
                        >
                          REMOVE
                        </span>
                        <i className="fa fa-angle-right" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
              ) : null}

              {isSearchMode || isShortSearchQuery ? (
                <div className="card card-style mt-2">
                  <div className="content mb-0">
                    <div className="d-flex mb-2">
                      <div className="align-self-center">
                        <h1 className="mb-0 font-16">Search Results</h1>
                      </div>
                      <div className="ms-auto align-self-center">
                        <span className="font-11 opacity-60">{listItems.length} players</span>
                      </div>
                    </div>
                    {!isLeagueSelectionReady || isLeaguesLoading ? (
                      <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading leagues...</p>
                    ) : leaguesError ? (
                      <p className="mb-0 color-red-dark">Failed to load leagues: {leaguesError}</p>
                    ) : normalizedQuery.length > 0 && normalizedQuery.length <= 2 ? (
                      <p className="mb-0">Type at least 3 characters to search players.</p>
                    ) : isSearchLoading ? (
                      <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading players...</p>
                    ) : searchError ? (
                      <p className="mb-0 color-red-dark">Failed to load players: {searchError}</p>
                    ) : listItems.length === 0 ? (
                      <p className="mb-0">No players found matching "{normalizedQuery}"</p>
                    ) : (
                      <div className="list-group list-custom-large tt-player-large-list tt-player-search-list">
                        {listItems.map((player) => {
                          const isFavourite = isFavouritePlayer(player.id);
                          return (
                            <a
                              key={player.id}
                              href="#"
                              data-filter-item
                              onClick={(event) => {
                                event.preventDefault();
                                navigateInActiveTab(`player/${player.id}`);
                              }}
                            >
                              <i className="tt-player-avatar bg-highlight color-white">{getInitials(player.name)}</i>
                              <span>{player.name}</span>
                              <strong>{getWinRate(player)}% WR • {player.played} matches</strong>
                              <i
                                className={`fa fa-heart tt-player-favourite-icon ${isFavourite ? 'color-red-dark' : 'color-theme opacity-40'}`}
                                aria-label={isFavourite ? 'Remove favourite' : 'Add favourite'}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  toggleFavouritePlayer(player);
                                }}
                              />
                              <i className="fa fa-angle-right" />
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card card-style mt-2">
                  <div className="content mb-0">
                    <div className="tab-controls tabs-small tabs-rounded" data-highlight="bg-highlight">
                      <a
                        href="#"
                        className={playersListTab === 'top' ? 'bg-highlight color-white' : ''}
                        onClick={(event) => {
                          event.preventDefault();
                          setPlayersListTab('top');
                        }}
                      >
                        Top Players
                      </a>
                      <a
                        href="#"
                        className={playersListTab === 'trending' ? 'bg-highlight color-white' : ''}
                        onClick={(event) => {
                          event.preventDefault();
                          setPlayersListTab('trending');
                        }}
                      >
                        Trending Players
                      </a>
                    </div>
                    <div className="clearfix mb-3" />

                    {playersListTab === 'top' ? (
                      <>
                        {topPlayersFormula ? (
                          <p className="mt-n1 mb-2 font-11 opacity-60">{topPlayersFormula}</p>
                        ) : (
                          <p className="mt-n1 mb-2 font-11 opacity-60">Best win rate weighted by match volume.</p>
                        )}
                        {!isLeagueSelectionReady || isLeaguesLoading ? (
                          <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading leagues...</p>
                        ) : isTopPlayersLoading ? (
                          <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading top players...</p>
                        ) : topPlayersError ? (
                          <p className="mb-0 color-red-dark">Failed to load top players: {topPlayersError}</p>
                        ) : topPlayers.length === 0 ? (
                          <p className="mb-0">No top players available for the selected league scope.</p>
                        ) : (
                          <div className="list-group list-custom-large tt-player-large-list tt-top-players-list">
                            {topPlayers.map((player) => (
                              <a
                                key={player.player_id}
                                href="#"
                                onClick={(event) => {
                                  event.preventDefault();
                                  navigateInActiveTab(`player/${player.player_id}`);
                                }}
                              >
                                <i className="tt-player-avatar bg-highlight color-white">{player.rank}</i>
                                <span>{player.player_name}</span>
                                <strong>{player.wins}W-{player.losses}L • {player.played} played • {Math.round(player.win_rate)}% WR</strong>
                                <i className="fa fa-angle-right" />
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="mt-n1 mb-2 font-11 opacity-60">Most played in the last 100 days.</p>
                        {!isLeagueSelectionReady || isLeaguesLoading ? (
                          <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading leagues...</p>
                        ) : leaguesError ? (
                          <p className="mb-0 color-red-dark">Failed to load leagues: {leaguesError}</p>
                        ) : isSearchLoading ? (
                          <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading players...</p>
                        ) : searchError ? (
                          <p className="mb-0 color-red-dark">Failed to load players: {searchError}</p>
                        ) : listItems.length === 0 ? (
                          <p className="mb-0">No trending players available yet.</p>
                        ) : (
                          <div className="list-group list-custom-large tt-player-large-list tt-player-search-list">
                            {listItems.map((player) => {
                              const isFavourite = isFavouritePlayer(player.id);
                              return (
                                <a
                                  key={player.id}
                                  href="#"
                                  data-filter-item
                                  onClick={(event) => {
                                    event.preventDefault();
                                    navigateInActiveTab(`player/${player.id}`);
                                  }}
                                >
                                  <i className="tt-player-avatar bg-highlight color-white">{getInitials(player.name)}</i>
                                  <span>{player.name}</span>
                                  <strong>{getWinRate(player)}% WR • {player.played} matches</strong>
                                  <i
                                    className={`fa fa-heart tt-player-favourite-icon ${isFavourite ? 'color-red-dark' : 'color-theme opacity-40'}`}
                                    aria-label={isFavourite ? 'Remove favourite' : 'Add favourite'}
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      toggleFavouritePlayer(player);
                                    }}
                                  />
                                  <i className="fa fa-angle-right" />
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : null}

          {activeTab === 'leagues' ? (
            <LeaguesTabContent
              selectedLeagueIds={selectedLeagueIds}
            />
          ) : null}

          {activeTab === 'h2h' ? (
            <H2HTabContent
              selectedLeagueIds={selectedLeagueIds}
              onOpenPlayer={(playerId) => navigateInActiveTab(`player/${playerId}`)}
            />
          ) : null}
        </main>

        <div
          id="menu-main"
          className={`menu menu-box-left rounded-0 ${activeMenuId === 'menu-main' ? 'menu-active' : ''}`}
          data-menu-width={menuConfigs['menu-main'].width}
          style={{ width: menuConfigs['menu-main'].width }}
        >
          <div className="card rounded-0 bg-highlight" data-card-height="140">
            <div className="card-top">
              <a href="#" className="close-menu float-end me-2 text-center mt-3 icon-40 notch-clear" onClick={onCloseMenuClick}>
                <i className="fa fa-times color-white" />
              </a>
            </div>
            <div className="card-bottom">
              <h1 className="color-white ps-3 mb-n1 font-28">TT Players</h1>
              <p className="mb-2 ps-3 font-12 color-white opacity-50">League Hub</p>
            </div>
            <div className="card-overlay bg-gradient" />
          </div>

          <div className="mt-4" />
          <h6 className="menu-divider">Library</h6>
          <div className="list-group list-custom-small list-menu">
            <a href="#" onClick={onMenuTabClick('players')}>
              <i className="fa fa-user-friends gradient-magenta color-white" />
              <span>Players</span>
              <i className="fa fa-angle-right" />
            </a>
            <a href="#" onClick={onMenuTabClick('leagues')}>
              <i className="fa fa-table-tennis gradient-green color-white" />
              <span>Leagues</span>
              <i className="fa fa-angle-right" />
            </a>
            <a href="#" onClick={onMenuTabClick('h2h')}>
              <i className="fa fa-code-compare gradient-red color-white" />
              <span>Head to Head</span>
              <i className="fa fa-angle-right" />
            </a>
          </div>

          <h6 className="menu-divider mt-4">Settings</h6>
          <div className="list-group list-custom-small list-menu">
            <a href="#" data-menu="menu-colors" onClick={onMenuTrigger('menu-colors')}>
              <i className="fa fa-brush gradient-highlight color-white" />
              <span>Highlights</span>
              <i className="fa fa-angle-right" />
            </a>
            <a href="#" data-toggle-theme onClick={toggleTheme}>
              <i className="fa fa-moon gradient-dark color-white" />
              <span>Dark Mode</span>
              <div className="custom-control small-switch ios-switch">
                <input data-toggle-theme type="checkbox" className="ios-input" id="toggle-dark-menu" checked={isDarkMode} readOnly />
                <label className="custom-control-label" htmlFor="toggle-dark-menu" />
              </div>
            </a>
          </div>
        </div>

        <div
          id="menu-share"
          className={`menu menu-box-bottom rounded-m ${activeMenuId === 'menu-share' ? 'menu-active' : ''}`}
          data-menu-height={menuConfigs['menu-share'].height}
          style={{ height: menuConfigs['menu-share'].height }}
        >
          <div className="menu-title">
            <p className="color-highlight">Tap a link to</p>
            <h1>Share</h1>
            <a href="#" className="close-menu" onClick={onCloseMenuClick}><i className="fa fa-times-circle" /></a>
          </div>
          <div className="divider divider-margins mt-3 mb-0" />
          <div className="content mt-0">
            <div className="list-group list-custom-small list-icon-0">
              <a className="external-link" href={shareLinks.facebook} target="_blank" rel="noreferrer" onClick={onCloseMenuClick}>
                <i className="fab fa-facebook-f font-12 bg-facebook color-white shadow-l rounded-s" />
                <span>Facebook</span>
                <i className="fa fa-angle-right pr-1" />
              </a>
              <a className="external-link" href={shareLinks.twitter} target="_blank" rel="noreferrer" onClick={onCloseMenuClick}>
                <i className="fab fa-twitter font-12 bg-twitter color-white shadow-l rounded-s" />
                <span>Twitter</span>
                <i className="fa fa-angle-right pr-1" />
              </a>
              <a className="external-link" href={shareLinks.linkedin} target="_blank" rel="noreferrer" onClick={onCloseMenuClick}>
                <i className="fab fa-linkedin-in font-12 bg-linkedin color-white shadow-l rounded-s" />
                <span>LinkedIn</span>
                <i className="fa fa-angle-right pr-1" />
              </a>
              <a className="external-link" href={shareLinks.whatsapp} target="_blank" rel="noreferrer" onClick={onCloseMenuClick}>
                <i className="fab fa-whatsapp font-12 bg-whatsapp color-white shadow-l rounded-s" />
                <span>WhatsApp</span>
                <i className="fa fa-angle-right pr-1" />
              </a>
              <a className="external-link border-0" href={shareLinks.mail} onClick={onCloseMenuClick}>
                <i className="fa fa-envelope font-12 bg-mail color-white shadow-l rounded-s" />
                <span>Email</span>
                <i className="fa fa-angle-right pr-1" />
              </a>
            </div>
          </div>
        </div>

        <div
          id="menu-leagues"
          className={`menu menu-box-modal rounded-m ${activeMenuId === 'menu-leagues' ? 'menu-active' : ''}`}
          data-menu-height={menuConfigs['menu-leagues'].height}
          data-menu-width={menuConfigs['menu-leagues'].width}
          style={{ height: menuConfigs['menu-leagues'].height, width: menuConfigs['menu-leagues'].width }}
        >
          <div className="menu-title">
            <p className="color-highlight">Filter player stats by</p>
            <h1 className="font-24">Select Leagues</h1>
            <a href="#" className="close-menu" onClick={onCloseMenuClick}><i className="fa fa-times-circle" /></a>
          </div>
          <div className="divider divider-margins mt-2 mb-0" />

          <div className="content mt-2 mb-0">
            <div className="search-box search-dark shadow-xs border-0 bg-theme rounded-sm mb-2">
              <i className="fa fa-search ms-1" />
              <input
                type="text"
                className="border-0"
                placeholder="Search leagues..."
                value={leagueQuery}
                onChange={(event) => setLeagueQuery(event.target.value)}
              />
            </div>

            <div className="d-flex mb-2">
              <p className="font-11 opacity-60 mb-0 align-self-center">
                {selectedLeagueIds.length} of {allLeagues.length} selected
              </p>
              <a href="#" className="ms-auto font-11 color-highlight text-uppercase me-2" onClick={onSelectAllLeagues}>All</a>
              <a href="#" className="font-11 color-red-dark text-uppercase" onClick={onClearLeagueSelection}>Clear</a>
            </div>

            <div className="tt-league-modal-list">
              {!isLeagueSelectionReady || isLeaguesLoading ? (
                <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading leagues...</p>
              ) : leaguesError ? (
                <p className="mb-0 color-red-dark">Failed to load leagues: {leaguesError}</p>
              ) : filteredLeagues.length === 0 ? (
                <p className="mb-0">No leagues matched your search.</p>
              ) : (
                <div className="list-group list-custom-small tt-league-selector-list">
                  {filteredLeagues.map((league) => {
                    const isSelected = selectedLeagueIds.includes(league.id);
                    return (
                      <a
                        key={league.id}
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          toggleLeagueSelection(league.id);
                        }}
                      >
                        <i className={`fa ${isSelected ? 'fa-check-circle color-green-dark' : 'fa-circle color-gray-dark'}`} />
                        <span>{league.name}</span>
                        <span className={`badge ${isSelected ? 'bg-green-dark' : 'bg-gray-dark'} color-white font-10`}>
                          {league.divisions.length} Div
                        </span>
                        <i className="fa fa-angle-right" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        <div
          id="menu-colors"
          className={`menu menu-box-bottom rounded-m ${activeMenuId === 'menu-colors' ? 'menu-active' : ''}`}
          data-menu-height={menuConfigs['menu-colors'].height}
          style={{ height: menuConfigs['menu-colors'].height }}
        >
          <div className="menu-title">
            <p className="color-highlight font-600">Choose your Favorite</p>
            <h1>Highlight</h1>
            <a href="#" className="close-menu" onClick={onCloseMenuClick}><i className="fa fa-times-circle" /></a>
          </div>

          <div className="divider divider-margins mt-3 mb-2" />
          <div className="content mt-0 ms-0 me-0">
            <div className="row mb-0">
              <div className="col-6">
                <div className="list-group list-custom-small list-menu">
                  {highlightOptions.slice(0, 5).map((option) => (
                    <a
                      key={option.value}
                      href="#"
                      data-change-highlight={option.value}
                      onClick={onSelectHighlight(option.value)}
                      className={activeHighlight === option.value ? 'highlight-active' : undefined}
                    >
                      <i className={`gradient-${option.value} color-white`} />
                      <span>{option.label}</span>
                    </a>
                  ))}
                </div>
              </div>
              <div className="col-6">
                <div className="list-group list-custom-small list-menu">
                  {highlightOptions.slice(5).map((option) => (
                    <a
                      key={option.value}
                      href="#"
                      data-change-highlight={option.value}
                      onClick={onSelectHighlight(option.value)}
                      className={activeHighlight === option.value ? 'highlight-active' : undefined}
                    >
                      <i className={`gradient-${option.value} color-white`} />
                      <span>{option.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="divider divider-margins mt-2 mb-2" />
          <div className="content mt-0 ms-0 me-0">
            <h6 className="menu-divider mb-2">Background</h6>
            <div className="list-group list-custom-small list-menu">
              {gradientOptions.map((option) => (
                <a
                  key={option.value}
                  href="#"
                  data-change-background={option.value}
                  onClick={onSelectGradient(option.value)}
                  className={activeGradient === option.value ? 'highlight-active' : undefined}
                >
                  <i className={`${option.iconClass} color-white`} />
                  <span>{option.label}</span>
                  <i className="fa fa-angle-right" />
                </a>
              ))}
            </div>
          </div>

          <a href="#" className="close-menu btn btn-margins btn-m font-13 rounded-s shadow-xl btn-full gradient-highlight border-0 font-700 text-uppercase" onClick={onCloseMenuClick}>
            Awesome
          </a>
        </div>
      </div>
    </>
  );
}

export default App;
