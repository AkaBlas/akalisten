document.addEventListener('DOMContentLoaded', () => {
    // Hilfsfunktion: alle Buttons/Checkboxen synchronisieren
    function syncButtons(type, checked) {
        document.querySelectorAll('.filter-' + type).forEach(el => {
            el.checked = checked;
        });
    }

    function getButtonStates() {
        return {
            all: document.querySelector('.filter-all')?.checked,
            yes: document.querySelector('.filter-yes')?.checked,
            no: document.querySelector('.filter-no')?.checked,
            maybe: document.querySelector('.filter-maybe')?.checked,
            pending: document.querySelector('.filter-pending')?.checked
        };
    }

    function updateColumnsGlobal() {
        const states = getButtonStates();
        // Alle Spalten in allen Listen
        document.querySelectorAll('.column.yes').forEach(col => col.classList.toggle('d-none', !(states.all || states.yes)));
        document.querySelectorAll('.column.no').forEach(col => col.classList.toggle('d-none', !(states.all || states.no)));
        document.querySelectorAll('.column.maybe').forEach(col => col.classList.toggle('d-none', !(states.all || states.maybe)));
        document.querySelectorAll('.column.pending').forEach(col => col.classList.toggle('d-none', !(states.all || states.pending)));
    }

    // Event-Handler für "Alle"
    document.querySelectorAll('.filter-all').forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                syncButtons('yes', false);
                syncButtons('no', false);
                syncButtons('maybe', false);
                syncButtons('pending', false);
            }
            syncButtons('all', radio.checked);
            updateColumnsGlobal();
        });
    });

    // Event-Handler für Checkboxen
    ['yes', 'no', 'maybe', 'pending'].forEach(type => {
        document.querySelectorAll('.filter-' + type).forEach(cb => {
            cb.addEventListener('change', () => {
                // Wenn eine Checkbox aktiv, "Alle" deaktivieren
                if (cb.checked) {
                    syncButtons('all', false);
                }
                // Prüfen, ob keine Checkbox aktiv ist
                const anyChecked = ['yes', 'no', 'maybe', 'pending'].some(t =>
                    Array.from(document.querySelectorAll('.filter-' + t)).some(el => el.checked)
                );
                if (!anyChecked) {
                    syncButtons('all', true);
                }
                updateColumnsGlobal();
            });
        });
    });

    // Initiales Setzen
    updateColumnsGlobal();
});
