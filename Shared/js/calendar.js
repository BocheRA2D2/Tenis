const Calendar = {
    async render() {
        const container = document.getElementById('calendar-list');
        container.innerHTML = '<div style="padding:20px; text-align:center;">Ładowanie...</div>';

        const year = state.currentDate.getFullYear();
        const month = state.currentDate.getMonth();
        const yearMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

        const dbTrainings = await DB.getTrainingsForMonth(yearMonthStr);
        let trainings = [];

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 1 || dayOfWeek === 3) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
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

        trainings = trainings.map(t => {
            if (t.movedTo) {
                return { ...t, date: t.movedTo };
            }
            return t;
        });

        trainings.sort((a, b) => a.date.localeCompare(b.date));

        container.innerHTML = '';
        if (trainings.length === 0) {
            container.innerHTML = '<div style="padding:20px; text-align:center;">Brak treningów w tym miesiącu.</div>';
            return;
        }

        trainings.forEach(t => {
            const item = document.createElement('div');
            item.className = 'list-item';

            const trainingDate = new Date(t.date);
            trainingDate.setHours(0, 0, 0, 0);
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);

            if (trainingDate < todayDate) {
                item.classList.add('is-past');
            }

            const hasUnpaid = (t.players || []).some(p => !p.paid);
            if (hasUnpaid) item.classList.add('has-alert');

            const dateObj = new Date(t.date);
            const dayName = UI.getDayName(dateObj.getDay());

            let statusHtml = '';
            if (t.canceled) {
                statusHtml = '<span class="text-danger" style="font-size: 0.8rem; margin-left: 8px;">(Odwołany)</span>';
            } else if (t.movedTo) {
                statusHtml = `<span class="badge badge-orange" style="margin-left: 8px;">Przełożono z ${UI.formatDate(t.originalDate)}</span>`;
            }

            item.innerHTML = `
                <div>
                    <div class="item-title">${dayName}, ${UI.formatDate(t.date)}</div>
                    <div class="item-subtitle">Godzina: ${t.time} ${statusHtml}</div>
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
        const allPlayers = await DB.getPlayers();
        const playersList = training.players || [];

        let playersHtml = playersList.map(p => {
            const pData = allPlayers.find(ap => ap.id === p.id);
            const name = pData ? `${pData.name} ${pData.surname}` : 'Nieznany gracz';
            return `
                <div class="flex-between mb-2" style="border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                    <div>
                        <button class="btn btn-danger btn-sm" style="padding: 4px 8px; font-size: 0.8rem" onclick="Calendar.removePlayer('${training.id}', '${p.id}')">
                            <ion-icon name="trash"></ion-icon>
                        </button>
                        <span style="margin-left:8px;">${name}</span>
                    </div>
                    <div>
                        <button class="btn ${p.paid ? 'btn-success' : 'btn-danger'} btn-sm" onclick="Calendar.togglePaid('${training.id}', '${p.id}', ${!p.paid})">
                            ${p.paid ? 'Zapłacone' : 'Do zapłaty'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (playersList.length === 0) {
            playersHtml = '<p class="text-muted" style="text-align:center; padding:10px;">Brak zapisanych graczy</p>';
        }

        const availablePlayers = allPlayers.filter(ap => !playersList.find(p => p.id === ap.id));

        const playerSelectionHtml = availablePlayers.map(ap => `
            <div class="player-select-item" onclick="const cb = this.querySelector('input'); cb.checked = !cb.checked; event.stopPropagation();">
                <input type="checkbox" value="${ap.id}" onclick="event.stopPropagation();">
                <div class="player-select-info">
                    <span class="player-select-name">${ap.name} ${ap.surname}</span>
                </div>
            </div>
        `).join('');

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

            <div style="margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>Data:</strong> ${UI.formatDate(training.date)} <br>
                    <strong>Godzina:</strong> ${training.time} 
                    ${training.canceled ? '<span class="text-danger">(Odwołany)</span>' : ''}
                </div>
                <div class="item-right" style="font-size:1.1rem;">
                    <ion-icon name="people"></ion-icon> ${playersList.length}
                </div>
            </div>

            <div id="add-from-db-section" style="margin-bottom: 24px;">
                <div class="list-expand-header">
                    <button class="btn btn-outline mb-2" style="flex:1;" onclick="document.getElementById('db-player-list-container').classList.toggle('hidden')">
                        <ion-icon name="person-add-outline"></ion-icon> Dodaj zawodników z bazy
                    </button>
                    <button class="expand-btn" onclick="Calendar.toggleExpandList('db-player-list-container', 'Dodaj zawodników', 'Calendar.openDetails', ['${training.id}'])">
                        <ion-icon name="expand-outline"></ion-icon>
                    </button>
                </div>
                
                <div id="db-player-list-container" class="hidden">
                    <h4 style="margin-bottom:12px; font-size:1rem; display:flex; align-items:center; gap:8px;">
                        Wybierz z listy:
                    </h4>
                    <div class="player-select-container">
                        ${playerSelectionHtml || '<div style="padding:15px; text-align:center; color:var(--text-muted); font-size:0.9rem;">Wszyscy gracze są już zapisani.</div>'}
                    </div>
                    ${availablePlayers.length > 0 ? `<button class="btn btn-primary btn-block mb-3" onclick="Calendar.addPlayersFromDb('${training.id}')">Zapisz wybranych</button>` : ''}
                </div>
            </div>
            
            <div id="edit-training-section" class="hidden" style="background: var(--bg-app); padding: 15px; border-radius: 12px; margin-bottom: 16px; border: 1px solid var(--border-color);">
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

            <div class="list-expand-header">
                <h3 style="margin-bottom: 0;">Obecnie zapisani (${playersList.length})</h3>
                <button class="expand-btn" onclick="Calendar.toggleExpandList('enrolled-list-box', 'Obecnie zapisani', 'Calendar.openDetails', ['${training.id}'])">
                    <ion-icon name="expand-outline"></ion-icon>
                </button>
            </div>
            <div id="enrolled-list-box" style="margin-bottom: 24px; max-height: 180px; overflow-y:auto; border:1px solid var(--border-color); border-radius:12px; padding:4px;">
                ${playersHtml}
            </div>

            <div style="border-top: 1px solid var(--border-color); padding-top: 16px;">
                <button class="btn btn-outline btn-block mb-3" onclick="document.getElementById('new-player-form').classList.toggle('hidden')">
                    <ion-icon name="person-add-outline"></ion-icon> + Stwórz nowego gracza
                </button>

                <div id="new-player-form" class="hidden">
                    <h4 style="margin-bottom:12px;">Nowy zawodnik do bazy:</h4>
                    <div class="form-group">
                        <input type="text" id="new-name" placeholder="Imię (wymagane)" class="form-control mb-2"/>
                        <input type="text" id="new-surname" placeholder="Nazwisko (opcjonalne)" class="form-control mb-2"/>
                        <input type="tel" id="new-phone" placeholder="Telefon (opcjonalnie)" class="form-control mb-2"/>
                        <button class="btn btn-primary btn-block" onclick="Calendar.addNewPlayerAndAssign('${training.id}')">Dodaj i zapisz</button>
                    </div>
                </div>
            </div>
        `;

        UI.showModal(html);

        // Re-render expanded view if it was active
        if (state.activeExpandedView && (state.activeExpandedView.containerId === 'enrolled-list-box' || state.activeExpandedView.containerId === 'db-player-list-container')) {
            Calendar.renderExpanded(state.activeExpandedView);
        }

        Calendar.currentTraining = training;
    },

    async saveTrainingUpdate(id, updates) {
        let training = await DB.getTraining(id);
        if (!training) {
            training = Calendar.currentTraining;
        }
        await DB.setTraining(id, { ...training, ...updates });

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
        // Find checkboxes in either the base modal or the expanded view
        const checkboxes = document.querySelectorAll('#modal-container input[type="checkbox"]:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.value);
        if (selectedIds.length === 0) return;

        const currentPlayers = Calendar.currentTraining.players || [];
        const newPlayersItems = selectedIds.map(id => ({ id, paid: false }));

        this.saveTrainingUpdate(trainingId, { players: [...currentPlayers, ...newPlayersItems] });
    },

    async addNewPlayerAndAssign(trainingId) {
        const name = document.getElementById('new-name').value.trim();
        const surname = document.getElementById('new-surname').value.trim();
        const phone = document.getElementById('new-phone').value.trim();

        if (!name) {
            alert('Imię jest wymagane');
            return;
        }

        const playerRef = await DB.addPlayer({ name, surname, phone });

        const currentPlayers = Calendar.currentTraining.players || [];
        currentPlayers.push({ id: playerRef.id, paid: false });

        this.saveTrainingUpdate(trainingId, { players: currentPlayers });
    },

    toggleExpandList(containerId, title, contentFn, params) {
        state.activeExpandedView = { containerId, title, contentFn, params };
        this.renderExpanded(state.activeExpandedView);
    },

    renderExpanded(view) {
        const modal = document.getElementById('modal-container');
        const container = document.getElementById(view.containerId);
        if (!container) return; // Should not happen

        const listContent = container.innerHTML;

        // Check if expanded-container already exists
        let expandedDiv = modal.querySelector('.expanded-container');
        if (!expandedDiv) {
            expandedDiv = document.createElement('div');
            expandedDiv.className = 'expanded-container';
            modal.appendChild(expandedDiv);
        }

        expandedDiv.innerHTML = `
            <button class="btn btn-outline expanded-back-btn" onclick="state.activeExpandedView = null; this.parentElement.remove()">
                <ion-icon name="arrow-back-outline"></ion-icon> Powrót
            </button>
            <h3><ion-icon name="list-outline"></ion-icon> ${view.title}</h3>
            <div style="flex: 1; overflow-y: auto;">
                ${listContent}
            </div>
        `;

        // If it's the player selection list, we need to re-bind click events for the expanded view items
        if (view.containerId === 'db-player-list-container') {
            const items = expandedDiv.querySelectorAll('.player-select-item');
            items.forEach(item => {
                item.onclick = (e) => {
                    const cb = item.querySelector('input');
                    cb.checked = !cb.checked;
                    e.stopPropagation();
                };
            });
        }
    }
};
