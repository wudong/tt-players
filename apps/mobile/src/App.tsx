import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import './app-shell.css';

type FooterTab = {
  id: string;
  label: string;
  iconClassName: string;
  active?: boolean;
  circle?: boolean;
};

type MenuId = 'menu-main' | 'menu-share' | 'menu-colors';
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

type PlayerSearchResponse = {
  data: PlayerSearchItem[];
};

const footerTabs: FooterTab[] = [
  { id: 'dashboard', label: 'Dashboard', iconClassName: 'fa fa-chart-line', active: true },
  { id: 'leagues', label: 'Leagues', iconClassName: 'fa fa-table-tennis' },
  { id: 'players', label: 'Players', iconClassName: 'fa fa-user-friends' },
  { id: 'menu', label: 'Menu', iconClassName: 'fa fa-bars' },
];

const menuConfigs: Record<MenuId, MenuConfig> = {
  'menu-colors': { id: 'menu-colors', placement: 'bottom', height: 520, effect: 'none' },
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
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

const THEME_STORAGE_KEY = 'TTPlayers-Theme';
const HIGHLIGHT_STORAGE_KEY = 'TTPlayers-Highlight';
const GRADIENT_STORAGE_KEY = 'TTPlayers-Gradient';
const FAVOURITES_STORAGE_KEY = 'tt_players_favourite_players';
const FAVOURITES_UPDATED_EVENT = 'tt_players_favourite_players_updated';

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

function persistFavouritePlayers(players: PlayerSearchItem[]) {
  localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(players));
  window.dispatchEvent(new Event(FAVOURITES_UPDATED_EVENT));
}

function App() {
  const [activeGradient, setActiveGradient] = useState<GradientName>('default');
  const [activeHighlight, setActiveHighlight] = useState<HighlightName>('red');
  const [activeMenuId, setActiveMenuId] = useState<MenuId | null>(null);
  const [favouritePlayers, setFavouritePlayers] = useState<PlayerSearchItem[]>(() => parseStoredFavouritePlayers());
  const [isBooting, setIsBooting] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PlayerSearchItem[]>([]);

  const headerRef = useRef<HTMLElement | null>(null);
  const pageTitleRef = useRef<HTMLDivElement | null>(null);

  const normalizedQuery = query.trim();
  const isSearchMode = normalizedQuery.length > 2;
  const shouldFetchPlayers = normalizedQuery.length === 0 || normalizedQuery.length > 2;
  const activeMenuConfig = activeMenuId ? menuConfigs[activeMenuId] : null;
  const trendingPlayer = normalizedQuery.length === 0 ? (searchResults[0] ?? null) : null;

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

  const onDummyLinkClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
  };

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
    if (!shouldFetchPlayers) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearchLoading(false);
      return;
    }

    const abortController = new AbortController();
    const timerId = window.setTimeout(async () => {
      try {
        setIsSearchLoading(true);
        setSearchError(null);

        const params = new URLSearchParams();
        if (normalizedQuery.length > 0) {
          params.set('q', normalizedQuery);
        }

        const path = params.size > 0
          ? `${API_BASE_URL}/players/search?${params.toString()}`
          : `${API_BASE_URL}/players/search`;

        const response = await fetch(path, { signal: abortController.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json() as PlayerSearchResponse;
        setSearchResults(payload.data ?? []);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        setSearchError((error as Error).message || 'Failed to search players');
      } finally {
        setIsSearchLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      abortController.abort();
      window.clearTimeout(timerId);
    };
  }, [normalizedQuery, shouldFetchPlayers]);

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
          <a href="#" className="header-title" onClick={onDummyLinkClick}>TT Players</a>
          <a href="#" className="header-icon header-icon-1" data-menu="menu-main" onClick={onMenuTrigger('menu-main')}>
            <i className="fas fa-bars" />
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

        <nav id="footer-bar" style={wrapperStyle} className="footer-bar-6">
          {footerTabs.map((tab) => {
            const classNames = [tab.active ? 'active-nav' : '', tab.circle ? 'circle-nav' : '']
              .filter(Boolean)
              .join(' ');
            const isMenuTab = tab.id === 'menu';

            return (
              <a
                key={tab.id}
                href="#"
                className={classNames}
                data-menu={isMenuTab ? 'menu-main' : undefined}
                onClick={isMenuTab ? onMenuTrigger('menu-main') : onDummyLinkClick}
              >
                <i className={tab.iconClassName} />
                <span>{tab.label}</span>
              </a>
            );
          })}
        </nav>

        <div ref={pageTitleRef} className="page-title page-title-fixed">
          <h1>Home</h1>
          <a href="#" className="page-title-icon shadow-xl bg-theme color-theme" data-menu="menu-share" onClick={onMenuTrigger('menu-share')}>
            <i className="fa fa-share-alt" />
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
          <div className="content mt-n4 mb-3">
            <div className="search-box search-dark shadow-sm border-0 mt-4 bg-theme rounded-sm bottom-0">
              <i className="fa fa-search ms-1" />
              <input
                type="text"
                className="border-0"
                placeholder="Search players..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
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
                          toggleFavouritePlayer(player);
                        }}
                      >
                        <i className="tt-player-avatar bg-highlight color-white">{getInitials(player.name)}</i>
                        <span>{player.name}</span>
                        <strong>{getWinRate(player)}% WR • {player.played} matches</strong>
                        <span className="badge bg-red-dark color-white">REMOVE</span>
                        <i className="fa fa-angle-right" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {trendingPlayer ? (
            <div className="card card-style tt-trending-card" data-card-height="210">
              <div className="card-top px-3 py-3">
                <span className="bg-white color-black rounded-sm btn btn-xs float-start font-700 font-12">Trending</span>
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    toggleFavouritePlayer(trendingPlayer);
                  }}
                  className="bg-white rounded-sm icon icon-xs float-end"
                >
                  <i className={`fa ${isFavouritePlayer(trendingPlayer.id) ? 'fa-heart color-red-dark' : 'fa-heart'} `} />
                </a>
              </div>
              <div className="card-bottom px-3 py-3">
                <h1 className="color-white mb-1">{trendingPlayer.name}</h1>
                <p className="color-white opacity-80 mb-0">
                  {getWinRate(trendingPlayer)}% win rate • {trendingPlayer.played} matches played
                </p>
              </div>
              <div className="card-overlay bg-gradient opacity-30" />
              <div className="card-overlay bg-gradient" />
            </div>
          ) : null}

          <div className="card card-style mt-2">
            <div className="content mb-0">
              <div className="d-flex mb-2">
                <div className="align-self-center">
                  <h1 className="mb-0 font-16">{isSearchMode ? 'Search Results' : 'Trending Players'}</h1>
                </div>
                <div className="ms-auto align-self-center">
                  <span className="font-11 opacity-60">{listItems.length} players</span>
                </div>
              </div>
              {normalizedQuery.length === 0 ? (
                <p className="mt-n1 mb-2 font-11 opacity-60">Most played in the last 100 days</p>
              ) : null}
              {normalizedQuery.length > 0 && normalizedQuery.length <= 2 ? (
                <p className="mb-0">Type at least 3 characters to search players.</p>
              ) : isSearchLoading ? (
                <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading players...</p>
              ) : searchError ? (
                <p className="mb-0 color-red-dark">Failed to load players: {searchError}</p>
              ) : listItems.length === 0 ? (
                <p className="mb-0">{isSearchMode ? `No players found matching "${normalizedQuery}"` : 'No trending players available yet.'}</p>
              ) : (
                <div className="list-group list-custom-large tt-player-large-list tt-player-search-list">
                  {listItems.map((player) => {
                    const isFavourite = isFavouritePlayer(player.id);
                    return (
                      <a
                        key={player.id}
                        href="#"
                        data-filter-item
                        onClick={onDummyLinkClick}
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
            <a href="#" onClick={onCloseMenuClick}>
              <i className="fa fa-chart-line gradient-red color-white" />
              <span>Home</span>
              <i className="fa fa-angle-right" />
            </a>
            <a href="#" onClick={onCloseMenuClick}>
              <i className="fa fa-table-tennis gradient-green color-white" />
              <span>Leagues</span>
              <i className="fa fa-angle-right" />
            </a>
            <a href="#" onClick={onCloseMenuClick}>
              <i className="fa fa-user-friends gradient-magenta color-white" />
              <span>Players</span>
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
