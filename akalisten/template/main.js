document.addEventListener('DOMContentLoaded', () => {
    const filterTypes = ['yes', 'no', 'maybe', 'pending'];
    const muckenlistenManager = new MuckenlistenManager();
    muckenlistenManager.init();
    const filterManager = new FilterManager(muckenlistenManager, filterTypes);
    const categoryManager = new CategoryManager(muckenlistenManager);
    const userHighlightManager = new UserHighlightManager(muckenlistenManager, categoryManager);

    // Initialisierung der Kategorie-Checkboxen
    categoryManager.initializeCategoryCheckboxes();
    categoryManager.setupCategoryShortcuts();
    categoryManager.setupCategoryInfoTooltip();
    categoryManager.updateAllCategories();

    // Event-Handler jetzt in den Managern
    filterManager.setupFilterEvents();
    categoryManager.setupCategoryEvents();

    // Initiales Update der Spaltenanzeige
    filterManager.updateAllColumns();

    // Initialisierung der User-Highlight-Logik
    userHighlightManager.setupUserHighlighting();
});
