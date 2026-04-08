import Dexie from 'dexie';

const db = new Dexie('IdolPomodoroDB');

db.version(1).stores({
    sessions: '++id, startTime, endTime, cyclesPlanned, cyclesCompleted, status',
    petState: 'id',
});

// Ensure we always have a pet state row
export async function getPetState() {
    let state = await db.petState.get(1);
    if (!state) {
        state = {
            id: 1,
            mood: 'idle',
            totalSessionsCompleted: 0,
            lastInteraction: Date.now(),
        };
        await db.petState.put(state);
    }
    return state;
}

export async function updatePetMood(mood) {
    await db.petState.update(1, { mood, lastInteraction: Date.now() });
}

export async function incrementSessions() {
    const state = await getPetState();
    await db.petState.update(1, {
        totalSessionsCompleted: state.totalSessionsCompleted + 1,
        lastInteraction: Date.now(),
    });
}

export async function saveSession(session) {
    return db.sessions.add(session);
}

export async function getRecentSessions(limit = 10) {
    return db.sessions.orderBy('startTime').reverse().limit(limit).toArray();
}

export default db;
