import { useState } from 'react';
import { login } from '../api/auth';

export default function Login({ onSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            await login(email, password);
            onSuccess();
        } catch {
            setError('Invalid credentials');
        }
    };

    return (
        <form onSubmit={submit}>
            <h1>Login</h1>

            <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
            />

            <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
            />

            <button type="submit">Login</button>

            {error && <p>{error}</p>}
        </form>
    );
}
