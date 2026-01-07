import api from './axios';

export async function getHabits() {
    const { data } = await api.get('/api/habits');
    return data;
}
