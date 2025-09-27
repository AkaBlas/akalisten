/**
 * Kapselt die Logik für das Umschalten von Truncate-Text und das Aktualisieren des Masonry-Layouts.
 * Stellt sicher, dass das Masonry-Layout aktualisiert wird, wenn eine Truncate-Checkbox
 * umgeschaltet wird.
 *
 * @param {string} masonrySelector - CSS-Selektor für Masonry-Grid-Elemente (Standard: '[data-masonry]')
 *
 */
class TruncateMasonryManager {
    constructor(masonrySelector = '[data-masonry]') {
        this.masonrySelector = masonrySelector;
        this.masonryInstances = new Map(); // Map von Grid-Element zu Masonry-Instanz
    }

    /**
     * Initialisiert den TruncateMasonryManager.
     * Findet alle Masonry-Grids und setzt Event Listener für Truncate-Checkboxen.
     * Ruft die Masonry-Layout-Funktion auf, wenn eine Checkbox umgeschaltet wird.
     */
    init() {
        this.initAllMasonryGrids();
        this.observeTruncateToggles();
    }

    /**
     * Initialisiert alle Masonry-Grids auf der Seite.
     * Sucht nach Elementen mit dem angegebenen Masonry-Selektor und erstellt
     * eine Masonry-Instanz für jedes gefundene Grid.
     */
    initAllMasonryGrids() {
        // Alle Grids mit data-masonry finden und Masonry initialisieren
        const grids = document.querySelectorAll(this.masonrySelector);
        grids.forEach(grid => {
            if (window.Masonry && !this.masonryInstances.has(grid)) {
                const instance = new Masonry(grid, { percentPosition: true });
                this.masonryInstances.set(grid, instance);
            }
        });
    }

    /**
     * Beobachtet alle Truncate-Checkboxen und setzt Event Listener für Änderungen.
     * Wenn eine Checkbox umgeschaltet wird, wird das entsprechende Masonry-Layout aktualisiert.
     */
    observeTruncateToggles() {
        // Alle Checkboxen mit ID-Präfix 'truncate-toggle-' beobachten
        document.querySelectorAll('input[type="checkbox"][id^="truncate-toggle-"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateMasonryLayoutForCheckbox(checkbox);
            });
        });
    }

    /**
     * Aktualisiert das Masonry-Layout für das Grid, das die angegebene Checkbox enthält.
     * Sucht das nächste übergeordnete Grid-Element und ruft die Layout-Methode der Masonry-Instanz auf.
     * @param {HTMLInputElement} checkbox - Die umgeschaltete Truncate-Checkbox
     */
    updateMasonryLayoutForCheckbox(checkbox) {
        // Finde das nächste Grid (row mit data-masonry) als Vorfahre
        const grid = checkbox.closest('.row[data-masonry]');
        if (grid && this.masonryInstances.has(grid)) {
            const instance = this.masonryInstances.get(grid);
            if (instance && typeof instance.layout === 'function') {
                instance.layout();
            }
        }
    }
}
