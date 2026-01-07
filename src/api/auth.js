import api, { initCsrf } from './axios';

export async function login(email, password) {
    await initCsrf();

    // return api.post('/api/login', {
    //     email,
    //     password,
    // });

    return api.post(
        '/api/login',
        { email, password },
        {
            withCredentials: true,
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        }
    );
}

export async function logout() {
    return api.post('/api/logout');
}
