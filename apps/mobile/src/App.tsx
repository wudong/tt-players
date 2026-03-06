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

const skeletonCards = Array.from({ length: 6 }, (_, index) => index + 1);
const HEADER_SWITCH_SCROLL = 40;
const THEME_STORAGE_KEY = 'TTPlayers-Theme';
const HIGHLIGHT_STORAGE_KEY = 'TTPlayers-Highlight';
const GRADIENT_STORAGE_KEY = 'TTPlayers-Gradient';

function App() {
  const [activeGradient, setActiveGradient] = useState<GradientName>('default');
  const [activeHighlight, setActiveHighlight] = useState<HighlightName>('red');
  const [activeMenuId, setActiveMenuId] = useState<MenuId | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const pageTitleRef = useRef<HTMLDivElement | null>(null);

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
    const onScroll = () => {
      const scrollTop =
        window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

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

  return (
    <>
      {isBooting ? (
        <div id="preloader">
          <div className="spinner-border color-highlight" role="status" />
        </div>
      ) : null}

      <div
        className={`menu-hider ${activeMenuId ? 'menu-active' : ''}`}
        onClick={closeActiveMenu}
        aria-hidden="true"
      />

      <div id="page" className="app-shell-page">
        <header
          ref={headerRef}
          style={wrapperStyle}
          className="header header-auto-show header-fixed header-logo-center"
        >
          <a href="#" className="header-title" onClick={onDummyLinkClick}>
            TT Players
          </a>
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
          <h1>TT Players</h1>
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

        <main className="page-content app-shell-content" style={wrapperStyle}>
          <section className="card card-style shadow-xl">
            <div className="content">
              <p className="color-highlight font-600 mb-n1">AppKit Starter Structure</p>
              <h1 className="font-700">Mobile App Shell</h1>
              <p className="mb-3">
                This screen follows the theme starter pattern: preloader, fixed header, footer bar,
                and page-content canvas.
              </p>
              <a href="#" className="btn btn-full bg-highlight rounded-sm text-uppercase font-700" onClick={onDummyLinkClick}>
                Connect API Next
              </a>
            </div>
          </section>

          <section className="card card-style">
            <div className="content">
              <p className="font-600 mb-2">Skeleton Blocks</p>
              <div className="app-skeleton-row" />
              <div className="app-skeleton-row" />
              <div className="app-skeleton-row app-skeleton-short" />
            </div>
          </section>

          <section className="card card-style">
            <div className="content mb-0">
              <div className="d-flex">
                <div className="me-3">
                  <span className="icon icon-m rounded-xl bg-highlight color-white">
                    <i className="fa fa-table-tennis" />
                  </span>
                </div>
                <div>
                  <h4 className="mb-1">Ready for Feature Pages</h4>
                  <p className="mb-0">
                    Add routes for leagues, fixtures, players, and insights in this shell.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {skeletonCards.map((item) => (
            <section key={item} className="card card-style">
              <div className="content">
                <p className="font-600 mb-2">Upcoming Fixture Block {item}</p>
                <div className="app-skeleton-row" />
                <div className="app-skeleton-row" />
                <div className="app-skeleton-row app-skeleton-short" />
              </div>
            </section>
          ))}
        </main>

        <div
          id="menu-main"
          className={`menu menu-box-left rounded-0 ${activeMenuId === 'menu-main' ? 'menu-active' : ''}`}
          data-menu-width={menuConfigs['menu-main'].width}
          data-menu-effect={menuConfigs['menu-main'].effect === 'none' ? undefined : menuConfigs['menu-main'].effect}
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
              <span>Dashboard</span>
              <i className="fa fa-angle-right" />
            </a>
            <a href="#" onClick={onCloseMenuClick}>
              <i className="fa fa-table-tennis gradient-green color-white" />
              <span>Leagues</span>
              <i className="fa fa-angle-right" />
            </a>
            <a href="#" onClick={onCloseMenuClick}>
              <i className="fa fa-calendar-alt gradient-blue color-white" />
              <span>Fixtures</span>
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

          <h6 className="menu-divider font-10 mt-4">
            Built with <i className="fa fa-heart color-red-dark ps-1 pe-1" /> for TT Players
          </h6>
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
            <a href="#" className="close-menu" onClick={onCloseMenuClick}>
              <i className="fa fa-times-circle" />
            </a>
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
            <a href="#" className="close-menu" onClick={onCloseMenuClick}>
              <i className="fa fa-times-circle" />
            </a>
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

          <a
            href="#"
            className="close-menu btn btn-margins btn-m font-13 rounded-s shadow-xl btn-full gradient-highlight border-0 font-700 text-uppercase"
            onClick={onCloseMenuClick}
          >
            Awesome
          </a>
        </div>
      </div>
    </>
  );
}

export default App;
