import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect } from 'react';
import {
    UnsafeBurnerWalletAdapter,
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    SalmonWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import React, { FC, ReactNode, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Public Routes
import PublicRoutes from './layouts/PublicRoutes';
import Home from './pages/Home';
import Launchpad from './pages/Launchpad';
import CreateLaunch from './pages/CreateLaunch';
import CreateToken from './pages/CreateToken';

require('@solana/wallet-adapter-react-ui/styles.css');

const App: FC = () => {
    return (
        <Context>
            <Content />
        </Context>
    );
};
export default App;

const Context: FC<{ children: ReactNode }> = ({ children }) => {
    const network =
        process.env.REACT_APP_NETWORK === 'devnet' ? WalletAdapterNetwork.Devnet : WalletAdapterNetwork.Mainnet;

    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [
            new UnsafeBurnerWalletAdapter(),
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new SalmonWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

const Content: FC = () => {
    return (
        <>
            <Router>
                <Routes>
                    <Route path={'/'} element={<PublicRoutes />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/launchpad/:id" element={<Launchpad />} />
                        <Route path="/create-launch" element={<CreateLaunch />} />
                        <Route path="/create-token" element={<CreateToken />} />
                    </Route>
                </Routes>
            </Router>

            <ToastContainer position={toast.POSITION.BOTTOM_LEFT} pauseOnFocusLoss={false} limit={3} />
        </>
    );
};
