// StorageManager.js
// Zentralisiert alle lokalen Speicheroperationen für die Anwendung

/**
 * StorageManager
 * Verwaltet die zentrale Persistenz aller Statusdaten der Anwendung (Accordions, Filter, Kategorien, User-Highlighting).
 * Alle Daten werden mit einem gemeinsamen Prefix im localStorage gespeichert.
 */
class StorageManager {
    constructor(prefix = 'akalisten_') {
        this.prefix = prefix;
    }

    /**
     * Speichert den Status (offen/geschlossen) eines Accordions.
     * @param {string} accordionId - Eindeutige ID des Accordions.
     * @param {boolean} isOpen - Status (true = offen, false = geschlossen).
     */
    setAccordionStatus(accordionId, isOpen) {
        const key = this.prefix + 'accordion_status';
        let status = this._getObject(key);
        status[accordionId] = isOpen;
        this._setObject(key, status);
    }

    /**
     * Gibt den gespeicherten Status eines Accordions zurück.
     * @param {string} accordionId - Eindeutige ID des Accordions.
     * @returns {boolean}
     */
    getAccordionStatus(accordionId) {
        const key = this.prefix + 'accordion_status';
        let status = this._getObject(key);
        return status[accordionId] || false;
    }

    getAllAccordionStatus() {
        const key = this.prefix + 'accordion_status';
        return this._getObject(key);
    }

    /**
     * Speichert die globale Filterauswahl.
     * @param {Object} filterObj
     */
    setFilterSelection(filterObj) {
        const key = this.prefix + 'filter_selection';
        this._setObject(key, filterObj);
    }
    getFilterSelection() {
        const key = this.prefix + 'filter_selection';
        return this._getObject(key);
    }

    /**
     * Speichert die Kategorieauswahl pro Muckenliste.
     * @param {string} listId
     * @param {any} categoryId
     */
    setCategorySelection(listId, categoryId) {
        const key = this.prefix + 'category_selection';
        let selection = this._getObject(key);
        selection[listId] = categoryId;
        this._setObject(key, selection);
    }
    getCategorySelection(listId) {
        const key = this.prefix + 'category_selection';
        let selection = this._getObject(key);
        return selection[listId] || null;
    }
    getAllCategorySelections() {
        const key = this.prefix + 'category_selection';
        return this._getObject(key);
    }

    /**
     * Speichert die Nutzer-Hervorhebung pro Muckenliste.
     * @param {string} listId
     * @param {any} highlightObj
     */
    setUserHighlighting(listId, highlightObj) {
        const key = this.prefix + 'user_highlighting';
        let highlights = this._getObject(key);
        highlights[listId] = highlightObj;
        this._setObject(key, highlights);
    }
    getUserHighlighting(listId) {
        const key = this.prefix + 'user_highlighting';
        let highlights = this._getObject(key);
        return highlights[listId] || null;
    }
    getAllUserHighlightings() {
        const key = this.prefix + 'user_highlighting';
        return this._getObject(key);
    }

    /**
     * Entfernt die Nutzer-Hervorhebung für eine Muckenliste aus dem Storage.
     * @param {string} listId
     */
    removeUserHighlighting(listId) {
        const key = this.prefix + 'user_highlighting';
        let highlights = this._getObject(key);
        delete highlights[listId];
        this._setObject(key, highlights);
    }

    /**
     * Hilfsfunktion: Holt ein Objekt aus localStorage.
     * @param {string} key
     * @returns {Object}
     */
    _getObject(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : {};
        } catch (e) {
            return {};
        }
    }
    /**
     * Hilfsfunktion: Speichert ein Objekt im localStorage.
     * @param {string} key
     * @param {Object} obj
     */
    _setObject(key, obj) {
        localStorage.setItem(key, JSON.stringify(obj));
    }
}
