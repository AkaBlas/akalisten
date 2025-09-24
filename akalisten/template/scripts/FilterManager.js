/**
 * FilterManager verwaltet die Filter-Checkboxen für die Spaltenanzeige in den Muckenlisten.
 * @class
 * @param {MuckenlistenManager} muckenlistenManager - Manager für die Muckenlisten.
 * @param {string[]} filterTypes - Die Typen der Filter (z.B. yes, no, maybe, pending).
 */
class FilterManager {
    constructor(muckenlistenManager, storageManager) {
        this.muckenlistenManager = muckenlistenManager;
        this.filterTypes = ['yes', 'no', 'maybe', 'pending'];
        this.storageManager = storageManager;
    }

    /**
     * Liest die aktuellen Zustände aller Filter-Checkboxen aus.
     * @returns {Object} - Objekt mit Filterzuständen.
     */
    getFilterStates() {
        // Versuche zuerst aus Storage zu laden
        const stored = this.storageManager.getFilterSelection();
        if (stored && Object.keys(stored).length > 0) {
            return stored;
        }
        // Fallback: aus DOM lesen
        const states = {};
        const pollIds = this.muckenlistenManager.getPollIds();
        states.all = document.getElementById(`filter-all-${pollIds[0]}`)?.checked;
        this.filterTypes.forEach(type => {
            states[type] = document.getElementById(`filter-${type}-${pollIds[0]}`)?.checked;
        });
        return states;
    }

    /**
     * Setzt den Zustand einer Checkbox für einen Filtertyp und speichert die Auswahl.
     * @param {string} type - Filtertyp.
     * @param {boolean} checked - Ob die Checkbox aktiviert ist.
     */
    setButtonsState(type, checked) {
        this.muckenlistenManager.getPollIds().forEach(pollId => {
            const el = document.getElementById(`filter-${type}-${pollId}`);
            if (el) el.checked = checked;
        });
        // Nach Änderung speichern
        const states = {};
        const pollIds = this.muckenlistenManager.getPollIds();
        states.all = document.getElementById(`filter-all-${pollIds[0]}`)?.checked;
        this.filterTypes.forEach(t => {
            states[t] = document.getElementById(`filter-${t}-${pollIds[0]}`)?.checked;
        });
        this.storageManager.setFilterSelection(states);
    }

    /**
     * Aktualisiert die Sichtbarkeit der Spalten basierend auf den Filterzuständen.
     */
    updateColumnVisibility() {
        const states = this.getFilterStates();
        this.muckenlistenManager.updateColumnsVisibility(states);
    }

    /**
     * Behandelt Änderungen an den Filter-Checkboxen und synchronisiert die Auswahl.
     * @param {string} type - Filtertyp.
     * @param {boolean} checked - Ob die Checkbox aktiviert ist.
     */
    handleFilterChange(type, checked) {
        if (type === 'all') {
            this.setButtonsState('all', checked);
            this.filterTypes.forEach(t => this.setButtonsState(t, false));
        } else {
            this.setButtonsState(type, checked);
            this.setButtonsState('all', false);
            const allChecked = this.filterTypes.every(t =>
                document.getElementById(`filter-${t}-${this.muckenlistenManager.getPollIds()[0]}`)?.checked
            );
            if (allChecked) {
                this.setButtonsState('all', true);
                this.filterTypes.forEach(t => this.setButtonsState(t, false));
            }
            if (!this.filterTypes.some(t =>
                document.getElementById(`filter-${t}-${this.muckenlistenManager.getPollIds()[0]}`)?.checked
            )) {
                this.setButtonsState('all', true);
            }
        }
        this.updateColumnVisibility();
    }

    /**
     * Richtet Event Listener für alle Filter-Checkboxen ein.
     * Stellt beim Laden die gespeicherte Auswahl wieder her.
     */
    setupFilterEvents() {
        const pollIds = this.muckenlistenManager.getPollIds();
        // Auswahl aus Storage wiederherstellen
        const stored = this.storageManager.getFilterSelection();
        if (stored && Object.keys(stored).length > 0) {
            if (stored.all !== undefined) this.setButtonsState('all', stored.all);
            this.filterTypes.forEach(type => {
                if (stored[type] !== undefined) this.setButtonsState(type, stored[type]);
            });
            this.updateColumnVisibility();
        }
        // Event Listener setzen
        pollIds.forEach(pollId => {
            ['all', ...this.filterTypes].forEach(type => {
                const el = document.getElementById(`filter-${type}-${pollId}`);
                if (el) {
                    el.addEventListener('change', e => {
                        this.handleFilterChange(type, el.checked);
                    });
                }
            });

            // Doppelklick/Longpress auf Filter-Labels: Nur diesen Filter aktivieren
            this.filterTypes.forEach(type => {
                const label = document.querySelector(`label[for="filter-${type}-${pollId}"]`);
                if (!label) return;
                let longPressTimer, isTouch = false, touchMoved = false, longPressTriggered = false;
                // Closure für Zugriff auf this
                const self = this;

                function selectOnlyThisFilter() {
                    // Nur diesen Filter aktivieren, alle anderen deaktivieren
                    self.filterTypes.forEach(t => self.setButtonsState(t, t === type));
                    self.setButtonsState('all', false);
                    self.updateColumnVisibility();
                }

                label.addEventListener('dblclick', function(e) {
                    if (isTouch) return;
                    e.preventDefault();
                    e.stopPropagation();
                    selectOnlyThisFilter();
                    return false;
                });

                label.addEventListener('touchstart', function(e) {
                    isTouch = true;
                    touchMoved = false;
                    longPressTriggered = false;
                    longPressTimer = setTimeout(() => {
                        selectOnlyThisFilter();
                        longPressTriggered = true;
                    }, 500);
                });

                label.addEventListener('touchmove', function() {
                    touchMoved = true;
                });

                label.addEventListener('touchend', function(e) {
                    clearTimeout(longPressTimer);
                    setTimeout(() => { isTouch = false; }, 100);
                    if (longPressTriggered) {
                        longPressTriggered = false;
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                    // Normales Toggle bei einfachem Tap
                    if (!touchMoved) {
                        // Nichts tun, normales change-Event übernimmt das
                    }
                });
            });
        });
    }
}
