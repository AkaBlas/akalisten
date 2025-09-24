/**
 * CategoryManager verwaltet die Kategorie-Checkboxen und deren Synchronisation zwischen mehreren Muckenlisten.
 * @class
 * @param {MuckenlistenManager} muckenlistenManager - Manager für die Muckenlisten.
 */
class CategoryManager {
    constructor(muckenlistenManager, storageManager) {
        this.muckenlistenManager = muckenlistenManager;
        this.storageManager = storageManager;
    }

    /**
     * Initialisiert die Kategorie-Checkboxen, sodass alle standardmäßig ausgewählt sind, wenn keine Auswahl besteht.
     * Lädt die Auswahl aus dem StorageManager und stellt sie wieder her.
     */
    initializeCategoryCheckboxes() {
        this.muckenlistenManager.muckenlisten.forEach(list => {
            const menu = list.menu;
            if (menu) {
                const savedSelection = this.storageManager.getCategorySelection(list.pollId);
                const checkboxes = Array.from(menu.querySelectorAll('.category-checkbox'));
                if (savedSelection && savedSelection.length > 0) {
                    checkboxes.forEach(cb => cb.checked = savedSelection.includes(cb.value));
                } else if (!checkboxes.some(cb => cb.checked)) {
                    checkboxes.forEach(cb => cb.checked = true);
                }
            }
        });
    }

    /**
     * Speichert die aktuelle Auswahl der Kategorien im StorageManager und aktualisiert die Sichtbarkeit.
     */
    storeAndUpdateVisibility() {
        this.muckenlistenManager.muckenlisten.forEach(list => {
            const selected = list.getSelectedCategories();
            this.storageManager.setCategorySelection(list.pollId, selected);
        });
        this.updateCategoryVisibility();
    }

    /**
     * Setzt die Checkboxen für Kategorien entsprechend der Auswahl.
     * @param {string[]} selectedValues - Die ausgewählten Kategorien.
     */
    setCategoryCheckboxes(selectedValues) {
        const commonCategories = this.muckenlistenManager.getCommonCategories();
        this.muckenlistenManager.muckenlisten.forEach(list => {
            const menu = list.menu;
            if (menu) {
                menu.querySelectorAll('.category-checkbox').forEach(cb => {
                    if (commonCategories.includes(cb.value)) {
                        cb.checked = selectedValues.includes(cb.value);
                    } else {
                        cb.checked = selectedValues.length === 0 ? true : selectedValues.includes(cb.value);
                    }
                });
            }
        });
        // this.updateCategoryVisibility();
        this.storeAndUpdateVisibility();
    }

    /**
     * Synchronisiert die Auswahl der Kategorien über alle Listen hinweg.
     * @param {string[]} selectedValues - Die ausgewählten Kategorien.
     */
    syncCategorySelection(selectedValues) {
        if (selectedValues.length === 0) {
            // Alle anzeigen
            this.muckenlistenManager.muckenlisten.forEach(list => {
                const menu = list.menu;
                if (menu) {
                    menu.querySelectorAll('.category-checkbox').forEach(cb => cb.checked = true);
                }
            });
        } else {
            // Synchronisiere nur gemeinsame Kategorien
            const commonCategories = this.muckenlistenManager.getCommonCategories();
            const syncValues = selectedValues.filter(v => commonCategories.includes(v));
            this.setCategoryCheckboxes(syncValues);
            // Lokale Kategorien: nur in der jeweiligen Liste setzen
            this.muckenlistenManager.muckenlisten.forEach(list => {
                const menu = list.menu;
                if (menu) {
                    menu.querySelectorAll('.category-checkbox').forEach(cb => {
                        if (!commonCategories.includes(cb.value)) {
                            cb.checked = selectedValues.includes(cb.value);
                        }
                    });
                }
            });
        }
        this.storeAndUpdateVisibility();
        // // Nach der Synchronisierung speichern
        // this.muckenlistenManager.muckenlisten.forEach(list => {
        //     const selected = list.getSelectedCategories();
        //     this.storageManager.setCategorySelection(list.pollId, selected);
        // });
        // this.updateCategoryVisibility();
    }

    /**
     * Aktualisiert die Anzeige aller Kategorien basierend auf der aktuellen Auswahl.
     */
    updateCategoryVisibility() {
        this.muckenlistenManager.updateCategoryVisibility();
    }

    /**
     * Richtet Shortcuts für die Kategorie-Labels ein (Klick, Doppelklick, Touch).
     * Event Listener:
     * - click: toggelt die Checkbox (Nutzer kann schnell Kategorien an-/abwählen)
     * - dblclick/touch longpress: wählt nur diese Kategorie aus (Nutzer sieht nur diese Kategorie)
     */
    setupCategoryShortcuts() {
        this.muckenlistenManager.muckenlisten.forEach(list => {
            const menu = list.menu;
            if (!menu) return;
            menu.querySelectorAll('.category-label-shortcut').forEach(label => {
                let longPressTimer, isTouch = false, touchMoved = false, longPressTriggered = false;
                const getCheckbox = () => menu.querySelector(`#${label.getAttribute('for')}`);

                // Toggle: Checkbox umschalten und synchronisieren
                function handleToggle(cb) {
                    cb.checked = !cb.checked;
                    const selected = Array.from(menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
                    // Synchronisiere Auswahl
                    // 'this' ist hier nicht CategoryManager, daher closure verwenden
                    label.categoryManager.setCategoryCheckboxes(selected);
                }

                // SelectOnly: Nur diese Kategorie auswählen und synchronisieren
                function handleSelectOnly(cb) {
                    label.categoryManager.setCategoryCheckboxes([cb.value]);
                }

                // CategoryManager für closures verfügbar machen
                label.categoryManager = this;
                label.addEventListener('click', e => {
                    if (isTouch) return;
                    e.preventDefault();
                    e.stopPropagation();
                    const cb = getCheckbox();
                    if (cb) handleToggle(cb);
                    return false;
                });
                label.addEventListener('dblclick', e => {
                    if (isTouch) return;
                    e.preventDefault();
                    e.stopPropagation();
                    const cb = getCheckbox();
                    if (cb) handleSelectOnly(cb);
                    return false;
                });
                label.addEventListener('touchstart', () => {
                    console.log('touchstart');
                    isTouch = true;
                    touchMoved = false;
                    longPressTriggered = false;
                    longPressTimer = setTimeout(() => {
                        console.log('longpress detected');
                        const cb = getCheckbox();
                        if (cb) {
                            handleSelectOnly(cb);
                            longPressTriggered = true;
                        }
                    }, 500);
                });
                label.addEventListener('touchmove', () => {
                    touchMoved = true;
                });
                label.addEventListener('touchend', e => {
                    console.log('touchend. touchMoved:', touchMoved);
                    clearTimeout(longPressTimer);
                    setTimeout(() => {
                        isTouch = false;
                    }, 100);
                    if (longPressTriggered) {
                        // Longpress hat SelectOnly bereits ausgelöst, Toggle NICHT ausführen
                        longPressTriggered = false;
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                    if (!touchMoved) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('handleToggle on touchend');
                        const cb = getCheckbox();
                        if (cb) handleToggle(cb);
                    }
                });
            });
            menu.querySelectorAll('.category-checkbox').forEach(cb => {
                let longPressTimer, isTouch = false;
                cb.addEventListener('change', () => {
                    const selected = Array.from(menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
                    this.syncCategorySelection(selected);
                });
                cb.addEventListener('dblclick', e => {
                    if (isTouch) return;
                    e.preventDefault();
                    e.stopPropagation();
                    this.setCategoryCheckboxes([cb.value]);
                    return false;
                });
                cb.addEventListener('touchstart', () => {
                    isTouch = true;
                    longPressTimer = setTimeout(() => {
                        this.setCategoryCheckboxes([cb.value]);
                    }, 500);
                });
                cb.addEventListener('touchend', () => {
                    clearTimeout(longPressTimer);
                    setTimeout(() => {
                        isTouch = false;
                    }, 100);
                });
            });
        });
    }

    /**
     * Richtet Event Listener für Kategorie-Checkboxen und Buttons ein.
     * Event Listener:
     * - change: synchronisiert die Auswahl
     * - click auf 'Alle auswählen': wählt alle Kategorien aus
     */
    setupCategoryEvents() {
        this.muckenlistenManager.getPollIds().forEach(pollId => {
            const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
            if (menu) {
                menu.addEventListener('change', e => {
                    if (e.target.classList.contains('category-checkbox')) {
                        const selected = Array.from(menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
                        this.setCategoryCheckboxes(selected);
                    }
                });
                const selectAllBtn = menu.querySelector('.category-select-all-btn');
                if (selectAllBtn) {
                    selectAllBtn.addEventListener('click', () => {
                        const allValues = Array.from(menu.querySelectorAll('.category-checkbox')).map(cb => cb.value);
                        this.setCategoryCheckboxes(allValues);
                    });
                }
            }
        });
    }

    /**
     * Initialisiert Tooltip für das Info-Icon neben der Kategorieauswahl.
     */
    setupCategoryInfoTooltip() {
        this.muckenlistenManager.getPollIds().forEach(pollId => {
            const infoIcon = document.querySelector(`#categoryDropdown-${pollId}`).parentElement.nextElementSibling?.querySelector('.bi-info-circle');
            if (infoIcon && window.bootstrap) {
                new window.bootstrap.Tooltip(infoIcon);
            }
        });
    }
}
