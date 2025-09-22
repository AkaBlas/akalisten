/**
 * MuckenlistenManager verwaltet alle Muckenlisten und deren Kategorien.
 * @class
 */
class MuckenlistenManager {
    constructor() {
        this.muckenlisten = [];
        this.pollIds = [];
    }

    /**
     * Initialisiert die Muckenlisten anhand der vorhandenen Poll-IDs.
     */
    init() {
        this.pollIds = Array.from(document.querySelectorAll('[id^="filter-all-"]'))
            .map(el => el.id.replace('filter-all-', ''));
        this.muckenlisten = this.pollIds.map(id => new Muckenliste(id));
    }

    /**
     * Gibt alle Poll-IDs zurück.
     * @returns {string[]}
     */
    getPollIds() {
        return this.pollIds;
    }

    /**
     * Gibt alle verfügbaren Kategorien über alle Listen hinweg zurück.
     * @returns {string[]}
     */
    getAllAvailableCategories() {
        const allCategories = new Set();
        this.muckenlisten.forEach(list => {
            list.getAllCategories().forEach(cat => allCategories.add(cat));
        });
        return Array.from(allCategories);
    }

    /**
     * Gibt die gemeinsamen Kategorien aller Listen zurück.
     * @returns {string[]}
     */
    getCommonCategories() {
        if (this.muckenlisten.length === 0) return [];
        let common = new Set(this.muckenlisten[0].getAllCategories());
        this.muckenlisten.slice(1).forEach(list => {
            const values = list.getAllCategories();
            common = new Set(values.filter(v => common.has(v)));
        });
        return Array.from(common);
    }

    /**
     * Gibt alle Menü-Elemente der Listen zurück.
     * @returns {HTMLElement[]}
     */
    getMenus() {
        return this.muckenlisten.map(list => list.menu).filter(Boolean);
    }

    /**
     * Aktualisiert die Sichtbarkeit der Spalten aller Muckenlisten basierend auf den Filterzuständen.
     * @param {Object} states - Objekt mit Filterzuständen.
     */
    updateColumnsVisibility(states) {
        this.muckenlisten.forEach(list => {list.updateColumnsVisibility(states)});
    }

    /**
     * Aktualisiert die Anzeige aller Kategorien aller Muckenlisten basierend auf der aktuellen Auswahl.
     */
    updateCategoryVisibility() {
        this.muckenlisten.forEach(list => list.updateCategoryVisibility());
    }


    /**
     * Hebt einen Nutzer in einer bestimmten Muckenliste hervor.
     * @param {string} userId
     * @param {string} pollId
     */
    highlightUser(userId, pollId) {
        this.muckenlisten.forEach(list => {
            if (list.pollId === pollId) {
                list.highlightUser(userId);
            } else {
                list.clearUserHighlight();
            }
        });
    }

    /**
     * Hebt die Nutzer Hervorhebung auf
     */
    clearUserHighlight() {
        this.muckenlisten.forEach(list => list.clearUserHighlight());
    }
}
