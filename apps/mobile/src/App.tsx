import { useEffect, useRef, useState } from 'react';
import './app-shell.css';

type FooterTab = {
  id: string;
  label: string;
  iconClassName: string;
  active?: boolean;
  circle?: boolean;
};

const footerTabs: FooterTab[] = [
  { id: 'dashboard', label: 'Dashboard', iconClassName: 'fa fa-chart-line', active: true },
  { id: 'leagues', label: 'Leagues', iconClassName: 'fa fa-table-tennis' },
  { id: 'players', label: 'Players', iconClassName: 'fa fa-user-friends' },
  { id: 'menu', label: 'Menu', iconClassName: 'fa fa-bars' },
];

const skeletonCards = Array.from({ length: 6 }, (_, index) => index + 1);
const HEADER_SWITCH_SCROLL = 40;
const THEME_STORAGE_KEY = 'TTPlayers-Theme';

function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const pageTitleRef = useRef<HTMLDivElement | null>(null);

  const closeMainMenu = () => setIsMainMenuOpen(false);

  const openMainMenu = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setIsMainMenuOpen(true);
  };

  const handleDummyLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
  };

  const handleMenuItemClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    closeMainMenu();
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

  const toggleTheme = (event: React.MouseEvent<HTMLAnchorElement | HTMLInputElement>) => {
    event.preventDefault();
    if (document.body.classList.contains('theme-dark')) {
      activateLightMode();
      return;
    }
    activateDarkMode();
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => setIsBooting(false), 350);
    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    const rememberedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (rememberedTheme === 'dark-mode') {
      activateDarkMode();
      return;
    }
    if (rememberedTheme === 'light-mode') {
      activateLightMode();
      return;
    }
    activateLightMode();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

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
        closeMainMenu();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      {isBooting ? (
        <div id="preloader">
          <div className="spinner-border color-highlight" role="status" />
        </div>
      ) : null}

      <div
        className={`menu-hider ${isMainMenuOpen ? 'menu-active' : ''}`}
        onClick={closeMainMenu}
        aria-hidden="true"
      />

      <div id="page" className="app-shell-page">
        <header ref={headerRef} className="header header-auto-show header-fixed header-logo-center">
          <a href="#" className="header-title" onClick={handleDummyLinkClick}>
            TT Players
          </a>
          <a href="#" className="header-icon header-icon-1" data-menu="menu-main" onClick={openMainMenu}>
            <i className="fas fa-bars" />
          </a>
          <a href="#" className="header-icon header-icon-3" onClick={handleDummyLinkClick}>
            <i className="fas fa-share-alt" />
          </a>
          <a
            href="#"
            className="header-icon header-icon-4 show-on-theme-dark"
            data-toggle-theme
            onClick={toggleTheme}
          >
            <i className="fas fa-sun" />
          </a>
          <a
            href="#"
            className="header-icon header-icon-4 show-on-theme-light"
            data-toggle-theme
            onClick={toggleTheme}
          >
            <i className="fas fa-moon" />
          </a>
        </header>

        <nav id="footer-bar" className="footer-bar-6">
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
                onClick={isMenuTab ? openMainMenu : handleDummyLinkClick}
              >
                <i className={tab.iconClassName} />
                <span>{tab.label}</span>
              </a>
            );
          })}
        </nav>

        <div ref={pageTitleRef} className="page-title page-title-fixed">
          <h1>TT Players</h1>
          <a href="#" className="page-title-icon shadow-xl bg-theme color-theme" onClick={handleDummyLinkClick}>
            <i className="fa fa-share-alt" />
          </a>
          <a
            href="#"
            className="page-title-icon shadow-xl bg-theme color-theme show-on-theme-light"
            data-toggle-theme
            onClick={toggleTheme}
          >
            <i className="fa fa-moon" />
          </a>
          <a
            href="#"
            className="page-title-icon shadow-xl bg-theme color-theme show-on-theme-dark"
            data-toggle-theme
            onClick={toggleTheme}
          >
            <i className="fa fa-lightbulb color-yellow-dark" />
          </a>
          <a href="#" className="page-title-icon shadow-xl bg-theme color-theme" data-menu="menu-main" onClick={openMainMenu}>
            <i className="fa fa-bars" />
          </a>
        </div>
        <div className="page-title-clear" />

        <main className="page-content app-shell-content">
          <section className="card card-style shadow-xl">
            <div className="content">
              <p className="color-highlight font-600 mb-n1">AppKit Starter Structure</p>
              <h1 className="font-700">Mobile App Shell</h1>
              <p className="mb-3">
                This screen follows the theme starter pattern: preloader, fixed header, footer bar,
                and page-content canvas.
              </p>
              <a
                href="#"
                className="btn btn-full bg-highlight rounded-sm text-uppercase font-700"
                onClick={handleDummyLinkClick}
              >
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
          className={`menu menu-box-left rounded-0 ${isMainMenuOpen ? 'menu-active' : ''}`}
          data-menu-width="280"
          style={{ width: 280 }}
        >
          <div className="card rounded-0 bg-highlight" data-card-height="140">
            <div className="card-top">
              <a
                href="#"
                className="close-menu float-end me-2 text-center mt-3 icon-40 notch-clear"
                onClick={handleMenuItemClick}
              >
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
            <a href="#" onClick={handleMenuItemClick}>
              <i className="fa fa-chart-line gradient-red color-white" />
              <span>Dashboard</span>
              <i className="fa fa-angle-right" />
            </a>
            <a href="#" onClick={handleMenuItemClick}>
              <i className="fa fa-table-tennis gradient-green color-white" />
              <span>Leagues</span>
              <i className="fa fa-angle-right" />
            </a>
            <a href="#" onClick={handleMenuItemClick}>
              <i className="fa fa-calendar-alt gradient-blue color-white" />
              <span>Fixtures</span>
              <i className="fa fa-angle-right" />
            </a>
            <a href="#" onClick={handleMenuItemClick}>
              <i className="fa fa-user-friends gradient-magenta color-white" />
              <span>Players</span>
              <i className="fa fa-angle-right" />
            </a>
          </div>

          <h6 className="menu-divider mt-4">Settings</h6>
          <div className="list-group list-custom-small list-menu">
            <a href="#" onClick={handleMenuItemClick}>
              <i className="fa fa-brush gradient-highlight color-white" />
              <span>Highlights</span>
              <i className="fa fa-angle-right" />
            </a>
            <a href="#" data-toggle-theme onClick={toggleTheme}>
              <i className="fa fa-moon gradient-dark color-white" />
              <span>Dark Mode</span>
              <div className="custom-control small-switch ios-switch">
                <input
                  data-toggle-theme
                  type="checkbox"
                  className="ios-input"
                  id="toggle-dark-menu"
                  checked={isDarkMode}
                  readOnly
                />
                <label className="custom-control-label" htmlFor="toggle-dark-menu" />
              </div>
            </a>
          </div>

          <h6 className="menu-divider font-10 mt-4">
            Built with <i className="fa fa-heart color-red-dark ps-1 pe-1" /> for TT Players
          </h6>
        </div>
        <div id="menu-share" className="menu menu-box-bottom rounded-m" data-menu-height="370" />
        <div id="menu-colors" className="menu menu-box-bottom rounded-m" data-menu-height="480" />
      </div>
    </>
  );
}

export default App;
