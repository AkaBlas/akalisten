document.addEventListener('DOMContentLoaded', () => {
    // Hilfsfunktion: Sichtbarkeit der "not-voted"-Spalten setzen
    function setNotVotedColumnVisibility(visible) {
        document.querySelectorAll('.column.not-voted').forEach(col => {
            col.style.display = visible ? '' : 'none';
        });
        // Icon in allen Buttons synchronisieren
        document.querySelectorAll('[id^="not-voted-icon-"]').forEach(icon => {
            icon.innerHTML = visible
                ? '<i class="bi bi-eye"></i>'
                : '<i class="bi bi-eye-slash"></i>';
        });
        // Checkboxen synchronisieren
        document.querySelectorAll('[id^="not-voted-checkbox-"]').forEach(cb => {
            cb.checked = visible;
        });
    }

    // Initial: Spalte anzeigen
    setNotVotedColumnVisibility(true);

    // Event-Listener für alle "Keine Antwort"-Checkboxen
    document.querySelectorAll('[id^="not-voted-checkbox-"]').forEach(cb => {
        cb.addEventListener('change', function() {
            setNotVotedColumnVisibility(cb.checked);
        });
    });
});