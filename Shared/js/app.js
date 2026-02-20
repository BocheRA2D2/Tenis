document.addEventListener('DOMContentLoaded', () => {
    // Tabs Navigation
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.nav-btn.active').classList.remove('active');
            btn.classList.add('active');

            document.querySelector('.tab-content.active').classList.remove('active');
            const targetId = btn.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');

            refreshCurrentTab();
        });
    });

    // Month display
    updateMonthDisplay();

    document.getElementById('prev-month-btn').addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        updateMonthDisplay();
    });

    document.getElementById('next-month-btn').addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        updateMonthDisplay();
    });

    refreshCurrentTab();
});

function updateMonthDisplay() {
    document.getElementById('current-month-display').textContent =
        `${UI.getMonthName(state.currentDate.getMonth())} ${state.currentDate.getFullYear()}`;
    refreshCurrentTab();
    checkUnpaidDebts();
}

function refreshCurrentTab() {
    const activeTab = document.querySelector('.tab-content.active').id;
    if (activeTab === 'tab-calendar' && typeof Calendar !== 'undefined') Calendar.render();
    if (activeTab === 'tab-players' && typeof Players !== 'undefined') Players.render();
    if (activeTab === 'tab-tables' && typeof Tables !== 'undefined') Tables.render();
    if (activeTab === 'tab-settings' && typeof Settings !== 'undefined') Settings.render();
}

async function checkUnpaidDebts() {
    const debtAlert = document.getElementById('prev-month-alert');
    // Global assumptions point 6: red dot on back arrow if un-paid debts exist in previous months
    // We can do a simplistic global check
    const hasDebt = await DB.checkGlobalDebts();

    // Simplification: just show it if there's any debt anywhere basically, 
    // or if we're in the current month AND there are debts in older months.
    const isCurrentMonth = state.currentDate.getMonth() === state.today.getMonth() && state.currentDate.getFullYear() === state.today.getFullYear();

    if (isCurrentMonth && hasDebt) {
        debtAlert.classList.remove('hidden');
    } else {
        debtAlert.classList.add('hidden');
    }
}
