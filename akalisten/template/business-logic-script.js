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

    // Spalten für alle Listen aktualisieren
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
        });
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

    // Initiales Setzen
    updateAllColumns();
});
