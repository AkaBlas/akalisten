/**
 * UserHighlightManager verwaltet die Hervorhebung von Nutzern in den Muckenlisten.
 * @class
 * @param {MuckenlistenManager} muckenlistenManager
 * @param {CategoryManager} categoryManager
 */
class UserHighlightManager {
    constructor(muckenlistenManager, categoryManager) {
        this.muckenlistenManager = muckenlistenManager;
        this.categoryManager = categoryManager;
        this.highlightedUser = null;
        this.highlightedPollId = null;
        this.previousCategorySelection = null;
    }

    /**
     * Hebt die Hervorhebung auf und stellt ggf. die vorherige Kategorieauswahl wieder her.
     * @param {boolean} restoreCategories - Ob die Kategorienauswahl wiederhergestellt werden soll.
     */
    clearHighlight(restoreCategories = false) {
        this.muckenlistenManager.getPollIds().forEach(pid => {
            const els = document.querySelectorAll(`#mucke-${pid} .alert[data-user-id]`);
            els.forEach(e => e.classList.remove('alert-info'));
        });
        this.highlightedUser = null;
        this.highlightedPollId = null;
        if (restoreCategories && this.previousCategorySelection) {
            this.categoryManager.setCategoryCheckboxes(this.previousCategorySelection);
            this.categoryManager.updateAllCategories();
            this.previousCategorySelection = null;
        } else {
            this.categoryManager.updateAllCategories();
            this.previousCategorySelection = null;
        }
    }

    /**
     * Zeigt nur die Kategorien an, in denen der Nutzer vorkommt (global).
     * @param {string} userId
     */
    showOnlyUserCategoriesGlobal(userId) {
        this.muckenlistenManager.getPollIds().forEach(pollId => {
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

    /**
     * Hebt einen Nutzer in einer bestimmten Muckenliste hervor.
     * @param {string} userId
     * @param {string} pollId
     */
    highlightUser(userId, pollId) {
        this.muckenlistenManager.getPollIds().forEach(pid => {
            const els = document.querySelectorAll(`#mucke-${pid} .alert[data-user-id]`);
            els.forEach(e => e.classList.remove('alert-info'));
        });
        const els = document.querySelectorAll(`#mucke-${pollId} .alert[data-user-id="${userId}"]`);
        els.forEach(e => e.classList.add('alert-info'));
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
        pollIds.forEach(pollId => {
            const container = document.getElementById(`mucke-${pollId}`);
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
                        this.highlightUser(userId, pollId);
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
                            this.highlightUser(userId, pollId);
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
        pollIds.forEach(pollId => {
            const menu = document.getElementById(`category-dropdown-menu-${pollId}`);
            if (menu) {
                menu.addEventListener('change', e => {
                    if (this.highlightedUser) {
                        this.clearHighlight();
                    }
                });
            }
        });
    }
}
