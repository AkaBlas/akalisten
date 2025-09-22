/**
 * CategoryManager verwaltet die Kategorie-Checkboxen und deren Synchronisation zwischen mehreren Muckenlisten.
 * @class
 * @param {MuckenlistenManager} muckenlistenManager - Manager für die Muckenlisten.
 */
class CategoryManager {
    constructor(muckenlistenManager) {
        this.muckenlistenManager = muckenlistenManager;
    }

    /**
     * Initialisiert die Kategorie-Checkboxen, sodass alle standardmäßig ausgewählt sind, wenn keine Auswahl besteht.
     */
    initializeCategoryCheckboxes() {
        this.muckenlistenManager.muckenlisten.forEach(list => {
            const menu = list.menu;
            if (menu) {
                const checkboxes = Array.from(menu.querySelectorAll('.category-checkbox'));
                if (!checkboxes.some(cb => cb.checked)) {
                    checkboxes.forEach(cb => cb.checked = true);
                }
            }
        });
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
    }

    /**
     * Synchronisiert die Auswahl der Kategorien über alle Listen hinweg.
     * @param {string[]} selectedValues - Die ausgewählten Kategorien.
     */
    updateCategorySelection(selectedValues) {
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
        this.updateAllCategories();
    }

    /**
     * Aktualisiert die Anzeige aller Kategorien basierend auf der aktuellen Auswahl.
     */
    updateAllCategories() {
        const selectedByPoll = {};
        this.muckenlistenManager.muckenlisten.forEach(list => {
            selectedByPoll[list.pollId] = list.getSelectedCategories();
        });
        this.muckenlistenManager.muckenlisten.forEach(list => {
            const menu = list.menu;
            const allCategoryValues = list.getAllCategories();
            const categories = document.querySelectorAll(`#mucke-${list.pollId} .register-category`);
            const selectedCategories = selectedByPoll[list.pollId];
            const allSelected = this.muckenlistenManager.muckenlisten.every(l => {
                const sel = selectedByPoll[l.pollId];
                return sel.length === 0 || sel.length === l.getAllCategories().length;
            });
            if (allSelected) {
                categories.forEach(cat => cat.classList.remove("d-none"));
            } else {
                categories.forEach(cat => {
                    const catName = cat.getAttribute("data-category-name");
                    cat.classList.toggle("d-none", !selectedCategories.includes(catName));
                });
            }
        });
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
                let longPressTimer, isTouch = false, touchMoved = false;
                const getCheckbox = () => menu.querySelector(`#${label.getAttribute('for')}`);
                // Toggle: Checkbox umschalten und synchronisieren
                function handleToggle(cb) {
                    cb.checked = !cb.checked;
                    const selected = Array.from(menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
                    // Synchronisiere Auswahl
                    // 'this' ist hier nicht CategoryManager, daher closure verwenden
                    label.categoryManager.setCategoryCheckboxes(selected);
                    label.categoryManager.updateAllCategories();
                }
                // SelectOnly: Nur diese Kategorie auswählen und synchronisieren
                function handleSelectOnly(cb) {
                    label.categoryManager.setCategoryCheckboxes([cb.value]);
                    label.categoryManager.updateAllCategories();
                }
                // CategoryManager für closures verfügbar machen
                label.categoryManager = this;
                label.addEventListener('click', e => {
                    if (isTouch) return;
                    e.preventDefault(); e.stopPropagation();
                    const cb = getCheckbox();
                    if (cb) handleToggle(cb);
                    return false;
                });
                label.addEventListener('dblclick', e => {
                    if (isTouch) return;
                    e.preventDefault(); e.stopPropagation();
                    const cb = getCheckbox();
                    if (cb) handleSelectOnly(cb);
                    return false;
                });
                label.addEventListener('touchstart', () => {
                    isTouch = true; touchMoved = false;
                    longPressTimer = setTimeout(() => {
                        const cb = getCheckbox();
                        if (cb) handleSelectOnly(cb);
                    }, 500);
                });
                label.addEventListener('touchmove', () => { touchMoved = true; });
                label.addEventListener('touchend', e => {
                    clearTimeout(longPressTimer);
                    setTimeout(() => { isTouch = false; }, 100);
                    if (!touchMoved) {
                        e.preventDefault(); e.stopPropagation();
                        const cb = getCheckbox();
                        if (cb) handleToggle(cb);
                    }
                });
            });
            menu.querySelectorAll('.category-checkbox').forEach(cb => {
                let longPressTimer, isTouch = false;
                cb.addEventListener('change', () => {
                    const selected = Array.from(menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
                    this.updateCategorySelection(selected);
                });
                cb.addEventListener('dblclick', e => {
                    if (isTouch) return;
                    e.preventDefault(); e.stopPropagation();
                    this.setCategoryCheckboxes([cb.value]);
                    this.updateAllCategories();
                    return false;
                });
                cb.addEventListener('touchstart', () => {
                    isTouch = true;
                    longPressTimer = setTimeout(() => {
                        this.setCategoryCheckboxes([cb.value]);
                        this.updateAllCategories();
                    }, 500);
                });
                cb.addEventListener('touchend', () => {
                    clearTimeout(longPressTimer);
                    setTimeout(() => { isTouch = false; }, 100);
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
                        this.updateAllCategories();
                    }
                });
                const selectAllBtn = menu.querySelector('.category-select-all-btn');
                if (selectAllBtn) {
                    selectAllBtn.addEventListener('click', () => {
                        const allValues = Array.from(menu.querySelectorAll('.category-checkbox')).map(cb => cb.value);
                        this.setCategoryCheckboxes(allValues);
                        this.updateAllCategories();
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
