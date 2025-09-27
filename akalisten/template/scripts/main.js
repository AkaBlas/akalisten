/**
 * Initialisiert die Hauptlogik der Seite nach DOM-Load.
 * Setzt alle Manager auf, richtet Event Listener ein und synchronisiert die Anzeige.
 * Event Listener:
 * - DOMContentLoaded: Startet die Initialisierung der Muckenlisten, Filter, Kategorien und User-Highlighting.
 */
document.addEventListener('DOMContentLoaded', () => {
    const storageManager = new StorageManager();
    const muckenlistenManager = new MuckenlistenManager(storageManager);
    muckenlistenManager.init();
    const filterManager = new FilterManager(muckenlistenManager, storageManager);
    const categoryManager = new CategoryManager(muckenlistenManager, storageManager);
    const userHighlightManager = new UserHighlightManager(muckenlistenManager, categoryManager, storageManager);
    const accordionManager = new AccordionManager(storageManager);
    accordionManager.init();
    const truncateMasonryManager = new TruncateMasonryManager();
    truncateMasonryManager.init();

    // Initialisierung der Kategorie-Checkboxen
    categoryManager.initializeCategoryCheckboxes();
    categoryManager.setupCategoryShortcuts();
    categoryManager.setupCategoryInfoTooltip();
    categoryManager.updateCategoryVisibility();

    // Event-Handler jetzt in den Managern
    filterManager.setupFilterEvents();
    categoryManager.setupCategoryEvents();

    // Initialisierung der User-Highlight-Logik
    userHighlightManager.setupUserHighlighting();
});
