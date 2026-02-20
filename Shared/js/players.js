const Players = {
    async render() {
        const container = document.getElementById('players-list');
        container.innerHTML = '<div style="padding:20px; text-align:center;">Ładowanie...</div>';

        const year = state.currentDate.getFullYear();
        const month = state.currentDate.getMonth();
        const yearMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

        // Get players, trainings, reservations for this month
        const [players, trainings, reservations] = await Promise.all([
            DB.getPlayers(),
            DB.getTrainingsForMonth(yearMonthStr),
            DB.getReservations(yearMonthStr)
        ]);

        container.innerHTML = '';
        if (players.length === 0) {
            container.innerHTML = '<div style="padding:20px; text-align:center;">Brak graczy w bazie.</div>';
        }

        players.forEach(p => {
            // Find activity in current month
            let hasActivity = false;
            let hasDebt = false;

            // trainings
            trainings.forEach(t => {
                if (t.canceled) return;
                const pInT = (t.players || []).find(tp => tp.id === p.id);
                if (pInT) {
                    hasActivity = true;
                    if (!pInT.paid) hasDebt = true;
                }
            });

            // reservations - assuming res.who === p.id 
            reservations.forEach(r => {
                if (r.who === p.id) {
                    hasActivity = true;
                    if (!r.paid) hasDebt = true;
                }
            });

            const item = document.createElement('div');
            item.className = 'list-item';

            let statusHtml = '';
            if (hasActivity) {
                if (hasDebt) {
                    statusHtml = '<span class="text-danger" style="font-size: 0.8rem; font-weight:bold;">Zaległości</span>';
                    item.classList.add('has-alert');
                } else {
                    statusHtml = '<span class="text-success" style="font-size: 0.8rem; font-weight:bold;">Opłacone</span>';
                }
            }

            item.innerHTML = `
                <div>
                    <div class="item-title">${p.name} ${p.surname}</div>
                    <div class="item-subtitle">${p.phone || 'Brak telefonu'}</div>
                </div>
                <div class="item-right">
                    ${statusHtml}
                </div>
            `;

            item.addEventListener('click', () => Players.openDetails(p, trainings, reservations));
            container.appendChild(item);
        });

        const addBtn = document.getElementById('add-new-player-btn');
        addBtn.onclick = () => Players.openAddForm();
    },

    openDetails(player, trainings, reservations) {
        // Calculate history & stats
        let trainingCount = 0;
        let tableHours = 0;
        let debtAmount = 0;
        let historyHtml = '';

        const historyItems = [];

        trainings.forEach(t => {
            if (t.canceled) return;
            const pInT = (t.players || []).find(tp => tp.id === player.id);
            if (pInT) {
                trainingCount++;
                if (!pInT.paid) debtAmount += 35;
                historyItems.push({
                    type: 'training',
                    date: t.date,
                    time: t.time,
                    paid: pInT.paid,
                    id: t.id
                });
            }
        });

        reservations.forEach(r => {
            if (r.who === player.id) {
                tableHours += Number(r.duration);
                if (!r.paid) debtAmount += (20 * Number(r.duration));
                historyItems.push({
                    type: 'table',
                    date: r.date,
                    time: r.time,
                    duration: r.duration,
                    paid: r.paid,
                    id: r.id
                });
            }
        });

        // Sort history chronologically
        historyItems.sort((a, b) => a.date.localeCompare(b.date));

        if (historyItems.length === 0) {
            historyHtml = '<p class="text-muted">Brak aktywności w tym miesiącu.</p>';
        } else {
            historyHtml = historyItems.map(h => {
                const label = h.type === 'training' ? `Trening (${h.time})` : `Wynajęcie stołu (${h.duration}h, ${h.time})`;
                const cost = h.type === 'training' ? '35 zł' : `${20 * h.duration} zł`;
                return `
                    <div class="flex-between mb-2 pb-2" style="border-bottom: 1px solid #eee;">
                        <div>
                            <strong>${UI.formatDate(h.date)}</strong>
                            <div class="text-muted" style="font-size:0.85rem;">${label} - ${cost}</div>
                        </div>
                        <button class="btn btn-sm ${h.paid ? 'btn-success' : 'btn-danger'}" 
                            onclick="Players.toggleHistoryPaid('${h.type}', '${h.id}', '${player.id}', ${!h.paid})">
                            ${h.paid ? 'Zapłacone' : 'Do zapłaty'}
                        </button>
                    </div>
                `;
            }).join('');
        }

        const phoneBtn = player.phone ?
            `<a href="tel:${player.phone}" class="btn btn-primary" style="text-decoration:none;"><ion-icon name="call"></ion-icon> Zadzwoń</a>` : '';

        const html = `
            <div class="modal-header">
                <h2>${player.name} ${player.surname}</h2>
                <button class="close-modal" onclick="UI.hideModal()"><ion-icon name="close"></ion-icon></button>
            </div>
            
            <div class="flex-between mb-3" style="gap:10px;">
                ${phoneBtn}
                <button class="btn btn-outline" onclick="Players.openEditForm('${player.id}', '${player.name}', '${player.surname}', '${player.phone || ''}')">Edytuj</button>
                <button class="btn btn-danger" onclick="Players.deletePlayer('${player.id}')"><ion-icon name="trash"></ion-icon></button>
            </div>

            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <div class="flex-between mb-2">
                    <span>Ilość zajęć (treningów):</span> <strong>${trainingCount}</strong>
                </div>
                <div class="flex-between mb-2">
                    <span>Godziny wynajęcia stołu:</span> <strong>${tableHours} h</strong>
                </div>
                <div class="flex-between" style="border-top:1px solid #ddd; padding-top:8px; margin-top:8px;">
                    <span>Pozostała kwota do zapłaty:</span> 
                    <strong class="text-danger" style="font-size:1.1rem;">${debtAmount} zł</strong>
                </div>
            </div>

            <h3 style="margin-bottom: 10px;">Historia wpłat (obecny miesiąc)</h3>
            <div style="max-height: 200px; overflow-y:auto; padding-right:5px;">
                ${historyHtml}
            </div>
        `;

        UI.showModal(html);
    },

    openAddForm() {
        const html = `
            <div class="modal-header">
                <h2>Dodaj zawodnika</h2>
                <button class="close-modal" onclick="UI.hideModal()"><ion-icon name="close"></ion-icon></button>
            </div>
            <div class="form-group">
                <label>Imię</label>
                <input type="text" id="p-name" class="form-control mb-2"/>
                <label>Nazwisko</label>
                <input type="text" id="p-surname" class="form-control mb-2"/>
                <label>Telefon</label>
                <input type="tel" id="p-phone" class="form-control mb-3"/>
                <button class="btn btn-primary btn-block" onclick="Players.saveNewPlayer()">Zapisz</button>
            </div>
        `;
        UI.showModal(html);
    },

    async saveNewPlayer() {
        const name = document.getElementById('p-name').value.trim();
        const surname = document.getElementById('p-surname').value.trim();
        const phone = document.getElementById('p-phone').value.trim();
        if (name && surname) {
            await DB.addPlayer({ name, surname, phone });
            UI.hideModal();
            Players.render();
        } else {
            alert('Imię i nazwisko wymagane');
        }
    },

    openEditForm(id, name, surname, phone) {
        const html = `
            <div class="modal-header">
                <h2>Edytuj zawodnika</h2>
                <button class="close-modal" onclick="UI.hideModal()"><ion-icon name="close"></ion-icon></button>
            </div>
            <div class="form-group">
                <label>Imię</label>
                <input type="text" id="pe-name" value="${name}" class="form-control mb-2"/>
                <label>Nazwisko</label>
                <input type="text" id="pe-surname" value="${surname}" class="form-control mb-2"/>
                <label>Telefon</label>
                <input type="tel" id="pe-phone" value="${phone}" class="form-control mb-3"/>
                <button class="btn btn-primary btn-block" onclick="Players.saveEditPlayer('${id}')">Zapisz zmiany</button>
            </div>
        `;
        UI.showModal(html);
    },

    async saveEditPlayer(id) {
        const name = document.getElementById('pe-name').value.trim();
        const surname = document.getElementById('pe-surname').value.trim();
        const phone = document.getElementById('pe-phone').value.trim();
        if (name && surname) {
            await DB.updatePlayer(id, { name, surname, phone });
            UI.hideModal();
            Players.render();
        }
    },

    async deletePlayer(id) {
        if (confirm('Czy na pewno chcesz usunąć tego gracza z bazy?')) {
            await DB.deletePlayer(id);
            UI.hideModal();
            Players.render();
        }
    },

    async toggleHistoryPaid(type, activityId, playerId, isPaid) {
        if (type === 'training') {
            const t = await DB.getTraining(activityId);
            if (t) {
                const players = t.players.map(p => p.id === playerId ? { ...p, paid: isPaid } : p);
                await DB.setTraining(activityId, { players });
            }
        } else if (type === 'table') {
            await DB.updateReservation(activityId, { paid: isPaid });
        }

        // Re-fetch data for the modal
        const year = state.currentDate.getFullYear();
        const month = state.currentDate.getMonth();
        const yearMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

        const [players, trainings, reservations] = await Promise.all([
            DB.getPlayers(),
            DB.getTrainingsForMonth(yearMonthStr),
            DB.getReservations(yearMonthStr)
        ]);

        const p = players.find(x => x.id === playerId);
        if (p) {
            // Re-open details with updated data (this replaces the current modal content)
            Players.openDetails(p, trainings, reservations);
        }

        // Background refresh list and red dots
        Players.render();
        checkUnpaidDebts();
    }
};
