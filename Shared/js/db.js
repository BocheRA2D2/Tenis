const DB = {
    async getPlayers() {
        const snapshot = await db.collection('players').orderBy('name').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async addPlayer(data) {
        return await db.collection('players').add(data);
    },
    async updatePlayer(id, data) {
        return await db.collection('players').doc(id).update(data);
    },
    async deletePlayer(id) {
        return await db.collection('players').doc(id).delete();
    },

    // Trainings
    async getTrainingsForMonth(yearMonthStr) {
        // Find all trainings in this month
        const snapshot = await db.collection('trainings')
            .where('month', '==', yearMonthStr)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async getTraining(dateStr) {
        const doc = await db.collection('trainings').doc(dateStr).get();
        if (doc.exists) return { id: doc.id, ...doc.data() };
        return null;
    },
    async setTraining(dateStr, data) {
        // month index for query
        const yearMonthStr = dateStr.substring(0, 7);
        data.month = yearMonthStr;
        return await db.collection('trainings').doc(dateStr).set(data, { merge: true });
    },

    // Reservations
    async getReservations(yearMonthStr) {
        const snapshot = await db.collection('reservations')
            .where('month', '==', yearMonthStr)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async addReservation(data) {
        return await db.collection('reservations').add(data);
    },
    async updateReservation(id, data) {
        return await db.collection('reservations').doc(id).update(data);
    },
    async deleteReservation(id) {
        return await db.collection('reservations').doc(id).delete();
    },

    // Check debts
    async checkGlobalDebts() {
        let hasDebt = false;

        // Month comparison string: "2026-02"
        const now = new Date();
        const yearMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Get trainings from PREVIOUS months
        const allTrainings = await db.collection('trainings').where('month', '<', yearMonthStr).get();
        allTrainings.forEach(doc => {
            const tr = doc.data();
            if (tr.players) {
                const unpaid = tr.players.some(p => !p.paid);
                if (unpaid) hasDebt = true;
            }
        });

        if (hasDebt) return true;

        // Same for reservations
        const allRes = await db.collection('reservations').where('month', '<', yearMonthStr).get();
        allRes.forEach(doc => {
            const r = doc.data();
            if (!r.paid) hasDebt = true;
        });

        return hasDebt;
    }
};
