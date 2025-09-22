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
        this.container = document.getElementById(`muckenliste-columns-${pollId}`);
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
        this.updateCategoryVisibility();
    }

    /**
     * Gibt die Kategorien zurück, in denen ein bestimmter Nutzer vorkommt.
     * @param userId
     * @returns {*[]}
     */
    getCategoriesWithUser(userId) {
        const categoriesWithUser = [];
        const categories = this.container.querySelectorAll('.register-category');
        categories.forEach(cat => {
            const userInCat = cat.querySelector(`.alert[data-user-id="${userId}"]`);
            if (userInCat) {
                categoriesWithUser.push(cat.getAttribute('data-category-name'));
            }
        });
        return categoriesWithUser;
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

    /**
     * Aktualisiert die Sichtbarkeit der Spalten basierend auf den Filterzuständen.
     * @param {Object} states - Objekt mit Filterzuständen.
     */
    updateColumnsVisibility(states) {
        if (states.all) {
            Object.keys(states).forEach(type => {
                this.container.querySelectorAll(`.column.${type}`).forEach(col =>
                    col.classList.remove('d-none')
                );
            });
        } else {
            Object.keys(states).forEach(type => {
                this.container.querySelectorAll(`.column.${type}`).forEach(col =>
                    col.classList.toggle('d-none', !states[type])
                );
            });
        }
        // Number of visible columns: 4 if "all" is selected, otherwise count the true states
        const visibleColumns = states.all
            ? 4
            : Object.values(states).filter(v => v === true).length;
        // Wenn nur eine Spalte sichtbar ist, verstecke die Füll-Elemente
        this.container.querySelectorAll('.fill-entry').forEach(el =>
            el.classList.toggle('hidden', visibleColumns === 1)
        );
    }

    /**
     * Aktualisiert die Anzeige aller Kategorien basierend auf der aktuellen Auswahl.
     */
    updateCategoryVisibility() {
        const activeCategories = this.getSelectedCategories();
        const allCategoryValues = this.getAllCategories();
        const categories = document.querySelectorAll(`#muckenliste-columns-${this.pollId} .register-category`);
        const allSelected = activeCategories.length === 0 || activeCategories.length === allCategoryValues.length;
        if (allSelected) {
            categories.forEach(cat => cat.classList.remove("d-none"));
        } else {
            categories.forEach(cat => {
                const catName = cat.getAttribute("data-category-name");
                cat.classList.toggle("d-none", !activeCategories.includes(catName));
            });
        }
    }

    /**
     * Hebt einen Nutzer in einer bestimmten Muckenliste hervor.
     * @param {string} userId
     */
    highlightUser(userId) {
        document.querySelectorAll(`#muckenliste-columns-${this.pollId} .alert[data-user-id]`).forEach(e => e.classList.remove('alert-info'));
        const els = document.querySelectorAll(`#muckenliste-columns-${this.pollId} .alert[data-user-id="${userId}"]`);
        els.forEach(e => e.classList.add('alert-info'));
    }

    /**
     * Hebt die Nutzer Hervorhebung auf
     */
    clearUserHighlight() {
        document.querySelectorAll(`#muckenliste-columns-${this.pollId} .alert[data-user-id]`).forEach(e => e.classList.remove('alert-info'));
    }
}
