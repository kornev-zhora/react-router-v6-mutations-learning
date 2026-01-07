import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8043',
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        // 'X-Requested-With': 'XMLHttpRequest',
    },
});

export async function initCsrf() {
    await api.get('/sanctum/csrf-cookie');
}

export default api;
