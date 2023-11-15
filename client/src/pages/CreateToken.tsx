import { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import styled from 'styled-components';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useUserStore } from '../store';
import axios from 'axios';
import socketService from '../utils/socketService';
import CircularProgress from '@mui/material/CircularProgress';
import ConnectWallet from '../components/ConnectWallet';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import {
    clusterApiUrl,
    Transaction,
    SystemProgram,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    Connection,
} from '@solana/web3.js';
import * as buffer from 'buffer';
window.Buffer = buffer.Buffer;

interface FormData {
    name: string;
    symbol: string;
    image: File;
    description: string;
    max_supply: number;
    decimals: number;
}

export default function CreateToken() {
    const { connection } = useConnection();
    const { id, setUser } = useUserStore();
    const [roomId, setRoomId] = useState<string>(uuidv4());
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const { wallet, publicKey, connected, signMessage, disconnect, signTransaction } = useWallet();
    const socket = socketService.getSocket();

    const [formData, setFormData] = useState<FormData>({
        name: '',
        image: new File([], ''),
        symbol: '',
        description: '',
        max_supply: 100000000,
        decimals: 6,
    });

    const onFileChange = (e: any) => {
        console.log(e.target.files[0]);
        setFile(e.target.files[0]);
    };

    const handleSignTransaction = async () => {
        try {
            if (!wallet || !publicKey || !signTransaction) return;

            const fee = new PublicKey(process.env.REACT_APP_FEE_WALLET_ADDRESS as string);
            const fee_amount = Number(process.env.REACT_APP_LAUNCH_FEE);

            const tx = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: fee,
                    lamports: fee_amount * LAMPORTS_PER_SOL,
                })
            );

            tx.feePayer = publicKey;
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

            return await signTransaction(tx);
        } catch (err) {
            setLoading(false);
            console.log(err);
        }
    };

    const handleFormSubmit = async (e: any) => {
        if (!connected) return toast.error('Please connect wallet');

        e.preventDefault();

        const mFormData = new FormData();
        mFormData.append('name', formData.name);
        mFormData.append('symbol', formData.symbol);
        mFormData.append('image', file as any);
        mFormData.append('description', formData.description);
        mFormData.append('max_supply', formData.max_supply.toString());
        mFormData.append('decimals', formData.decimals.toString());

        if (!file) return toast.error('Please upload an image');
        if (!formData.name) return toast.error('Please enter a name');
        if (!formData.symbol) return toast.error('Please enter a symbol');
        if (!formData.description) return toast.error('Please enter a description');
        if (!formData.max_supply) return toast.error('Please enter a max supply');
        if (!formData.decimals) return toast.error('Please enter a decimals');
        if (formData.decimals <= 0 || formData.decimals > 6) return toast.error('Decimals must be between 1 and 6.');
        if (formData.max_supply <= 0) return toast.error('Max supply must be greater than 0');

        setLoading(true);

        const signature: any = await handleSignTransaction();

        if (!signature) {
            setLoading(false);
            return;
        }

        socket.emit('/api/token/create', {
            name: formData.name,
            symbol: formData.symbol,
            image: file,
            description: formData.description,
            max_supply: formData.max_supply,
            decimals: formData.decimals,
            signature: signature.serialize(),
        });
    };

    useEffect(() => {
        socket.on('/api/token/result', (data: any) => {
            setLoading(false);
            toast.success('Launch Created!');
        });

        socket.on('/api/token/error', (data: any) => {
            setLoading(false);
            toast.error(data.error || 'Something went wrong');
        });

        return () => {
            socket.off('/api/token/result');
            socket.off('/api/token/error');
        };
    }, [socket]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <FormContainer>
                {loading && (
                    <>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                            }}
                        >
                            <CircularProgress
                                style={{
                                    color: '#9ba3af',
                                }}
                            />

                            <span>
                                Creating your token...
                                <br />
                            </span>
                        </div>
                    </>
                )}

                {!loading && (
                    <Form>
                        <FormItem>
                            <FormItemLabel>
                                <label htmlFor="name">Token Name</label>
                            </FormItemLabel>
                            <FormItemInput
                                value={formData.name}
                                onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                                type="text"
                                id="name"
                                name="name"
                                placeholder="e.g. Cool Token"
                            />
                        </FormItem>

                        <FormItem>
                            <FormItemLabel>
                                <label htmlFor="symbol">Token Symbol</label>
                            </FormItemLabel>
                            <FormItemInput
                                value={formData.symbol}
                                onChange={(e: any) => setFormData({ ...formData, symbol: e.target.value })}
                                type="text"
                                id="symbol"
                                name="symbol"
                                placeholder="e.g. COOL"
                            />
                        </FormItem>

                        <FormItem>
                            <FormItemLabel>
                                <label htmlFor="symbol">Image</label>
                            </FormItemLabel>
                            <FormItemInput onChange={onFileChange} type="file" id="symbol" name="symbol" />
                        </FormItem>

                        <FormItem>
                            <FormItemLabel>
                                <label htmlFor="description">Description</label>
                            </FormItemLabel>
                            <FormItemTextArea
                                value={formData.description}
                                onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                                id="description"
                                name="description"
                                placeholder="e.g. Cool Token is a token that is going to the moon"
                            />
                        </FormItem>

                        <FormItem>
                            <FormItemLabel>
                                <label htmlFor="max_supply">Max Supply</label>
                            </FormItemLabel>
                            <FormItemInput
                                value={formData.max_supply}
                                onChange={(e: any) => setFormData({ ...formData, max_supply: e.target.value })}
                                type="number"
                                id="max_supply"
                                name="max_supply"
                            />
                        </FormItem>

                        <FormItem>
                            <FormItemLabel>
                                <label htmlFor="symbol">Decimals</label>
                            </FormItemLabel>
                            <FormItemInput
                                value={formData.decimals}
                                onChange={(e: any) => setFormData({ ...formData, decimals: e.target.value })}
                                type="number"
                                id="decimals"
                                name="decimals"
                            />
                        </FormItem>

                        <FormItem>
                            {connected && <FormItemButton onClick={handleFormSubmit}>Create Token</FormItemButton>}

                            {!connected && (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        width: '100%',
                                    }}
                                >
                                    <span>Please Connect Wallet</span>
                                </div>
                            )}
                        </FormItem>
                    </Form>
                )}
            </FormContainer>
        </>
    );
}

const FormContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    margin-top: 50px;
    margin-bottom: 50px;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 350px;
`;

const FormItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
`;

const FormButtonDiv = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 300px;
`;

const FormItemLabel = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    margin-bottom: 5px;
`;

const FormItemInput = styled.input`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    width: 300px;
    color: #9aa3af;
    padding: 5px;
    background-color: #131313;
    border: 2px dotted #272727;
    border-radius: 3px;
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.75);

    /* date type */
    &[type='date'] {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        padding: 5px;
        background-color: #131313;
        border: 2px dotted #272727;
        color: #9aa3af;
        width: 300px;
        cursor: pointer;
    }

    &:focus {
        outline: none;
        background-color: #1b1b1b;
    }
`;

const FormItemTextArea = styled.textarea`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
    background-color: #131313;
    border: 2px dotted #272727;
    border-radius: 3px;
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.75);
    width: 300px;
    color: #9aa3af;
    padding: 5px;
    resize: none;

    &:focus {
        outline: none;
        background-color: #1b1b1b;
    }
`;

const FormDateTimePicker = styled.input`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    background-color: #0a0a0a;
    border: 2px dotted #272727;
    width: 300px;
    color: #9aa3af;
    padding: 5px;

    /* date type */
    &[type='datetime-local'] {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        padding: 5px;
        border: 2px dotted #272727;
        background-color: #3d3d3d;
        color: #9aa3af;
        width: 300px;
        cursor: pointer;
    }
`;

const FormItemButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60px;
    background-color: #0fb300;
    /* border: 2px dotted #272727; */
    border: none;
    border-radius: 5px;
    width: 310px;
    color: #ffffff;
    font-weight: bold;
    font-size: 1rem;
    padding: 5px;
    cursor: pointer;
    transition: all 0.3s ease-in-out;

    &:focus {
        outline: none;
        background-color: #1b1b1b;
    }

    &:hover {
        background-color: #0d9900;
    }
`;
