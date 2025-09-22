document.addEventListener('DOMContentLoaded', () => {
    const filterTypes = ['yes', 'no', 'maybe', 'pending'];

    // IDs aller Listen ermitteln
    const pollIds = Array.from(document.querySelectorAll('[id^="filter-all-"]'))
        .map(el => el.id.replace('filter-all-', ''));

    // Hilfsfunktion: Checkboxen synchronisieren
    function setCheckboxState(type, checked) {
        pollIds.forEach(pollId => {
            const el = document.getElementById(`filter-${type}-${pollId}`);
            if (el) el.checked = checked;
        });
    }

    // Hilfsfunktion: Status der Filter-Checkboxen abfragen
    function getFilterStates() {
        const states = {};
        states.all = document.getElementById(`filter-all-${pollIds[0]}`)?.checked;
        filterTypes.forEach(type => {
            states[type] = document.getElementById(`filter-${type}-${pollIds[0]}`)?.checked;
        });
        return states;
    }

    // Hilfsfunktion: Ausgewählte Kategorien abfragen
    function getSelectedCategories() {
        const menu = document.getElementById(`category-dropdown-menu-${pollIds[0]}`);
        if (!menu) return [];
        return Array.from(menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
    }

    // Hilfsfunktion: Alle Kategorien aus allen Listen sammeln
    function getAllAvailableCategories() {
        const allCategories = new Set();
        pollIds.forEach(pollId => {
            const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
            if (menu) {
                menu.querySelectorAll('.category-checkbox').forEach(cb => {
                    allCategories.add(cb.value);
                });
            }
        });
        return Array.from(allCategories);
    }

    // Hilfsfunktion: Gemeinsame Kategorien zwischen allen Listen
    function getCommonCategories() {
        let common = null;
        pollIds.forEach(pollId => {
            const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
            if (menu) {
                const values = Array.from(menu.querySelectorAll('.category-checkbox')).map(cb => cb.value);
                if (common === null) {
                    common = new Set(values);
                } else {
                    common = new Set(values.filter(v => common.has(v)));
                }
            }
        });
        return common ? Array.from(common) : [];
    }

    // Hilfsfunktion: Kategorie-Checkboxen synchronisieren (nur gemeinsame Kategorien)
    function setCategoryCheckboxes(selectedValues) {
        const commonCategories = getCommonCategories();
        pollIds.forEach(pollId => {
            const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
            if (menu) {
                menu.querySelectorAll('.category-checkbox').forEach(cb => {
                    if (commonCategories.includes(cb.value)) {
                        cb.checked = selectedValues.includes(cb.value);
                    } else {
                        // Nur lokale Kategorien: nur in dieser Liste setzen
                        cb.checked = selectedValues.length === 0 ? true : selectedValues.includes(cb.value);
                    }
                });
            }
        });
    }

    // Initialisiert Kategorie-Checkboxen: alle aktiv, falls keine Vorauswahl
    function initializeCategoryCheckboxes() {
        pollIds.forEach(pollId => {
            const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
            if (menu) {
                const checkboxes = Array.from(menu.querySelectorAll('.category-checkbox'));
                if (!checkboxes.some(cb => cb.checked)) {
                    checkboxes.forEach(cb => cb.checked = true);
                }
            }
        });
    }

    // Kategorie-Auswahl aktualisieren und synchronisieren
    function updateCategorySelection(menu, selectedValues) {
        if (selectedValues.length === 0) {
            // "Alle anzeigen": alle Kategorien aus allen Listen
            const allValues = getAllAvailableCategories();
            pollIds.forEach(pollId => {
                const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
                if (menu) {
                    menu.querySelectorAll('.category-checkbox').forEach(cb => cb.checked = true);
                }
            });
        } else {
            // Synchronisiere nur gemeinsame Kategorien
            const commonCategories = getCommonCategories();
            const syncValues = selectedValues.filter(v => commonCategories.includes(v));
            setCategoryCheckboxes(syncValues);

            // Lokale Kategorien: nur in der jeweiligen Liste setzen
            pollIds.forEach(pollId => {
                const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
                if (menu) {
                    menu.querySelectorAll('.category-checkbox').forEach(cb => {
                        if (!commonCategories.includes(cb.value)) {
                            cb.checked = selectedValues.includes(cb.value);
                        }
                    });
                }
            });
        }
        updateAllCategories();
    }

    // Shortcut- und Touch-Handler für Kategorie-Labels und Checkboxen
    function setupCategoryShortcuts() {
        pollIds.forEach(pollId => {
            const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
            if (!menu) return;

            // Handler für Label
            menu.querySelectorAll('.category-label-shortcut').forEach(label => {
                let longPressTimer, isTouch = false, touchMoved = false;
                const getCheckbox = () => menu.querySelector(`#${label.getAttribute('for')}`);

                function handleToggle(cb) {
                    cb.checked = !cb.checked;
                    const selected = Array.from(menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
                    updateCategorySelection(menu, selected);
                }

                function handleSelectOnly(cb) {
                    setCategoryCheckboxes([cb.value]);
                    updateAllCategories();
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

            // Handler für Checkbox
            menu.querySelectorAll('.category-checkbox').forEach(cb => {
                let longPressTimer, isTouch = false;

                cb.addEventListener('change', () => {
                    const selected = Array.from(menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
                    updateCategorySelection(menu, selected);
                });

                cb.addEventListener('dblclick', e => {
                    if (isTouch) return;
                    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
                    setCategoryCheckboxes([cb.value]);
                    updateAllCategories();
                    return false;
                });

                cb.addEventListener('touchstart', () => {
                    isTouch = true;
                    longPressTimer = setTimeout(() => {
                        setCategoryCheckboxes([cb.value]);
                        updateAllCategories();
                    }, 500);
                });
                cb.addEventListener('touchend', () => {
                    clearTimeout(longPressTimer);
                    setTimeout(() => { isTouch = false; }, 100);
                });
            });
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
        // Hole alle ausgewählten Kategorien aus allen Listen
        const selectedByPoll = {};
        pollIds.forEach(pollId => {
            const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
            if (menu) {
                selectedByPoll[pollId] = Array.from(menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
            }
        });

        pollIds.forEach(pollId => {
            const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
            const allCategoryValues = Array.from(menu.querySelectorAll('.category-checkbox')).map(cb => cb.value);
            const categories = document.querySelectorAll(`#mucke-${pollId} .register-category`);
            const selectedCategories = selectedByPoll[pollId];

            // "Alle anzeigen": alle Kategorien aus allen Listen
            const allSelected = pollIds.every(pid => {
                const sel = selectedByPoll[pid];
                return sel.length === 0 || sel.length === Array.from(document.getElementById(`category-dropdown-menu-${pid}`).querySelectorAll('.category-checkbox')).length;
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

    // Spalten für alle Listen aktualisieren (inkl. Kategorien)
    function updateAllColumns() {
        const states = getFilterStates();
        pollIds.forEach(pollId => {
            if (states.all) {
                filterTypes.forEach(type => {
                    document.querySelectorAll(`#mucke-${pollId} .column.${type}`).forEach(col =>
                        col.classList.remove('d-none')
                    );
                });
            } else {
                filterTypes.forEach(type => {
                    document.querySelectorAll(`#mucke-${pollId} .column.${type}`).forEach(col =>
                        col.classList.toggle('d-none', !states[type])
                    );
                });
            }
            const visibleColumns = filterTypes.filter(type =>
                !document.querySelector(`#mucke-${pollId} .column.${type}`)?.classList.contains('d-none')
            );
            document.querySelectorAll(`#mucke-${pollId} .fill-entry`).forEach(el =>
                el.classList.toggle('hidden', visibleColumns.length === 1)
            );
        });
        updateAllCategories();
    }

    // Buttons und Checkboxen synchronisieren und Spalten aktualisieren
    function handleFilterChange(type, checked) {
        if (type === 'all') {
            setCheckboxState('all', checked);
            filterTypes.forEach(t => setCheckboxState(t, false));
        } else {
            setCheckboxState(type, checked);
            setCheckboxState('all', false);
            const allChecked = filterTypes.every(t =>
                document.getElementById(`filter-${t}-${pollIds[0]}`)?.checked
            );
            if (allChecked) {
                setCheckboxState('all', true);
                filterTypes.forEach(t => setCheckboxState(t, false));
            }
            if (!filterTypes.some(t =>
                document.getElementById(`filter-${t}-${pollIds[0]}`)?.checked
            )) {
                setCheckboxState('all', true);
            }
        }
        updateAllColumns();
    }

    // Event-Handler für Filter-Buttons
    pollIds.forEach(pollId => {
        const radio = document.getElementById(`filter-all-${pollId}`);
        if (radio) {
            radio.addEventListener('change', () => handleFilterChange('all', radio.checked));
        }
        filterTypes.forEach(type => {
            const cb = document.getElementById(`filter-${type}-${pollId}`);
            if (cb) {
                cb.addEventListener('change', () => handleFilterChange(type, cb.checked));
            }
        });
        const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
        if (menu) {
            menu.addEventListener('change', e => {
                if (e.target.classList.contains('category-checkbox')) {
                    const selected = Array.from(menu.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
                    setCategoryCheckboxes(selected);
                    updateAllCategories();
                }
            });
            const selectAllBtn = menu.querySelector('.category-select-all-btn');
            if (selectAllBtn) {
                selectAllBtn.addEventListener('click', () => {
                    const allValues = Array.from(menu.querySelectorAll('.category-checkbox')).map(cb => cb.value);
                    setCategoryCheckboxes(allValues);
                    updateAllCategories();
                });
            }
        }
    });

    // Globale Highlight-Status
    let highlightedUser = null;
    let highlightedPollId = null;
    let previousCategorySelection = null; // NEU: Merkt sich die Kategorie-Auswahl vor Highlight

    // Globale Funktion zum Entfernen des Highlights
    function clearHighlight(restoreCategories = false) {
        pollIds.forEach(pid => {
            const els = document.querySelectorAll(`#mucke-${pid} .alert[data-user-id]`);
            els.forEach(e => e.classList.remove('alert-info'));
        });
        highlightedUser = null;
        highlightedPollId = null;
        // Kategorien wiederherstellen, falls gewünscht
        if (restoreCategories && previousCategorySelection) {
            setCategoryCheckboxes(previousCategorySelection);
            updateAllCategories();
            previousCategorySelection = null;
        } else {
            updateAllCategories();
            previousCategorySelection = null;
        }
    }

    // Globale Funktion zum Anzeigen nur der User-Kategorien in ALLEN Listen
    function showOnlyUserCategoriesGlobal(userId) {
        pollIds.forEach(pollId => {
            const categoriesWithUser = [];
            const categories = document.querySelectorAll(`#mucke-${pollId} .register-category`);
            categories.forEach(cat => {
                const userInCat = cat.querySelector(`.alert[data-user-id="${userId}"]`);
                if (userInCat) {
                    categoriesWithUser.push(cat.getAttribute('data-category-name'));
                }
            });

            categories.forEach(cat => {
                const catName = cat.getAttribute('data-category-name');
                cat.classList.toggle('d-none', !categoriesWithUser.includes(catName));
            });

            const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
            if (menu) {
                menu.querySelectorAll('.category-checkbox').forEach(cb => {
                    cb.checked = categoriesWithUser.includes(cb.value);
                });
            }
        });
    }

    // Highlight-Logik für User-Elemente in Muckenlisten
    function setupUserHighlighting() {
        pollIds.forEach(pollId => {
            const container = document.getElementById(`mucke-${pollId}`);
            if (!container) return;

            const userElements = Array.from(container.querySelectorAll('.alert[data-user-id]'));
            const slotElements = Array.from(container.querySelectorAll('.alert:not([data-user-id])'));

            // Zähle Vorkommen der User-IDs nur innerhalb dieser Muckenliste
            const userIdCounts = {};
            userElements.forEach(el => {
                const userId = el.getAttribute('data-user-id');
                userIdCounts[userId] = (userIdCounts[userId] || 0) + 1;
            });

            const highlightableUserIds = Object.keys(userIdCounts).filter(uid => userIdCounts[uid] > 1);

            userElements.forEach(el => {
                const userId = el.getAttribute('data-user-id');
                if (highlightableUserIds.includes(userId)) {
                    el.classList.add('pointer');
                } else {
                    el.classList.remove('pointer');
                }
            });

            function highlightUser(userId, pollId) {
                pollIds.forEach(pid => {
                    const els = document.querySelectorAll(`#mucke-${pid} .alert[data-user-id]`);
                    els.forEach(e => e.classList.remove('alert-info'));
                });
                const els = document.querySelectorAll(`#mucke-${pollId} .alert[data-user-id="${userId}"]`);
                els.forEach(e => e.classList.add('alert-info'));
            }

            userElements.forEach(el => {
                const userId = el.getAttribute('data-user-id');
                if (highlightableUserIds.includes(userId)) {
                    el.addEventListener('mouseenter', () => {
                        if (highlightedUser) return;
                        highlightUser(userId, pollId);
                    });
                    el.addEventListener('mouseleave', () => {
                        if (highlightedUser) return;
                        clearHighlight();
                    });
                    el.addEventListener('click', e => {
                        e.stopPropagation();
                        if (highlightedUser === userId && highlightedPollId === pollId) {
                            // Highlight entfernen und Kategorien wiederherstellen
                            clearHighlight(true);
                        } else {
                            // Vor Highlight: Kategorie-Auswahl merken
                            previousCategorySelection = getSelectedCategories();
                            highlightedUser = userId;
                            highlightedPollId = pollId;
                            highlightUser(userId, pollId);
                            showOnlyUserCategoriesGlobal(userId); // Synchronisiere Kategorien global
                        }
                    });
                } else {
                    el.addEventListener('click', () => {
                        clearHighlight();
                    });
                }
            });

            slotElements.forEach(el => {
                el.addEventListener('click', () => {
                    clearHighlight();
                });
            });
        });

        // Klick außerhalb entfernt das Highlight
        document.body.addEventListener('click', e => {
            if (!e.target.closest('.alert[data-user-id]') && !e.target.closest('.alert:not([data-user-id])')) {
                clearHighlight();
            }
        });

        // EINZELNER Listener für Kategorie-Menü: Highlight entfernen bei manueller Änderung
        pollIds.forEach(pollId => {
            const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
            if (menu) {
                menu.addEventListener('change', e => {
                    if (highlightedUser) {
                        clearHighlight();
                    }
                });
            }
        });
    }

    // Initialisierung
    initializeCategoryCheckboxes();
    setupCategoryShortcuts();
    setupCategoryInfoTooltip();
    updateAllColumns();
    setupUserHighlighting();
});
