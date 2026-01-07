import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

// --- INLINE SVG ICONS (Replaces lucide-react) ---

const LoaderIcon = ({ className = "w-5 h-5", color = "currentColor" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${className} animate-spin`}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

const ArrowRightIcon = ({ className = "w-5 h-5", color = "currentColor" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </svg>
);

const LogoutIcon = ({ className = "w-4 h-4", color = "currentColor" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
    </svg>
);


// --- 1. CONFIGURATION ---
const API_BASE_URL = "http://localhost:8043";
// const API_BASE_URL = "http://localhost:8031";

// Хелпер для ручного читання cookie
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

// Створюємо екземпляр Axios
const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
    withCredentials: true,
});

// --- 2. AUTH CONTEXT PLACEHOLDER ---
const AuthContext = createContext(null);

const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const login = (userData) => {
        setUser(userData);
    };

    const logout = () => {
        console.log('🚪 Triggering Logout...');
        setUser(null);
    };

    useEffect(() => {
        setIsLoading(false);
    }, []);


    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};


// --- 3. AXIOS SETUP & INTERCEPTOR ---

const AxiosProvider = ({ children }) => {
    const [isAxiosReady, setIsAxiosReady] = useState(false);
    const { logout } = useAuth();

    useEffect(() => {
        // 3a. Початкове отримання CSRF Cookie та ручне встановлення заголовка
        const fetchCsrfCookieAndSetHeader = async () => {
            console.log('🍪 Fetching CSRF cookie...');
            try {
                // 1. Отримуємо cookie
                await axios.get("/sanctum/csrf-cookie", {
                    baseURL: API_BASE_URL,
                    withCredentials: true
                });
                console.log('✅ CSRF cookie successfully set.');

                // 2. Ручне читання cookie (XSRF-TOKEN)
                const csrfToken = getCookie('XSRF-TOKEN');

                // 3. Ручне встановлення заголовка X-XSRF-TOKEN для всіх наступних запитів
                if (csrfToken) {
                    api.defaults.headers.common['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken);
                    console.log('✅ X-XSRF-TOKEN header manually set.');
                } else {
                    console.warn('⚠️ XSRF-TOKEN cookie not found after fetch.');
                }

            } catch (error) {
                console.error('❌ Failed to fetch CSRF cookie.', error);
            }
        };

        // 3b. Налаштування інтерцептора
        const interceptorId = api.interceptors.response.use(
            (response) => response,
            (error) => {
                const status = error.response?.status;
                const url = error.request?.responseURL;

                console.log('❌ Axios interceptor error:', status, url);

                if (
                    [401, 419].includes(status) &&
                    !url.endsWith("/api/user")
                ) {
                    console.log('🚪 Detected 401/419 error, triggering logout.');
                    logout();

                    // Відхиляємо проміс, щоб помилка перейшла в блок catch у handleLogin.
                    return Promise.reject(error);
                }

                return Promise.reject(error);
            }
        );

        // Запускаємо налаштування і позначаємо готовність
        fetchCsrfCookieAndSetHeader().then(() => {
            setIsAxiosReady(true);
        });

        // Функція очищення
        return () => {
            api.interceptors.response.eject(interceptorId);
        };
    }, [logout]);


    if (!isAxiosReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <LoaderIcon className="w-6 h-6 text-blue-500 mr-2" />
                <span className="text-gray-600">Налаштування системи автентифікації...</span>
            </div>
        );
    }

    return children;
};


// --- 4. DEMO COMPONENT ---

const LoginForm = () => {
    const [email, setEmail] = useState('test@example.com');
    const [password, setPassword] = useState('password');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });

            if (response.status === 200 && response.data.user) {
                login(response.data.user);
                setMessage('✅ Вхід успішний! Сесія встановлена.');
            } else {
                setMessage(`❌ Неочікувана відповідь сервера: ${response.status}`);
            }

        } catch (error) {
            console.error('Login error:', error);
            setLoading(false);

            if (error.response) {
                const status = error.response.status;
                if (status === 401) {
                    setMessage('❌ Неправильний логін або пароль (HTTP 401).');
                } else if (status === 419) {
                    // Після ручного встановлення заголовка ця помилка вже не повинна виникати
                    setMessage('❌ Помилка 419: Сесія недійсна або CSRF-токен відсутній/недійсний. (ПЕРЕВІРТЕ БЕКЕНД!)');
                } else if (status === 422) {
                    setMessage('❌ Помилка валідації даних (HTTP 422).');
                } else {
                    setMessage(`❌ Помилка сервера (HTTP ${status}). Спробуйте пізніше.`);
                }
            } else {
                setMessage(`❌ Помилка мережі: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Вхід</h2>
            <div>
                <label className="block text-sm font-medium text-gray-700">Email (test@example.com)</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Пароль (password)</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    required
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? <LoaderIcon className="w-5 h-5 mr-2" /> : <ArrowRightIcon className="w-5 h-5 mr-2" />}
                Увійти
            </button>
            {message && <p className={`text-sm mt-2 ${message.startsWith('❌') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
        </form>
    );
};

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [habitsData, setHabitsData] = useState([]);
    const [fetchStatus, setFetchStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchHabits = async () => {
        setLoading(true);
        setFetchStatus('');
        try {
            const response = await api.get('/habits');
            setHabitsData(response.data);
            setFetchStatus('✅ Дані про звички успішно завантажено (HTTP 200).');
        } catch (error) {
            if (error.response?.status) {
                setFetchStatus(`❌ Помилка завантаження даних (HTTP ${error.response.status}).`);
            } else {
                setFetchStatus(`❌ Помилка: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b">
                <h2 className="text-2xl font-bold text-green-700">Вітаємо, {user?.name || 'User'}!</h2>
                <button
                    onClick={logout}
                    className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                    <LogoutIcon className="w-4 h-4 mr-2" />
                    Вийти
                </button>
            </div>

            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-800">Тестування Interceptor (API /habits)</h3>
                <p className="text-sm text-gray-600">Натисніть нижче, щоб перевірити доступ. Якщо сесія недійсна, інтерцептор автоматично вилогінить вас (401/419).</p>

                <button
                    onClick={fetchHabits}
                    disabled={loading}
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? <LoaderIcon className="w-4 h-4 mr-2 inline-block" /> : null}
                    Тест API для Звичок
                </button>

                {fetchStatus && <p className={`text-sm mt-2 ${fetchStatus.startsWith('❌') ? 'text-red-600' : 'text-green-600'}`}>{fetchStatus}</p>}

                {habitsData.length > 0 && (
                    <div className="mt-4 p-3 bg-white border rounded-md">
                        <p className="font-medium">Отримані дані:</p>
                        <pre className="text-xs overflow-auto">{JSON.stringify(habitsData, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- 5. MAIN APPLICATION COMPONENT ---

const App = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <LoaderIcon className="w-8 h-8 text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-2xl">
                {user ? <Dashboard /> : <LoginForm />}
            </div>
        </div>
    );
};

// Wrap App with Providers
const Root = () => (
    <AuthProvider>
        <AxiosProvider>
            <App />
        </AxiosProvider>
    </AuthProvider>
);

export default Root;