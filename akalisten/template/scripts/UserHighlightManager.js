/**
 * UserHighlightManager verwaltet die Hervorhebung von Nutzern in den Muckenlisten.
 * @class
 * @param {MuckenlistenManager} muckenlistenManager
 * @param {CategoryManager} categoryManager
 */
class UserHighlightManager {
    constructor(muckenlistenManager, categoryManager, storageManager) {
        this.muckenlistenManager = muckenlistenManager;
        this.categoryManager = categoryManager;
        this.storageManager = storageManager;
        this.highlightedUser = null;
        this.highlightedPollId = null;
        this.previousCategorySelection = null;
    }

    /**
     * Hebt die Hervorhebung auf und stellt ggf. die vorherige Kategorieauswahl wieder her.
     * @param {boolean} restoreCategories - Ob die Kategorienauswahl wiederhergestellt werden soll.
     */
    clearHighlight(restoreCategories = false) {
        this.muckenlistenManager.clearUserHighlight();
        this.muckenlistenManager.getPollIds().forEach(pid => {
            // Entferne Hervorhebung im Storage
            this.storageManager.removeUserHighlighting(pid);
        });
        this.highlightedUser = null;
        this.highlightedPollId = null;
        if (restoreCategories && this.previousCategorySelection) {
            this.categoryManager.setCategoryCheckboxes(this.previousCategorySelection);
            this.categoryManager.updateCategoryVisibility();
            this.previousCategorySelection = null;
        } else {
            this.categoryManager.updateCategoryVisibility();
            this.previousCategorySelection = null;
        }
    }

    /**
     * Zeigt nur die Kategorien an, in denen der Nutzer vorkommt (global).
     * @param {string} userId
     */
    showOnlyUserCategoriesGlobal(userId) {
        this.muckenlistenManager.muckenlisten.forEach(list => {
            const categoriesWithUser = list.getCategoriesWithUser(userId);
            list.updateCategoryVisibility(categoriesWithUser);
            list.setCategoryCheckboxes(categoriesWithUser);
            this.storageManager.setCategorySelection(list.pollId, categoriesWithUser);
        });
    }

    /**
     * Hebt einen Nutzer in einer bestimmten Muckenliste hervor.
     * @param {string} userId
     * @param {string} pollId
     * @param {boolean} permanent - Ob die Hervorhebung dauerhaft ist
     */
    highlightUser(userId, pollId, permanent) {
        this.muckenlistenManager.highlightUser(userId, pollId);
        if (permanent) {
            this.highlightedUser = userId;
            this.highlightedPollId = pollId;
            // Speichere Hervorhebung im StorageManager
            this.storageManager.setUserHighlighting(pollId, userId);
        }
    }

    /**
     * Richtet die Event Listener für die Hervorhebung von Nutzern ein.
     * Event Listener:
     * - mouseenter/mouseleave: Zeigt/entfernt die Hervorhebung
     * - click: Zeigt nur die Kategorien des Nutzers oder hebt die Hervorhebung auf
     * - change auf Kategorie-Menü: Hebt die Hervorhebung auf
     * - click auf Slot-Elemente: Hebt die Hervorhebung auf
     * - click auf Body: Hebt die Hervorhebung auf, wenn außerhalb geklickt wird
     */
    setupUserHighlighting() {
        const pollIds = this.muckenlistenManager.getPollIds();
        // Restore Highlighting aus StorageManager
        pollIds.forEach(pollId => {
            const highlightedUser = this.storageManager.getUserHighlighting(pollId);
            if (highlightedUser) {
                this.highlightUser(highlightedUser, pollId, true);
            }
        });
        pollIds.forEach(pollId => {
            const container = document.getElementById(`muckenliste-${pollId}`);
            if (!container) return;
            const userElements = Array.from(container.querySelectorAll('.alert[data-user-id]'));
            const slotElements = Array.from(container.querySelectorAll('.alert:not([data-user-id])'));
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
            userElements.forEach(el => {
                const userId = el.getAttribute('data-user-id');
                if (highlightableUserIds.includes(userId)) {
                    el.addEventListener('mouseenter', () => {
                        if (this.highlightedUser) return;
                        this.highlightUser(userId, pollId, false);
                    });
                    el.addEventListener('mouseleave', () => {
                        if (this.highlightedUser) return;
                        this.clearHighlight();
                    });
                    el.addEventListener('click', e => {
                        e.stopPropagation();
                        if (this.highlightedUser === userId && this.highlightedPollId === pollId) {
                            this.clearHighlight(true);
                        } else {
                            this.previousCategorySelection = this.categoryManager.muckenlistenManager.muckenlisten[0].getSelectedCategories();
                            this.highlightedUser = userId;
                            this.highlightedPollId = pollId;
                            this.highlightUser(userId, pollId, true);
                            this.showOnlyUserCategoriesGlobal(userId);
                        }
                    });
                } else {
                    el.addEventListener('click', () => {
                        this.clearHighlight();
                    });
                }
            });
            slotElements.forEach(el => {
                el.addEventListener('click', () => {
                    this.clearHighlight();
                });
            });
        });
        document.body.addEventListener('click', e => {
            if (!e.target.closest('.alert[data-user-id]') && !e.target.closest('.alert:not([data-user-id])')) {
                this.clearHighlight();
            }
        });
        this.muckenlistenManager.getMenus().forEach(menu => {
            if (menu) {
                menu.addEventListener('change', () => {
                    if (this.highlightedUser) {
                        this.clearHighlight();
                    }
                });
            }
        });
    }
}
