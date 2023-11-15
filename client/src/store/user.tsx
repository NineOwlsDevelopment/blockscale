import { create } from 'zustand';

interface UserState {
    id: string;
    wallet_address: string;
    mints: [];
    setUser: (userData: UserState) => void;
}

const useUserStore = create<UserState>((set) => ({
    id: '',
    username: '',
    wallet_address: '',
    mints: [],
    setUser: (userData: UserState) => set(userData),
}));

export default useUserStore;
