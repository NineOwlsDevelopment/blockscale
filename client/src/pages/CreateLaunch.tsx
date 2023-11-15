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
    premint: number;
    decimals: number;
    price: number;
    start_date: string;
    end_date: string;
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
}

export default function CreateLaunch() {
    const { connection } = useConnection();
    const { id, setUser } = useUserStore();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const { wallet, publicKey, connected, signMessage, disconnect, signTransaction } = useWallet();
    const socket = socketService.getSocket();

    const [formData, setFormData] = useState<FormData>({
        name: '',
        symbol: '',
        image: new File([], ''),
        description: '',
        max_supply: 100000000,
        premint: 0,
        decimals: 6,
        price: 0.001,
        start_date: '',
        end_date: '',
        website: '',
        twitter: '',
        telegram: '',
        discord: '',
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
            toast.error('Error signing transaction');
            return null;
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
        mFormData.append('premint', formData.premint.toString());
        mFormData.append('decimals', formData.decimals.toString());
        mFormData.append('price', formData.price.toString());
        mFormData.append('start_date', formData.start_date);
        mFormData.append('end_date', formData.end_date);
        mFormData.append('website', formData.website as string);
        mFormData.append('twitter', formData.twitter as string);
        mFormData.append('telegram', formData.telegram as string);
        mFormData.append('discord', formData.discord as string);

        console.log(formData);

        if (!formData.name) return toast.error('Please enter a token name.');
        if (!formData.symbol) return toast.error('Please enter a symbol.');
        if (!file) return toast.error('Please upload an image.');
        if (!formData.description) return toast.error('Please enter a description.');

        if (!formData.max_supply) return toast.error('Please enter a max supply.');
        if (!formData.decimals) return toast.error('Please enter a decimals.');
        if (!formData.price) return toast.error('Please enter a price.');

        if (!formData.start_date) return toast.error('Please enter a start date.');
        if (!formData.end_date) return toast.error('Please enter a end date.');

        if (formData.name.length > 50) return toast.error('Token name must be less than 25 characters.');
        if (formData.symbol.length > 5) return toast.error('Token symbol must be less than 5 characters.');

        if (new Date(formData.start_date) > new Date(formData.end_date)) {
            return toast.error('Start date must be before end date.');
        }
        if (new Date(formData.start_date) < new Date()) return toast.error('Start date must be in the future.');

        if (Number(formData.max_supply) <= Number(formData.premint)) {
            return toast.error('Max supply must be greater than premint.');
        }

        if (formData.price <= 0) return toast.error('Price must be greater than 0.');
        if (formData.decimals <= 0 || formData.decimals > 6) return toast.error('Decimals must be between 1 and 6.');
        if (Number(formData.max_supply) <= 0) return toast.error('Max supply must be greater than 0.');
        if (formData.premint < 0) return toast.error('Premint must be greater than or equal to 0.');

        setLoading(true);

        const signature: any = await handleSignTransaction();

        if (!signature) {
            setLoading(false);
            return;
        }

        socket.emit('/api/create-launch', {
            name: formData.name,
            symbol: formData.symbol,
            image: file,
            description: formData.description,
            max_supply: formData.max_supply,
            premint: formData.premint,
            decimals: formData.decimals,
            price: formData.price,
            start_date: formData.start_date,
            end_date: formData.end_date,
            website: formData.website,
            twitter: formData.twitter,
            telegram: formData.telegram,
            discord: formData.discord,
            signature: signature.serialize(),
        });
    };

    useEffect(() => {
        socket.on('/api/launch/result', (data: any) => {
            setLoading(false);
            toast.success('Launch Created!');
        });

        socket.on('/api/launch/error', (data: any) => {
            setLoading(false);
            toast.error(data.error);
        });

        return () => {
            socket.off('/api/launch/result');
            socket.off('/api/launch/error');
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
                                Generating your token launch... <br />
                            </span>
                        </div>
                    </>
                )}

                {!loading && (
                    <Form>
                        <FormItem>
                            <FormItemLabel>
                                <label htmlFor="name">Token Name*</label>
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
                                <label htmlFor="symbol">Token Symbol*</label>
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
                                <label htmlFor="symbol">Image*</label>
                            </FormItemLabel>
                            <FormItemInput onChange={onFileChange} type="file" id="symbol" name="symbol" />
                        </FormItem>

                        <FormItem>
                            <FormItemLabel>
                                <label htmlFor="description">Description*</label>
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
                                <label htmlFor="max_supply">Max Supply*</label>
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
                                <label htmlFor="symbol">Decimals* (6 max)</label>
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
                            <FormItemLabel>
                                <label htmlFor="price">Price* (SOL Per Token)</label>
                            </FormItemLabel>
                            <FormItemInput
                                value={formData.price}
                                onChange={(e: any) => setFormData({ ...formData, price: e.target.value })}
                                type="number"
                                id="price"
                                name="price"
                            />
                        </FormItem>

                        <FormItem>
                            <FormItemLabel>
                                <label htmlFor="premint">Premint (Amount to mint instantly)</label>
                            </FormItemLabel>
                            <FormItemInput
                                value={formData.premint}
                                onChange={(e: any) => setFormData({ ...formData, premint: e.target.value })}
                                type="number"
                                id="premint"
                                name="premint"
                            />
                        </FormItem>

                        <FormItem>
                            <FormItemLabel>
                                <label htmlFor="website">Website</label>
                            </FormItemLabel>
                            <FormItemInput
                                value={formData.website}
                                onChange={(e: any) => setFormData({ ...formData, website: e.target.value })}
                                type="text"
                                id="website"
                                name="website"
                                placeholder="e.g. https://blockscale.xyz"
                            />
                        </FormItem>

                        <FormItem>
                            <FormItemLabel>
                                <label htmlFor="twitter">Twitter</label>
                            </FormItemLabel>
                            <FormItemInput
                                value={formData.twitter}
                                onChange={(e: any) => setFormData({ ...formData, twitter: e.target.value })}
                                type="text"
                                id="twitter"
                                name="twitter"
                                placeholder="e.g. https://twitter.com/blockscale_xyz"
                            />
                        </FormItem>

                        <FormItem>
                            <FormItemLabel>
                                <label htmlFor="telegram">Telegram</label>
                            </FormItemLabel>
                            <FormItemInput
                                value={formData.telegram}
                                onChange={(e: any) => setFormData({ ...formData, telegram: e.target.value })}
                                type="text"
                                id="telegram"
                                name="telegram"
                                placeholder="e.g. https://t.me/blockscale_xyz"
                            />
                        </FormItem>

                        <FormItem>
                            <FormItemLabel>
                                <label htmlFor="discord">Discord</label>
                            </FormItemLabel>
                            <FormItemInput
                                value={formData.discord}
                                onChange={(e: any) => setFormData({ ...formData, discord: e.target.value })}
                                type="text"
                                id="discord"
                                name="discord"
                                placeholder="e.g. https://discord.gg/blockscale_xyz"
                            />
                        </FormItem>

                        <FormItem>
                            <FormItemLabel>
                                <label htmlFor="start_date">Start Date</label>
                            </FormItemLabel>

                            <FormDateTimePicker
                                onChange={(e: any) => setFormData({ ...formData, start_date: e.target.value })}
                                type="datetime-local"
                                id="start_date"
                                name="start_date"
                            />
                        </FormItem>

                        <FormItem>
                            <FormItemLabel>
                                <label htmlFor="end_date">End Date</label>
                            </FormItemLabel>

                            <FormDateTimePicker
                                onChange={(e: any) => setFormData({ ...formData, end_date: e.target.value })}
                                type="datetime-local"
                                id="end_date"
                                name="end_date"
                            />
                        </FormItem>

                        <FormItem>
                            {connected && <FormItemButton onClick={handleFormSubmit}>Create Launch</FormItemButton>}

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
        border: 2px dotted #272727;
        background-color: #3d3d3d;
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
        background-color: #131313;
        border: 2px dotted #272727;
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
