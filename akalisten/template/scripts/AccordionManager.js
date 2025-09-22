// AccordionManager.js
// Verwaltet die Persistenz und Wiederherstellung des Status aller Accordions

/**
 * AccordionManager
 * Verwaltet die Wiederherstellung und Speicherung des Status (offen/geschlossen) aller Accordions auf der Seite.
 * Nutzt StorageManager zur zentralen Persistenz.
 *
 * Methoden:
 * - constructor(storageManager): Initialisiert mit einer StorageManager-Instanz.
 * - init(): Findet alle Accordions, stellt deren Status wieder her und setzt Event-Listener für Statusänderungen.
 */
class AccordionManager {
    /**
     * Erstellt einen neuen AccordionManager.
     * @param {StorageManager} storageManager - Instanz des StorageManagers zur Persistenz.
     */
    constructor(storageManager) {
        this.storageManager = storageManager;
    }

    /**
     * Initialisiert alle Accordions: Status wiederherstellen und Event-Listener setzen.
     * Findet alle Elemente mit [data-bs-toggle="collapse"], generiert eindeutige IDs und synchronisiert den Status.
     */
    init() {
        document.querySelectorAll('.accordion-collapse').forEach(targetEl => {
            const accordionId = targetEl.id;
            // Status beim Laden wiederherstellen
            const isOpen = this.storageManager.getAccordionStatus(accordionId);
            if (isOpen) {
                targetEl.classList.add('show');
                targetEl.setAttribute('aria-expanded', 'true');
            } else {
                targetEl.classList.remove('show');
                targetEl.setAttribute('aria-expanded', 'false');
            }
            // Bootstrap Collapse Events für Statusänderung
            targetEl.addEventListener('shown.bs.collapse', (event) => {
                if (event.target.id !== accordionId) {return}
                this.storageManager.setAccordionStatus(accordionId, true);
            });
            targetEl.addEventListener('hidden.bs.collapse', (event) => {
                if (event.target.id !== accordionId) {return}
                this.storageManager.setAccordionStatus(accordionId, false);
            });
        });
    }
}

window.AccordionManager = AccordionManager;
