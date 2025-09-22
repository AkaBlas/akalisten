class MuckenlistenManager {
    constructor() {
        this.muckenlisten = [];
        this.pollIds = [];
    }

    init() {
        this.pollIds = Array.from(document.querySelectorAll('[id^="filter-all-"]'))
            .map(el => el.id.replace('filter-all-', ''));
        this.muckenlisten = this.pollIds.map(id => new Muckenliste(id));
    }

    getPollIds() {
        return this.pollIds;
    }

    getAllAvailableCategories() {
        const allCategories = new Set();
        this.muckenlisten.forEach(list => {
            list.getAllCategories().forEach(cat => allCategories.add(cat));
        });
        return Array.from(allCategories);
    }

    getCommonCategories() {
        if (this.muckenlisten.length === 0) return [];
        let common = new Set(this.muckenlisten[0].getAllCategories());
        this.muckenlisten.slice(1).forEach(list => {
            const values = list.getAllCategories();
            common = new Set(values.filter(v => common.has(v)));
        });
        return Array.from(common);
    }

    getMenus() {
        return this.muckenlisten.map(list => list.menu).filter(Boolean);
    }
}
