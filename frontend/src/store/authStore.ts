import { create } from 'zustand';
import { UserSummaryResponse } from '@/types';

interface AuthState {
    accessToken: string | null;
    user: UserSummaryResponse | null;
    setAuth: (accessToken: string, user: UserSummaryResponse) => void;
    setAccessToken: (accessToken: string) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    user: null,

    setAuth: (accessToken: string, user: UserSummaryResponse) => {
        localStorage.setItem('afet_token', accessToken);
        localStorage.setItem('afet_user', JSON.stringify(user));
        set({ accessToken, user });
    },

    setAccessToken: (accessToken: string) => {
        localStorage.setItem('afet_token', accessToken);
        set({ accessToken });
    },

    clearAuth: () => {
        localStorage.removeItem('afet_token');
        localStorage.removeItem('afet_user');
        set({ accessToken: null, user: null });
    },
}));
