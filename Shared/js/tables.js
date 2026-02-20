const Tables = {
    async render() {
        const container = document.getElementById('tables-list');
        container.innerHTML = '<div style="padding:20px; text-align:center;">Ładowanie...</div>';

        const year = state.currentDate.getFullYear();
        const month = state.currentDate.getMonth();
        const yearMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

        const [reservations, players] = await Promise.all([
            DB.getReservations(yearMonthStr),
            DB.getPlayers()
        ]);

        // Sort chronologically
        reservations.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.time.localeCompare(b.time);
        });

        container.innerHTML = '';
        if (reservations.length === 0) {
            container.innerHTML = '<div style="padding:20px; text-align:center;">Brak rezerwacji w tym miesiącu.</div>';
        }

        reservations.forEach(r => {
            const player = players.find(p => p.id === r.who);
            const playerName = player ? `${player.name} ${player.surname}` : 'Nieznany';

            const item = document.createElement('div');
            item.className = 'list-item';
            if (!r.paid) item.classList.add('has-alert');

            const dateObj = new Date(r.date);
            const dayName = UI.getDayName(dateObj.getDay());

            item.innerHTML = `
                <div>
                    <div class="item-title">${dayName}, ${UI.formatDate(r.date)}</div>
                    <div class="item-subtitle">${r.time} (${r.duration}h) - ${playerName}</div>
                </div>
                <div class="item-right">
                    ${r.paid ? '<span class="text-success">Zapłacone</span>' : '<span class="text-danger">Do zapłaty</span>'}
                </div>
            `;

            item.addEventListener('click', () => Tables.openDetails(r, player, players));
            container.appendChild(item);
        });

        document.getElementById('add-table-reservation-btn').onclick = () => Tables.openAddForm(players);
    },

    async validateTime(dateStr, timeStr, duration) {
        const d = new Date(dateStr);
        if (d.getDay() === 5) {
            alert('W piątki nie można wynajmować stołu!');
            return false;
        }

        const [rHour, rMin] = timeStr.split(':').map(Number);
        const rStartMin = rHour * 60 + rMin;
        const rEndMin = rStartMin + (duration * 60);

        // Check against trainings that day
        const monthStr = dateStr.substring(0, 7);
        const trainings = await DB.getTrainingsForMonth(monthStr);
        // We consider defaults that fall on this day (Mon/Wed) or overriding trainings moved to this day
        // This is a simplistic check: look for any training active on dateStr
        let activeTrainings = [];
        // First see if there is an explicit DB entry on dateStr that is NOT moved away and NOT canceled
        const dbT = trainings.find(t => t.id === dateStr || t.movedTo === dateStr || t.originalDate === dateStr);

        let trainingTime = '18:00';
        let isTrainingDay = false;

        if (dbT) {
            if (!dbT.canceled && (dbT.movedTo === dateStr || (!dbT.movedTo && dbT.originalDate === dateStr) || dbT.id === dateStr && !dbT.movedTo)) {
                isTrainingDay = true;
                trainingTime = dbT.time || '18:00';
            }
        } else {
            // No DB override. Is it Mon/Wed?
            if (d.getDay() === 1 || d.getDay() === 3) {
                // If it wasn't moved away
                const movedAway = trainings.find(t => t.originalDate === dateStr && t.movedTo !== dateStr);
                if (!movedAway) {
                    isTrainingDay = true;
                }
            }
        }

        if (isTrainingDay) {
            const [tHour, tMin] = trainingTime.split(':').map(Number);
            const tStartMin = tHour * 60 + tMin;
            const tEndMin = tStartMin + 90; // Training is 1.5h

            // Overlap check
            if (rStartMin < tEndMin && rEndMin > tStartMin) {
                alert(`Kolizja z treningiem w godzinach ${trainingTime} - ${Math.floor(tEndMin / 60)}:${String(tEndMin % 60).padStart(2, '0')}`);
                return false;
            }
        }

        return true;
    },

    openAddForm(players) {
        const options = players.map(p => `<option value="${p.id}">${p.name} ${p.surname}</option>`).join('');
        const html = `
            <div class="modal-header">
                <h2>Wynajmij stół</h2>
                <button class="close-modal" onclick="UI.hideModal()"><ion-icon name="close"></ion-icon></button>
            </div>
            <div class="form-group">
                <label>Płyta / Data</label>
                <input type="date" id="tr-date" class="form-control mb-2" required/>
                <label>Godzina rozpoczęcia</label>
                <input type="time" id="tr-time" class="form-control mb-2" required/>
                <label>Ilość godzin</label>
                <input type="number" id="tr-dur" class="form-control mb-2" value="1" min="1" max="10"/>
                <label>Gracz</label>
                <select id="tr-who" class="form-control mb-3">
                    ${options}
                </select>
                <button class="btn btn-primary btn-block" onclick="Tables.saveNewReservation()">Zapisz rezerwację</button>
            </div>
        `;
        UI.showModal(html);
    },

    async saveNewReservation() {
        const date = document.getElementById('tr-date').value;
        const time = document.getElementById('tr-time').value;
        const duration = Number(document.getElementById('tr-dur').value);
        const who = document.getElementById('tr-who').value;

        if (!date || !time || !who) {
            alert('Wypełnij wszystkie pola');
            return;
        }

        const valid = await Tables.validateTime(date, time, duration);
        if (!valid) return;

        const month = date.substring(0, 7);
        await DB.addReservation({ date, time, duration, who, month, paid: false });
        UI.hideModal();
        Tables.render();
        checkUnpaidDebts();
    },

    openDetails(r, player, players) {
        const options = players.map(p => `<option value="${p.id}" ${p.id === r.who ? 'selected' : ''}>${p.name} ${p.surname}</option>`).join('');
        const cost = r.duration * 20;

        const html = `
            <div class="modal-header">
                <h2>Szczegóły rezerwacji</h2>
                <button class="close-modal" onclick="UI.hideModal()"><ion-icon name="close"></ion-icon></button>
            </div>
            <div class="form-group">
                <label>Data</label>
                <input type="date" id="tre-date" value="${r.date}" class="form-control mb-2"/>
                <label>Godzina</label>
                <input type="time" id="tre-time" value="${r.time}" class="form-control mb-2"/>
                <label>Ilość godzin</label>
                <input type="number" id="tre-dur" value="${r.duration}" class="form-control mb-2"/>
                <label>Kto</label>
                <select id="tre-who" class="form-control mb-3">
                    ${options}
                </select>
                
                <div class="flex-between" style="background:var(--bg-app); padding:15px; border-radius:12px; margin-bottom:15px; border: 1px solid var(--border-color);">
                    <strong>Do zapłaty: ${cost} zł</strong>
                    <button class="btn ${r.paid ? 'btn-success' : 'btn-danger'} btn-sm" onclick="Tables.togglePaid('${r.id}', ${!r.paid})">
                        ${r.paid ? 'Zapłacone' : 'Do zapłaty'}
                    </button>
                </div>

                <div class="flex-between">
                    <button class="btn btn-primary" onclick="Tables.saveEditReservation('${r.id}')">Zapisz zmiany</button>
                    <button class="btn btn-danger" onclick="Tables.deleteReservation('${r.id}')"><ion-icon name="trash"></ion-icon></button>
                </div>
            </div>
        `;
        UI.showModal(html);
    },

    async saveEditReservation(id) {
        const date = document.getElementById('tre-date').value;
        const time = document.getElementById('tre-time').value;
        const duration = Number(document.getElementById('tre-dur').value);
        const who = document.getElementById('tre-who').value;

        if (!date || !time || !who) return;
        const valid = await Tables.validateTime(date, time, duration);
        if (!valid) return;

        const month = date.substring(0, 7);
        await DB.updateReservation(id, { date, time, duration, who, month });
        UI.hideModal();
        Tables.render();
    },

    async togglePaid(id, isPaid) {
        await DB.updateReservation(id, { paid: isPaid });
        UI.hideModal();
        Tables.render();
        checkUnpaidDebts();
    },

    async deleteReservation(id) {
        if (confirm('Zatwierdzasz usunięcie?')) {
            await DB.deleteReservation(id);
            UI.hideModal();
            Tables.render();
            checkUnpaidDebts();
        }
    }
};
