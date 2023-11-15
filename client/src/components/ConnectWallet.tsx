import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect } from 'react';
import { useUserStore } from '../store';
import axios from 'axios';
import socketService from '../utils/socketService';
import { toast } from 'react-toastify';
import styled from 'styled-components';

export default function ConnectWallet() {
    const { id, setUser } = useUserStore();
    const { wallet, publicKey, connected, signMessage, disconnect } = useWallet();
    const socket = socketService.getSocket();

    const handleLogin = async () => {
        if (!wallet || !signMessage || !publicKey) return;

        const message = new TextEncoder().encode(`Login as ${publicKey?.toBase58()}`);

        const signature = await signMessage(message).catch(() => {
            return null;
        });

        if (!signature) {
            toast.error('Login failed');
            disconnect();
            socket.disconnect();
            return console.log('Signature is null');
        }

        const res = await axios.post(
            `${process.env.REACT_APP_SERVER_URL}/auth/login`,
            {
                wallet_address: publicKey?.toBase58(),
                signature: signature,
            },
            { withCredentials: true }
        );

        if (res.status === 201 || res.status === 200) {
            socket.connect();

            console.log(res.data);

            return setUser({
                id: res.data.id,
                wallet_address: res.data.wallet_address,
                mints: res.data.mints,
                setUser: setUser,
            });
        }

        toast.error('Login failed');
        disconnect();
        socket.disconnect();
    };

    useEffect(() => {
        socket.disconnect();

        if (connected) {
            handleLogin();
        }
    }, [connected, publicKey]);

    return (
        <Container>
            <WalletMultiButton />
        </Container>
    );
}

const Container = styled.div`
    button {
        border: none;
        padding: 0.5rem 1rem;
        background-color: transparent;
        border-left: 2px dotted #272727;
        border-right: 2px dotted #272727;
        color: #9ba3af;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        font-family: 'Audiowide', sans-serif;

        &:hover {
            color: #038518;
            background-color: transparent !important;
        }
    }
`;
