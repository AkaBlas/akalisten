/**
 * Mapping von Theme-Namen zu Bootstrap-Icon-Klassen.
 */
const iconClassMap = {
    light: 'bi-sun-fill',
    dark: 'bi-moon-stars-fill',
    auto: 'bi-circle-half'
};

/**
 * Holt das gespeicherte Theme aus localStorage.
 * @returns {string|null}
 */
const getStoredTheme = () => localStorage.getItem('theme');

/**
 * Speichert das Theme in localStorage.
 * @param {string} theme
 */
const setStoredTheme = theme => localStorage.setItem('theme', theme);

/**
 * Ermittelt das bevorzugte Theme des Nutzers.
 * @returns {string}
 */
const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme) return storedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * Setzt das Theme für die Seite.
 * @param {string} theme
 */
const setTheme = theme => {
    const html = document.documentElement;
    const effectiveTheme = theme === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
    document.documentElement.setAttribute('data-bs-theme', effectiveTheme);
    html.classList.toggle('dark', effectiveTheme === 'dark');
};

/**
 * Zeigt das aktuell aktive Theme im Theme-Switcher an.
 * @param {string} theme
 * @param {boolean} [focus=false]
 */
const showActiveTheme = (theme, focus = false) => {
    const themeSwitcher = document.querySelector('#bd-theme');
    if (!themeSwitcher) return;

    const themeSwitcherText = document.querySelector('#bd-theme-text');
    const activeThemeIcon = document.querySelector('.theme-icon-active');
    const btnToActive = document.querySelector(`[data-bs-theme-value="${theme}"]`);

    if (activeThemeIcon && iconClassMap[theme]) {
        activeThemeIcon.className = `bi ${iconClassMap[theme]} theme-icon-active`;
    }

    document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
        element.classList.toggle('active', element === btnToActive);
        element.setAttribute('aria-pressed', element === btnToActive ? 'true' : 'false');
    });

    if (themeSwitcherText && btnToActive) {
        themeSwitcher.setAttribute(
            'aria-label',
            `${themeSwitcherText.textContent} (${btnToActive.dataset.bsThemeValue})`
        );
    }

    if (focus) themeSwitcher.focus();
};

/**
 * Initialisiert den Theme-Picker und die zugehörigen Event Listener.
 * Event Listener:
 * - click auf Theme-Buttons: Theme wird umgestellt und gespeichert
 * - change auf Media Query: Theme wird automatisch angepasst
 */
const setupThemePicker = () => {
    setTheme(getPreferredTheme());

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const storedTheme = getStoredTheme();
        if (storedTheme !== 'light' && storedTheme !== 'dark') {
            setTheme(getPreferredTheme());
            showActiveTheme(getPreferredTheme());
        }
    });

    window.addEventListener('DOMContentLoaded', () => {
        showActiveTheme(getPreferredTheme());
        document.querySelectorAll('[data-bs-theme-value]').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const theme = toggle.getAttribute('data-bs-theme-value');
                setStoredTheme(theme);
                setTheme(theme);
                showActiveTheme(theme, true);
            });
        });
    });
};

setupThemePicker();

/**
 * Initialisiert das Verhalten der Navbar (Höhe, Scroll-Verhalten, Tooltips).
 * Event Listener:
 * - scroll: Navbar zeigt Scrollrichtung an
 * - resize/load: Navbar-Höhe wird aktualisiert
 * - Tooltip-Initialisierung für alle Elemente mit data-bs-toggle="tooltip"
 */
document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const updateHeaderHeight = () => {
        document.documentElement.style.setProperty('--header-height', `${navbar.offsetHeight}px`);
    };

    window.addEventListener('load', updateHeaderHeight);
    window.addEventListener('resize', updateHeaderHeight);

    const header = document.querySelector('header');
    if (header) {
        const resizeObserver = new ResizeObserver(updateHeaderHeight);
        resizeObserver.observe(header);
    }

    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollingUp = scrollTop < lastScrollTop;
        const scrollingDown = scrollTop > lastScrollTop;
        const isAtTop = scrollTop === 0;

        navbar.classList.toggle('scroll-down', scrollingDown);
        navbar.classList.toggle('scroll-up', scrollingUp && !isAtTop);

        lastScrollTop = scrollTop;
    });

    let tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });
});