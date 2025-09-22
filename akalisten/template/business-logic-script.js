document.addEventListener('DOMContentLoaded', () => {
    const filterTypes = ['yes', 'no', 'maybe', 'pending'];

    // Alle Muckenlisten-IDs sammeln
    const pollIds = Array.from(document.querySelectorAll('[id^="filter-all-"]'))
        .map(el => el.id.replace('filter-all-', ''));

    // Buttons synchronisieren (global)
    function syncButtons(type, checked) {
        pollIds.forEach(pollId => {
            const el = document.getElementById(`filter-${type}-${pollId}`);
            if (el) el.checked = checked;
        });
    }

    // Button-Status global abfragen (nur die Buttons der ersten Liste werden als Referenz genommen)
    function getButtonStates() {
        const states = {};
        states.all = document.getElementById(`filter-all-${pollIds[0]}`)?.checked;
        filterTypes.forEach(type => {
            states[type] = document.getElementById(`filter-${type}-${pollIds[0]}`)?.checked;
        });
        return states;
    }

    // Kategorie-Checkboxen global abfragen
    function getCategoryState() {
        const menu = document.getElementById(`category-dropdown-menu-${pollIds[0]}`);
        if (!menu) return [];
        return Array.from(menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
    }

    // Kategorie-Checkboxen synchronisieren
    function syncCategoryCheckboxes(values) {
        pollIds.forEach(pollId => {
            const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
            if (menu) {
                Array.from(menu.querySelectorAll('.category-checkbox')).forEach(cb => {
                    cb.checked = values.includes(cb.value);
                });
            }
        });
    }

    // Initialisiert Kategorie-Checkboxen: alle aktiv, falls keine Vorauswahl
    function initCategoryCheckboxes() {
        pollIds.forEach(pollId => {
            const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
            if (menu) {
                const checkboxes = Array.from(menu.querySelectorAll('.category-checkbox'));
                const anyChecked = checkboxes.some(cb => cb.checked);
                if (!anyChecked) {
                    checkboxes.forEach(cb => cb.checked = true);
                }
            }
        });
    }

    // Shortcut: Klick toggelt, Doppelklick/Long-Press wählt nur diese Kategorie
    function setupCategoryLabelShortcuts() {
        pollIds.forEach(pollId => {
            const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
            if (menu) {
                // Für Label
                menu.querySelectorAll('.category-label-shortcut').forEach(label => {
                    let longPressTimer;
                    let isTouch = false;

                    // Klick toggelt Auswahl (macht den Text wirklich klickbar)
                    label.addEventListener('click', (e) => {
                        if (isTouch) return; // Touch handled separately
                        // Toggle checkbox
                        const cb = menu.querySelector(`#${label.getAttribute('for')}`);
                        if (cb) {
                            cb.checked = !cb.checked;
                            const selected = Array.from(menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
                            // Wenn keine Kategorie ausgewählt, alle auswählen
                            if (selected.length === 0) {
                                menu.querySelectorAll('.category-checkbox').forEach(box => box.checked = true);
                                syncCategoryCheckboxes(Array.from(menu.querySelectorAll('.category-checkbox')).map(cb => cb.value));
                                updateAllCategories();
                            } else {
                                syncCategoryCheckboxes(selected);
                                updateAllCategories();
                            }
                        }
                    });

                    // Doppelklick wählt nur diese Kategorie
                    label.addEventListener('dblclick', (e) => {
                        if (isTouch) return;
                        e.preventDefault();
                        const value = label.getAttribute('data-category-value');
                        syncCategoryCheckboxes([value]);
                        updateAllCategories();
                    });

                    // Touch/Long-Press für Mobilgeräte
                    label.addEventListener('touchstart', (e) => {
                        isTouch = true;
                        longPressTimer = setTimeout(() => {
                            const value = label.getAttribute('data-category-value');
                            syncCategoryCheckboxes([value]);
                            updateAllCategories();
                        }, 500); // 500ms für Long-Press
                    });
                    label.addEventListener('touchend', (e) => {
                        clearTimeout(longPressTimer);
                        setTimeout(() => { isTouch = false; }, 100);
                    });
                });

                // Für Checkbox selbst
                menu.querySelectorAll('.category-checkbox').forEach(cb => {
                    let longPressTimer;
                    let isTouch = false;

                    // Klick toggelt Auswahl (Standardverhalten)
                    cb.addEventListener('change', () => {
                        const selected = Array.from(menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
                        // Wenn keine Kategorie ausgewählt, alle auswählen
                        if (selected.length === 0) {
                            menu.querySelectorAll('.category-checkbox').forEach(box => box.checked = true);
                            syncCategoryCheckboxes(Array.from(menu.querySelectorAll('.category-checkbox')).map(cb => cb.value));
                            updateAllCategories();
                        } else {
                            syncCategoryCheckboxes(selected);
                            updateAllCategories();
                        }
                    });

                    // Doppelklick wählt nur diese Kategorie
                    cb.addEventListener('dblclick', (e) => {
                        if (isTouch) return;
                        e.preventDefault();
                        syncCategoryCheckboxes([cb.value]);
                        updateAllCategories();
                    });

                    // Touch/Long-Press für Mobilgeräte
                    cb.addEventListener('touchstart', (e) => {
                        isTouch = true;
                        longPressTimer = setTimeout(() => {
                            syncCategoryCheckboxes([cb.value]);
                            updateAllCategories();
                        }, 500);
                    });
                    cb.addEventListener('touchend', (e) => {
                        clearTimeout(longPressTimer);
                        setTimeout(() => { isTouch = false; }, 100);
                    });
                });
            }
        });
    }

    // Tooltip für Info-Icon initialisieren
    function setupCategoryInfoTooltip() {
        pollIds.forEach(pollId => {
            const infoIcon = document.querySelector(`#categoryDropdown-${pollId}`).parentElement.nextElementSibling?.querySelector('.bi-info-circle');
            if (infoIcon && window.bootstrap) {
                new bootstrap.Tooltip(infoIcon);
            }
        });
    }

    // Kategorien für alle Listen aktualisieren
    function updateAllCategories() {
        const selectedCategories = getCategoryState();
        pollIds.forEach(pollId => {
            const categories = document.querySelectorAll(`#mucke-${pollId} .register-category`);
            const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
            const allCategoryValues = Array.from(menu.querySelectorAll('.category-checkbox')).map(cb => cb.value);
            if (selectedCategories.length === 0 || selectedCategories.length === allCategoryValues.length) {
                categories.forEach(cat => cat.classList.remove("d-none"));
            } else {
                categories.forEach(cat => {
                    const catName = cat.getAttribute("data-category-name");
                    cat.classList.toggle("d-none", !selectedCategories.includes(catName));
                });
            }
        });
    }

    // Spalten für alle Listen aktualisieren (inkl. Kategorien)
    function updateAllColumns() {
        const states = getButtonStates();
        pollIds.forEach(pollId => {
            // Wenn "Alle" aktiv, alle Spalten zeigen
            if (states.all) {
                filterTypes.forEach(type => {
                    document.querySelectorAll(`#mucke-${pollId} .column.${type}`).forEach(col =>
                        col.classList.remove('d-none')
                    );
                });
            } else {
                // Nur die aktivierten Checkbox-Spalten zeigen, andere ausblenden
                filterTypes.forEach(type => {
                    document.querySelectorAll(`#mucke-${pollId} .column.${type}`).forEach(col =>
                        col.classList.toggle('d-none', !states[type])
                    );
                });
            }

            // Prüfe, wie viele Spalten sichtbar sind
            const visibleColumns = filterTypes.filter(type =>
                !document.querySelector(`#mucke-${pollId} .column.${type}`)?.classList.contains('d-none')
            );
            const fillEntries = document.querySelectorAll(`#mucke-${pollId} .fill-entry`);
            fillEntries.forEach(el => el.classList.toggle('hidden', visibleColumns.length === 1));
        });
        updateAllCategories();
    }

    // Buttons und Checkboxen synchronisieren und Spalten aktualisieren
    function handleButtonChange(type, checked) {
        if (type === 'all') {
            syncButtons('all', checked);
            filterTypes.forEach(t => syncButtons(t, false));
        } else {
            syncButtons(type, checked);
            syncButtons('all', false);
            // Wenn alle Checkboxen aktiv sind, automatisch auf "Alle" umschalten
            const allChecked = filterTypes.every(t =>
                document.getElementById(`filter-${t}-${pollIds[0]}`)?.checked
            );
            if (allChecked) {
                syncButtons('all', true);
                filterTypes.forEach(t => syncButtons(t, false));
            }
            // Wenn keine Checkbox aktiv ist, "Alle" wieder aktivieren
            const anyChecked = filterTypes.some(t =>
                document.getElementById(`filter-${t}-${pollIds[0]}`)?.checked
            );
            if (!anyChecked) {
                syncButtons('all', true);
            }
        }
        updateAllColumns();
    }

    // Event-Handler für "Alle"
    pollIds.forEach(pollId => {
        const radio = document.getElementById(`filter-all-${pollId}`);
        if (radio) {
            radio.addEventListener('change', () => {
                handleButtonChange('all', radio.checked);
            });
        }
    });

    // Event-Handler für Checkboxen
    filterTypes.forEach(type => {
        pollIds.forEach(pollId => {
            const cb = document.getElementById(`filter-${type}-${pollId}`);
            if (cb) {
                cb.addEventListener('change', () => {
                    handleButtonChange(type, cb.checked);
                });
            }
        });
    });

    // Event-Handler für Kategorie-Checkboxen im Dropdown
    pollIds.forEach(pollId => {
        const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
        if (menu) {
            menu.addEventListener('change', (e) => {
                if (e.target.classList.contains('category-checkbox')) {
                    const selected = Array.from(menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
                    syncCategoryCheckboxes(selected);
                    updateAllCategories();
                }
            });
        }
    });

    // Event-Handler für "Alle auswählen"-Button im Dropdown
    pollIds.forEach(pollId => {
        const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
        if (menu) {
            const selectAllBtn = menu.querySelector('.category-select-all-btn');
            if (selectAllBtn) {
                selectAllBtn.addEventListener('click', () => {
                    const allValues = Array.from(menu.querySelectorAll('.category-checkbox')).map(cb => cb.value);
                    syncCategoryCheckboxes(allValues);
                    updateAllCategories();
                });
            }
        }
    });

    // Initiales Setzen
    initCategoryCheckboxes();
    setupCategoryLabelShortcuts();
    setupCategoryInfoTooltip();
    updateAllColumns();
});
