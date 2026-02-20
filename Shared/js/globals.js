const state = {
    currentDate: new Date(),
    today: new Date(),
};

const UI = {
    showModal: (htmlContent) => {
        const container = document.getElementById('modal-container');
        container.innerHTML = htmlContent;
        document.getElementById('modal-overlay').classList.remove('hidden');
    },
    hideModal: () => {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.getElementById('modal-container').innerHTML = '';
    },
    formatDate: (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    },
    getMonthName: (monthIndex) => {
        const months = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
        return months[monthIndex];
    },
    getDayName: (dayIndex) => {
        const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
        return days[dayIndex];
    },
    generateId: () => {
        return Math.random().toString(36).substr(2, 9);
    }
};

document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') {
        const saveBtn = document.getElementById('modal-save-btn');
        if (saveBtn) {
            saveBtn.click();
        } else {
            UI.hideModal();
        }
    }
});
