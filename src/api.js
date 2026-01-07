const API_URL = 'http://localhost:8043';

async function csrf() {
    await fetch(`${API_URL}/sanctum/csrf-cookie`, {
        credentials: 'include',
    });
}

export async function login(email, password) {
    await csrf(); // 🔴 КРИТИЧНО

    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        throw new Error('Login failed');
    }

    return response;
}

export async function getHabits() {
    const response = await fetch(`${API_URL}/api/habits`, {
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Unauthenticated');
    }

    return response.json();
}
