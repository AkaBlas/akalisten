class CategoryManager {
    constructor(muckenlistenManager) {
        this.muckenlistenManager = muckenlistenManager;
    }

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

    setupCategoryShortcuts() {
        this.muckenlistenManager.muckenlisten.forEach(list => {
            const menu = list.menu;
            if (!menu) return;
            menu.querySelectorAll('.category-label-shortcut').forEach(label => {
                let longPressTimer, isTouch = false, touchMoved = false;
                const getCheckbox = () => menu.querySelector(`#${label.getAttribute('for')}`);
                function handleToggle(cb) {
                    cb.checked = !cb.checked;
                    const selected = Array.from(menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
                    // updateCategorySelection wird im Event-Handler aufgerufen
                }
                function handleSelectOnly(cb) {
                    // setCategoryCheckboxes wird im Event-Handler aufgerufen
                }
                label.addEventListener('click', e => {
                    if (isTouch) return;
                    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
                    const cb = getCheckbox();
                    if (cb) handleToggle(cb);
                    return false;
                });
                label.addEventListener('dblclick', e => {
                    if (isTouch) return;
                    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
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
                        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
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
                    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
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

    setupCategoryInfoTooltip() {
        this.muckenlistenManager.getPollIds().forEach(pollId => {
            const infoIcon = document.querySelector(`#categoryDropdown-${pollId}`).parentElement.nextElementSibling?.querySelector('.bi-info-circle');
            if (infoIcon && window.bootstrap) {
                new window.bootstrap.Tooltip(infoIcon);
            }
        });
    }
}
