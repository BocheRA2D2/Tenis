const Calendar = {
    async render() {
        const container = document.getElementById('calendar-list');
        container.innerHTML = '<div style="padding:20px; text-align:center;">Ładowanie...</div>';

        const year = state.currentDate.getFullYear();
        const month = state.currentDate.getMonth();
        const yearMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

        // Get DB overrides
        const dbTrainings = await DB.getTrainingsForMonth(yearMonthStr);
        let trainings = [];

        // Generate Mon/Weds
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dayOfWeek = date.getDay(); // 0 is Sun, 1 is Mon, 3 is Wed
            if (dayOfWeek === 1 || dayOfWeek === 3) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

                // Find if db override exists
                const override = dbTrainings.find(t => t.id === dateStr || t.originalDate === dateStr);

                if (override) {
                    trainings.push(override);
                } else {
                    trainings.push({
                        id: dateStr,
                        originalDate: dateStr,
                        date: dateStr,
                        time: '18:00',
                        canceled: false,
                        players: [],
                        isDefault: true
                    });
                }
            }
        }

        // Add dynamically created trainings outside Mon/Wed that might exist in DB
        dbTrainings.forEach(dbt => {
            if (!trainings.find(t => t.id === dbt.id) && !dbt.originalDate) {
                // E.g. purely custom training added manually if ever supported, 
                // but currently we only allow moving existing default ones.
            }
        });

        // Filter and remap moved trainings to their new dates, but ONLY if they moved WITHIN this month.
        // If moved to next month, it should show in that month's view (will be matched by originalDate search or DB query by 'month').
        trainings = trainings.map(t => {
            if (t.movedTo) {
                return { ...t, date: t.movedTo };
            }
            return t;
        });

        // Sort chronologically
        trainings.sort((a, b) => a.date.localeCompare(b.date));

        container.innerHTML = '';
        if (trainings.length === 0) {
            container.innerHTML = '<div style="padding:20px; text-align:center;">Brak treningów w tym miesiącu.</div>';
            return;
        }

        trainings.forEach(t => {
            const item = document.createElement('div');
            item.className = 'list-item';

            // Unpaid logic
            const hasUnpaid = (t.players || []).some(p => !p.paid);
            if (hasUnpaid) item.classList.add('has-alert');

            const dateObj = new Date(t.date);
            const dayName = UI.getDayName(dateObj.getDay());

            let statusHtml = '';
            if (t.canceled) {
                statusHtml = '<span class="text-danger" style="font-size: 0.8rem; margin-left: 8px;">(Odwołany)</span>';
            } else if (t.movedTo) {
                // If it was moved, show original date
                const origObj = new Date(t.originalDate);
                statusHtml = `<span class="text-muted" style="font-size: 0.8rem; margin-left: 8px;">(Przełożono z ${UI.formatDate(t.originalDate)})</span>`;
            }

            item.innerHTML = `
                <div>
                    <div class="item-title">${dayName}, ${UI.formatDate(t.date)} ${statusHtml}</div>
                    <div class="item-subtitle">Godzina: ${t.time}</div>
                </div>
                <div class="item-right">
                    <ion-icon name="people"></ion-icon> ${(t.players || []).length}
                </div>
            `;

            item.addEventListener('click', () => Calendar.openDetails(t));
            container.appendChild(item);
        });
    },

    async openDetails(training) {
        // Fetch all players for multi-select
        const allPlayers = await DB.getPlayers();
        const playersList = training.players || [];

        let playersHtml = playersList.map(p => {
            const pData = allPlayers.find(ap => ap.id === p.id);
            const name = pData ? `${pData.name} ${pData.surname}` : 'Nieznany gracz';
            return `
                <div class="flex-between mb-2" style="border-bottom: 1px solid #eee; padding-bottom: 8px;">
                    <div>
                        <button class="btn btn-danger btn-sm" style="padding: 4px 8px; font-size: 0.8rem" onclick="Calendar.removePlayer('${training.id}', '${p.id}')">
                            <ion-icon name="trash"></ion-icon>
                        </button>
                        <span style="margin-left:8px;">${name}</span>
                    </div>
                    <div>
                        <button class="btn ${p.paid ? 'btn-success' : 'btn-danger'}" onclick="Calendar.togglePaid('${training.id}', '${p.id}', ${!p.paid})">
                            ${p.paid ? 'Zapłacone' : 'Do zapłaty'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (playersList.length === 0) {
            playersHtml = '<p class="text-muted">Brak zapisanych graczy</p>';
        }

        const availablePlayers = allPlayers.filter(ap => !playersList.find(p => p.id === ap.id));
        const selectOptions = availablePlayers.map(ap => `<option value="${ap.id}">${ap.name} ${ap.surname}</option>`).join('');

        const html = `
            <div class="modal-header">
                <div style="display:flex; align-items:center; gap:10px;">
                    <h2>Szczegóły treningu</h2>
                    <button class="icon-btn" style="width:32px; height:32px; font-size:1rem;" onclick="document.getElementById('edit-training-section').classList.toggle('hidden')">
                        <ion-icon name="create-outline"></ion-icon>
                    </button>
                </div>
                <button class="close-modal" onclick="UI.hideModal()"><ion-icon name="close"></ion-icon></button>
            </div>

            <div style="margin-bottom: 16px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>Data:</strong> ${UI.formatDate(training.date)} <br>
                    <strong>Godzina:</strong> ${training.time} 
                    ${training.canceled ? '<span class="text-danger">(Odwołany)</span>' : ''}
                </div>
                <div class="item-right" style="font-size:1.1rem;">
                    <ion-icon name="people"></ion-icon> ${playersList.length}
                </div>
            </div>
            
            <div id="edit-training-section" class="hidden" style="background: #f1f5f9; padding: 15px; border-radius: 12px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
                <div class="form-group">
                    <label>Zmień godzinę:</label>
                    <div class="flex-between" style="gap:10px;">
                        <input type="time" id="mod-time" value="${training.time}" class="form-control" style="margin-bottom:0; flex:1;"/>
                        <button class="btn btn-primary" onclick="Calendar.changeTime('${training.id}')">Zapisz</button>
                    </div>
                </div>
                <div class="form-group mt-2">
                    <label>Przenieś na inną datę:</label>
                    <div class="flex-between" style="gap:10px;">
                        <input type="date" id="mod-date" class="form-control" style="margin-bottom:0; flex:1;"/>
                        <button class="btn btn-primary" onclick="Calendar.moveTraining('${training.id}', '${training.originalDate || training.id}')">Przenieś</button>
                    </div>
                </div>
                <button class="btn btn-block ${training.canceled ? 'btn-success' : 'btn-danger'} mt-3" onclick="Calendar.toggleCancel('${training.id}', ${!training.canceled})">
                    ${training.canceled ? 'Przywróć trening' : 'Odwołaj trening'}
                </button>
            </div>

            <h3 style="margin-bottom: 8px;">Zapisani gracze (${playersList.length})</h3>
            <div style="margin-bottom: 16px; max-height: 200px; overflow-y:auto;">
                ${playersHtml}
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 16px;">
                <h4 style="margin-bottom:10px;">Dodaj z bazy:</h4>
                <select id="multi-players" class="form-control mb-2" multiple>
                    ${selectOptions}
                </select>
                <button class="btn btn-primary btn-block mb-3" onclick="Calendar.addPlayersFromDb('${training.id}')">Dodaj wybranych</button>
                
                <h4 style="margin-bottom:10px;">Dodaj nowego i zapisz:</h4>
                <div class="form-group">
                    <input type="text" id="new-name" placeholder="Imię" class="form-control mb-2"/>
                    <input type="text" id="new-surname" placeholder="Nazwisko" class="form-control mb-2"/>
                    <input type="tel" id="new-phone" placeholder="Telefon (opcj.)" class="form-control mb-2"/>
                    <button class="btn btn-primary btn-block" onclick="Calendar.addNewPlayerAndAssign('${training.id}')">Dodaj do bazy i treningu</button>
                </div>
            </div>
        `;

        UI.showModal(html);
        Calendar.currentTraining = training;
    },

    async saveTrainingUpdate(id, updates) {
        let training = await DB.getTraining(id);
        if (!training) {
            // It's a default one that hasn't been saved to DB yet
            training = Calendar.currentTraining;
        }
        await DB.setTraining(id, { ...training, ...updates });

        // Re-fetch and re-render current details
        const updated = await DB.getTraining(id);
        if (updated) {
            Calendar.openDetails(updated);
        }
        Calendar.render();
        checkUnpaidDebts();
    },

    changeTime(id) {
        const time = document.getElementById('mod-time').value;
        if (time) this.saveTrainingUpdate(id, { time });
    },

    moveTraining(id, originalDate) {
        const newDate = document.getElementById('mod-date').value;
        if (newDate) {
            this.saveTrainingUpdate(id, { movedTo: newDate, originalDate: originalDate });
        }
    },

    toggleCancel(id, isCanceled) {
        this.saveTrainingUpdate(id, { canceled: isCanceled });
    },

    removePlayer(trainingId, playerId) {
        const players = Calendar.currentTraining.players.filter(p => p.id !== playerId);
        this.saveTrainingUpdate(trainingId, { players });
    },

    togglePaid(trainingId, playerId, isPaid) {
        const players = Calendar.currentTraining.players.map(p => {
            if (p.id === playerId) return { ...p, paid: isPaid };
            return p;
        });
        this.saveTrainingUpdate(trainingId, { players });
    },

    addPlayersFromDb(trainingId) {
        const select = document.getElementById('multi-players');
        const selectedIds = Array.from(select.selectedOptions).map(opt => opt.value);
        if (selectedIds.length === 0) return;

        const currentPlayers = Calendar.currentTraining.players || [];
        const newPlayersItems = selectedIds.map(id => ({ id, paid: false }));

        this.saveTrainingUpdate(trainingId, { players: [...currentPlayers, ...newPlayersItems] });
    },

    async addNewPlayerAndAssign(trainingId) {
        const name = document.getElementById('new-name').value.trim();
        const surname = document.getElementById('new-surname').value.trim();
        const phone = document.getElementById('new-phone').value.trim();

        if (!name || !surname) {
            alert('Imię i nazwisko są wymagane');
            return;
        }

        const playerRef = await DB.addPlayer({ name, surname, phone });

        const currentPlayers = Calendar.currentTraining.players || [];
        currentPlayers.push({ id: playerRef.id, paid: false });

        this.saveTrainingUpdate(trainingId, { players: currentPlayers });
    }
};
