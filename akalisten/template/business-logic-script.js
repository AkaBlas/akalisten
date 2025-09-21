document.addEventListener('DOMContentLoaded', () => {
    const filterTypes = ['yes', 'no', 'maybe', 'pending'];

    // Hilfsfunktion: alle Buttons/Checkboxen synchronisieren
    function syncButtons(type, checked) {
        document.querySelectorAll('.filter-' + type).forEach(el => {
            el.checked = checked;
        });
    }

    function getButtonStates() {
        const states = {};
        states.all = document.querySelector('.filter-all')?.checked;
        filterTypes.forEach(type => {
            states[type] = document.querySelector('.filter-' + type)?.checked;
        });
        return states;
    }

    function updateColumnsGlobal() {
        const states = getButtonStates();
        filterTypes.forEach(type => {
            document.querySelectorAll('.column.' + type).forEach(col =>
                col.classList.toggle('d-none', !(states.all || states[type]))
            );
        });
    }

    // Event-Handler für "Alle"
    document.querySelectorAll('.filter-all').forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                filterTypes.forEach(type => syncButtons(type, false));
            }
            syncButtons('all', radio.checked);
            updateColumnsGlobal();
        });
    });

    // Event-Handler für Checkboxen
    filterTypes.forEach(type => {
        document.querySelectorAll('.filter-' + type).forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) {
                    syncButtons('all', false);
                }
                // Prüfen, ob alle Checkboxen aktiv sind
                const allChecked = filterTypes.every(t =>
                    Array.from(document.querySelectorAll('.filter-' + t)).some(el => el.checked)
                );
                if (allChecked) {
                    syncButtons('all', true);
                    filterTypes.forEach(t => syncButtons(t, false));
                } else {
                    // Prüfen, ob keine Checkbox aktiv ist
                    const anyChecked = filterTypes.some(t =>
                        Array.from(document.querySelectorAll('.filter-' + t)).some(el => el.checked)
                    );
                    if (!anyChecked) {
                        syncButtons('all', true);
                    }
                }
                updateColumnsGlobal();
            });
        });
    });

    // Initiales Setzen
    updateColumnsGlobal();
});
