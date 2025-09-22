// Klasse für eine einzelne Muckenliste
class Muckenliste {
    constructor(pollId) {
        this.pollId = pollId;
        this.menu = document.getElementById(`category-dropdown-menu-${pollId}`);
        this.container = document.getElementById(`mucke-${pollId}`);
    }

    // Methode um die aktuell ausgewählten Kategorien zu bekommen
    getSelectedCategories() {
        if (!this.menu) return [];
        return Array.from(this.menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
    }

    // Methode um alle verfügbaren Kategorien zu bekommen
    getAllCategories() {
        if (!this.menu) return [];
        return Array.from(this.menu.querySelectorAll('.category-checkbox')).map(cb => cb.value);
    }

    // Methode um die Checkboxen der Kategorien zu setzen
    setCategoryCheckboxes(selectedValues) {
        if (!this.menu) return;
        this.menu.querySelectorAll('.category-checkbox').forEach(cb => {
            cb.checked = selectedValues.includes(cb.value);
        });
    }

    // Methode um die gemeinsamen Kategorien mit anderen Menüs zu berechnen
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
