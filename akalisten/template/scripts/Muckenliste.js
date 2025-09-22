/**
 * Repräsentiert eine einzelne Muckenliste und deren Kategorien.
 * @class
 * @param {string} pollId - Die ID der Umfrage/Muckenliste.
 */
class Muckenliste {
    /**
     * Erstellt eine neue Muckenliste.
     * @param {string} pollId
     */
    constructor(pollId) {
        this.pollId = pollId;
        this.menu = document.getElementById(`category-dropdown-menu-${pollId}`);
        this.container = document.getElementById(`mucke-${pollId}`);
    }

    /**
     * Gibt die aktuell ausgewählten Kategorien zurück.
     * @returns {string[]}
     */
    getSelectedCategories() {
        if (!this.menu) return [];
        return Array.from(this.menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
    }

    /**
     * Gibt alle verfügbaren Kategorien zurück.
     * @returns {string[]}
     */
    getAllCategories() {
        if (!this.menu) return [];
        return Array.from(this.menu.querySelectorAll('.category-checkbox')).map(cb => cb.value);
    }

    /**
     * Setzt die Checkboxen der Kategorien entsprechend der Auswahl.
     * @param {string[]} selectedValues
     */
    setCategoryCheckboxes(selectedValues) {
        if (!this.menu) return;
        this.menu.querySelectorAll('.category-checkbox').forEach(cb => {
            cb.checked = selectedValues.includes(cb.value);
        });
    }

    /**
     * Berechnet die gemeinsamen Kategorien mit anderen Menüs.
     * @param {HTMLElement[]} otherMenus
     * @returns {string[]}
     */
    getCommonCategories(otherMenus) {
        const myCategories = new Set(this.getAllCategories());
        let common = new Set(myCategories);
        otherMenus.forEach(menu => {
            const values = Array.from(menu.querySelectorAll('.category-checkbox')).map(cb => cb.value);
            common = new Set(values.filter(v => common.has(v)));
        });
        return Array.from(common);
    }
}
