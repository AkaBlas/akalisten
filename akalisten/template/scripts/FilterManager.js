/**
 * FilterManager verwaltet die Filter-Checkboxen für die Spaltenanzeige in den Muckenlisten.
 * @class
 * @param {MuckenlistenManager} muckenlistenManager - Manager für die Muckenlisten.
 * @param {string[]} filterTypes - Die Typen der Filter (z.B. yes, no, maybe, pending).
 */
class FilterManager {
    constructor(muckenlistenManager, filterTypes) {
        this.muckenlistenManager = muckenlistenManager;
        this.filterTypes = filterTypes;
    }

    /**
     * Setzt den Zustand einer Checkbox für einen Filtertyp.
     * @param {string} type - Filtertyp.
     * @param {boolean} checked - Ob die Checkbox aktiviert ist.
     */
    setCheckboxState(type, checked) {
        this.muckenlistenManager.getPollIds().forEach(pollId => {
            const el = document.getElementById(`filter-${type}-${pollId}`);
            if (el) el.checked = checked;
        });
    }

    /**
     * Liest die aktuellen Zustände aller Filter-Checkboxen aus.
     * @returns {Object} - Objekt mit Filterzuständen.
     */
    getFilterStates() {
        const states = {};
        const pollIds = this.muckenlistenManager.getPollIds();
        states.all = document.getElementById(`filter-all-${pollIds[0]}`)?.checked;
        this.filterTypes.forEach(type => {
            states[type] = document.getElementById(`filter-${type}-${pollIds[0]}`)?.checked;
        });
        return states;
    }

    /**
     * Aktualisiert die Sichtbarkeit der Spalten basierend auf den Filterzuständen.
     */
    updateAllColumns() {
        const states = this.getFilterStates();
        this.muckenlistenManager.getPollIds().forEach(pollId => {
            if (states.all) {
                this.filterTypes.forEach(type => {
                    document.querySelectorAll(`#mucke-${pollId} .column.${type}`).forEach(col =>
                        col.classList.remove('d-none')
                    );
                });
            } else {
                this.filterTypes.forEach(type => {
                    document.querySelectorAll(`#mucke-${pollId} .column.${type}`).forEach(col =>
                        col.classList.toggle('d-none', !states[type])
                    );
                });
            }
            const visibleColumns = this.filterTypes.filter(type =>
                !document.querySelector(`#mucke-${pollId} .column.${type}`)?.classList.contains('d-none')
            );
            document.querySelectorAll(`#mucke-${pollId} .fill-entry`).forEach(el =>
                el.classList.toggle('hidden', visibleColumns.length === 1)
            );
        });
        // Komplexe Logik: Sichtbarkeit der Spalten und Füll-Einträge abhängig von Filterauswahl
    }

    /**
     * Behandelt Änderungen an den Filter-Checkboxen und synchronisiert die Auswahl.
     * @param {string} type - Filtertyp.
     * @param {boolean} checked - Ob die Checkbox aktiviert ist.
     */
    handleFilterChange(type, checked) {
        if (type === 'all') {
            this.setCheckboxState('all', checked);
            this.filterTypes.forEach(t => this.setCheckboxState(t, false));
        } else {
            this.setCheckboxState(type, checked);
            this.setCheckboxState('all', false);
            const allChecked = this.filterTypes.every(t =>
                document.getElementById(`filter-${t}-${this.muckenlistenManager.getPollIds()[0]}`)?.checked
            );
            if (allChecked) {
                this.setCheckboxState('all', true);
                this.filterTypes.forEach(t => this.setCheckboxState(t, false));
            }
            if (!this.filterTypes.some(t =>
                document.getElementById(`filter-${t}-${this.muckenlistenManager.getPollIds()[0]}`)?.checked
            )) {
                this.setCheckboxState('all', true);
            }
        }
        this.updateAllColumns();
        // Komplexe Logik: Synchronisation zwischen 'Alle' und Einzel-Checkboxen
    }

    /**
     * Richtet Event Listener für alle Filter-Checkboxen ein.
     * Event Listener:
     * - change: Filter-Checkboxen, aktualisiert die Spaltenanzeige für den Nutzer
     */
    setupFilterEvents() {
        this.muckenlistenManager.getPollIds().forEach(pollId => {
            const radio = document.getElementById(`filter-all-${pollId}`);
            if (radio) {
                radio.addEventListener('change', () => this.handleFilterChange('all', radio.checked));
            }
            this.filterTypes.forEach(type => {
                const cb = document.getElementById(`filter-${type}-${pollId}`);
                if (cb) {
                    cb.addEventListener('change', () => this.handleFilterChange(type, cb.checked));
                }
            });
        });
    }
}
