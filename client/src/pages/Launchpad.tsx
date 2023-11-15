import React, { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from 'react-toastify';
import socketService from '../utils/socketService';
import ConnectWallet from '../components/ConnectWallet';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { FaSquareXTwitter as TwitterIcon } from 'react-icons/fa6';
import { BsDiscord as DiscordIcon, BsGlobe } from 'react-icons/bs';
import { GoLinkExternal } from 'react-icons/go';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import * as buffer from 'buffer';
window.Buffer = buffer.Buffer;

interface Launch {
    id: number;
    mint_address: string;
    owner_address: string;
    image: string;
    name: string;
    symbol: string;
    description: string;
    price: number;
    max_supply: number;
    current_supply: number;
    premint: number;
    decimals: number;
    start_date: string;
    end_date: string;
    status: string;
    website: string;
    twitter: string;
    discord: string;
}

export default function Launchpad() {
    const { id } = useParams<{ id: string }>();
    const socket = socketService.getSocket();
    const { connection } = useConnection();
    const [countdown, setCountdown] = useState('');
    const [status, setStatus] = useState('');
    const [mintAmount, setMintAmount] = useState(0);
    const [loading, setLoading] = useState(false);
    const { wallet, publicKey, connected, signMessage, disconnect, signTransaction } = useWallet();
    const [launch, setLaunch] = useState({} as Launch);

    // const [launch, setLaunch] = React.useState<any>({
    //     id: 1,
    //     mint_address: '2jRew76wuRxAcaUWCXGe12dvFhK8noKbu8jtCRMADhig',
    //     owner_address: '4WccsBuf4ckCDPqtabGgfSAzxxCChi9sjiGeSMhDGxFd',
    //     image: '3d71b188-93e2-4f94-8d0a-3e0aff9e5ab1.png',
    //     name: 'Rocket',
    //     symbol: 'RKT',
    //     description:
    //         'lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco',
    //     price: 1000000,
    //     max_supply: 10000000,
    //     current_supply: 10000,
    //     premint: 10000,
    //     decimals: 9,
    //     start_date: '2021-12-10T00:00:00.000Z',
    //     end_date: '2023-12-10T00:00:00.000Z',
    //     website: 'https://google.com',
    //     twitter: 'https://twitter.com',
    //     discord: 'https://discord.com',
    // });

    const handleSignTransaction = async () => {
        try {
            if (!wallet || !publicKey || !signTransaction) return;

            const total = Number(Math.round(mintAmount * launch.price));

            if (total <= 10000) {
                return toast.error('Invalid amount. Minimum purchase amount is 10000 LAMPORTS.');
            }

            const amount_to_owner = Math.round(total * 0.95);
            const amount_to_fee = Math.round(total * 0.05);

            const owner = new PublicKey(launch.owner_address);
            const fee = new PublicKey(process.env.REACT_APP_FEE_WALLET_ADDRESS as string);

            const tx = new Transaction()
                .add(
                    SystemProgram.transfer({
                        fromPubkey: publicKey,
                        toPubkey: owner,
                        lamports: amount_to_owner,
                    })
                )
                .add(
                    SystemProgram.transfer({
                        fromPubkey: publicKey,
                        toPubkey: fee,
                        lamports: amount_to_fee,
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

    // handle when a user clicks the mint button
    const handleMint = async () => {
        if (mintAmount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setLoading(true);

        const signature: any = await handleSignTransaction();

        if (!signature) {
            setLoading(false);
            return;
        }

        socket.emit('/api/launch/mint', {
            launch_id: launch.id,
            mint_amount: mintAmount,
            signature: signature.serialize(),
        });
    };

    const getLaunchStatus = () => {
        switch (status) {
            case 'live':
                return 'Sale Ends In:';
            case 'upcoming':
                return 'Sale Starts In:';
            case 'ended':
                return 'Sale Ended';
            case 'finished':
                return 'Sold Out';
            default:
                return 'Sale Ended';
        }
    };

    const formatCountdown = (diff: any) => {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            .toString()
            .padStart(2, '0');

        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
            .toString()
            .padStart(2, '0');

        const minutes = Math.floor((diff / 1000 / 60) % 60)
            .toString()
            .padStart(2, '0');

        const seconds = Math.floor((diff / 1000) % 60)
            .toString()
            .padStart(2, '0');

        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    const getCountdown = (targetDate: any) => {
        const now = new Date();
        const diff = new Date(targetDate).getTime() - now.getTime();
        if (diff < 0) {
            return '0d 0h 0m 0s';
        }
        return formatCountdown(diff);
    };

    const handleSocialLinkClick = (event: any, link: string) => {
        event.preventDefault();
        window.open(link, '_blank');
    };

    useEffect(() => {
        let interval: any;

        if (Number(launch.current_supply) >= Number(launch.max_supply)) {
            setStatus('finished');
            setCountdown('0d 0h 0m 0s');
            return () => clearInterval(interval);
        }

        if (new Date(launch.start_date) > new Date()) {
            setStatus('upcoming');
            interval = setInterval(() => {
                setCountdown(getCountdown(launch.start_date));
            }, 1000);
        } else if (new Date(launch.end_date) > new Date()) {
            setStatus('live');
            interval = setInterval(() => {
                setCountdown(getCountdown(launch.end_date));
            }, 1000);
        } else {
            setStatus('ended');
            setCountdown('0d 0h 0m 0s');
        }

        return () => clearInterval(interval);
    }, [launch.start_date, launch.end_date]);

    useEffect(() => {
        const getLaunch = async () => {
            const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/launches/${id}`);

            if (res.status !== 200) {
                console.log('Error fetching launch');
                toast.error('Error fetching launch');
                return;
            }

            console.log(res.data);

            setLaunch(res.data);
        };

        getLaunch();
    }, []);

    useEffect(() => {
        socket.on('/api/launch/mint/result', (data: any) => {
            setLoading(false);
            toast.success('Mint Successful');
            setLaunch(data);
        });

        socket.on('/api/launch/mint/error', (data: any) => {
            console.log(data);
            toast.error(data.message);
            setLoading(false);
        });

        return () => {
            socket.off('/api/launch/mint/result');
            socket.off('/api/launch/mint/error');
        };
    }, [socket]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            {launch.id && (
                <Container>
                    <ContainerLeft>
                        <LaunchDetails>
                            <LaunchDetailsHeader>
                                <LaunchDetailsHeaderLeft>
                                    <div>
                                        <img
                                            src={`${process.env.REACT_APP_AWS_BASE_URL}${launch?.image}`}
                                            alt="token_image"
                                        />
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            justifyContent: 'flex-start',
                                            gap: '10px',
                                            fontSize: '1.5rem',
                                        }}
                                    >
                                        <span>
                                            {launch?.name} [{launch.symbol}]
                                        </span>

                                        <CardBodySocialDiv
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                fontSize: '1rem',
                                            }}
                                        >
                                            {launch?.website && (
                                                <BsGlobe
                                                    onClick={(event) => {
                                                        handleSocialLinkClick(event, launch.website);
                                                    }}
                                                />
                                            )}

                                            {launch?.twitter && (
                                                <TwitterIcon
                                                    onClick={(event) => {
                                                        handleSocialLinkClick(event, launch.twitter);
                                                    }}
                                                />
                                            )}

                                            {launch?.discord && (
                                                <DiscordIcon
                                                    onClick={(event) => {
                                                        handleSocialLinkClick(event, launch.discord);
                                                    }}
                                                />
                                            )}
                                        </CardBodySocialDiv>

                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                fontSize: '1rem',
                                            }}
                                        >
                                            <span>{launch?.description}</span>
                                        </div>
                                    </div>
                                </LaunchDetailsHeaderLeft>
                            </LaunchDetailsHeader>

                            <LaunchDetailsBody>
                                <LaunchDetailsBodyItem>
                                    <span>Token Address</span>
                                    <span
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px',
                                            fontSize: '1rem',
                                        }}
                                    >
                                        {launch?.mint_address?.slice(0, 8)}...{launch?.mint_address?.slice(-8)}
                                        <GoLinkExternal
                                            onClick={() => {
                                                window.open(
                                                    `https://solscan.io/token/${launch?.mint_address}`,
                                                    '_blank'
                                                );
                                            }}
                                            style={{
                                                cursor: 'pointer',
                                            }}
                                        />
                                    </span>
                                </LaunchDetailsBodyItem>

                                <LaunchDetailsBodyItem>
                                    <span>Price</span>
                                    <span>{launch?.price / LAMPORTS_PER_SOL} SOL</span>
                                </LaunchDetailsBodyItem>

                                <LaunchDetailsBodyItem>
                                    <span>Max Supply</span>
                                    <span>
                                        {launch?.max_supply?.toLocaleString('en-US')} {launch?.symbol}
                                    </span>
                                </LaunchDetailsBodyItem>

                                <LaunchDetailsBodyItem>
                                    <span>Current Supply</span>
                                    <span>
                                        {launch?.current_supply?.toLocaleString('en-US')} {launch?.symbol}
                                    </span>
                                </LaunchDetailsBodyItem>

                                <LaunchDetailsBodyItem>
                                    <span>Premint</span>
                                    <span>
                                        {launch?.premint?.toLocaleString('en-US')} {launch?.symbol}
                                    </span>
                                </LaunchDetailsBodyItem>

                                <LaunchDetailsBodyItem>
                                    <span>Presale Start Time</span>
                                    <span>{new Date(launch?.start_date)?.toUTCString()}</span>
                                </LaunchDetailsBodyItem>

                                <LaunchDetailsBodyItem>
                                    <span>Presale End Time</span>
                                    <span>{new Date(launch?.end_date)?.toUTCString()}</span>
                                </LaunchDetailsBodyItem>
                            </LaunchDetailsBody>
                        </LaunchDetails>
                    </ContainerLeft>

                    <ContainerRight>
                        <LaunchMintDetails>
                            <MintDetailsInner>
                                <MintDetailsCountdownDiv>
                                    <span>{getLaunchStatus()}</span>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px',
                                            fontSize: '1rem',
                                        }}
                                    >
                                        {countdown.split(' ').map((item: any, index: any) => (
                                            <span
                                                key={index}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: '#272727',
                                                    padding: '10px',
                                                    borderRadius: '5px',
                                                    minWidth: '50px',
                                                }}
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </MintDetailsCountdownDiv>

                                <Box sx={{ width: '310px', position: 'relative' }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(launch?.current_supply / Number(launch?.max_supply)) * 100}
                                        sx={{
                                            height: 20,
                                            borderRadius: 1,
                                            [`&.${linearProgressClasses.colorPrimary}`]: {
                                                backgroundColor: '#4b4b4b',
                                            },
                                            [`& .${linearProgressClasses.bar}`]: {
                                                borderRadius: 1,
                                                background: 'linear-gradient(90deg, #038518 0%, #0fb300 100%)',
                                            },
                                        }}
                                    />

                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '100%',
                                            zIndex: 10,
                                            position: 'absolute',
                                            bottom: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            fontSize: '0.5rem',
                                            color: 'white', // Choose color that contrasts with the progress bar
                                        }}
                                    >
                                        {launch?.current_supply?.toLocaleString('en-US')} /{' '}
                                        {launch?.max_supply?.toLocaleString('en-US')}
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            fontSize: '1rem',
                                        }}
                                    >
                                        <span>0%</span>
                                        <span>100%</span>
                                    </div>
                                </Box>

                                {status === 'live' && (
                                    <>
                                        {loading && (
                                            <CircularProgress
                                                style={{
                                                    color: '#9ba3af',
                                                }}
                                            />
                                        )}

                                        {!loading && connected && (
                                            <AmountDiv>
                                                <span>Amount to Mint</span>
                                                <MintInput
                                                    disabled={status !== 'live'}
                                                    type={'number'}
                                                    placeholder="Enter Amount"
                                                    value={mintAmount}
                                                    onChange={(e: any) => setMintAmount(e.target.value)}
                                                />
                                                <span>
                                                    Total:{' '}
                                                    {mintAmount > 0
                                                        ? (mintAmount * launch.price) / LAMPORTS_PER_SOL
                                                        : 0}{' '}
                                                    SOL
                                                </span>
                                                <MintButton disabled={status !== 'live'} onClick={handleMint}>
                                                    Mint
                                                </MintButton>
                                            </AmountDiv>
                                        )}

                                        {!loading && !connected && <ConnectWallet />}
                                    </>
                                )}
                            </MintDetailsInner>
                        </LaunchMintDetails>
                    </ContainerRight>
                </Container>
            )}
        </>
    );
}

const Container = styled.div`
    display: flex;
    flex-direction: row;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 40px;
        height: fit-content;
    }
`;

const ContainerLeft = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    flex: 1;
    border-right: 2px dotted #272727;
    padding: 10px;
    height: 95vh;

    /* img {
        height: 400px;
        width: 400px;
    }

    @media (max-width: 768px) {
        border: none !important;
        width: fit-content;

        img {
            height: 200px;
            width: 200px;
        }
    } */
`;

const ContainerRight = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    flex: 1;
    padding: 10px;
`;

const LaunchDetails = styled.div`
    display: flex;
    flex-direction: column;
    align-items: space-between;
    justify-content: flex-start;
    height: fit-content;
    width: 100%;
`;

const LaunchDetailsHeader = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;
    min-height: 200px;

    img {
        height: 50px;
        width: 50px;
        border-radius: 50%;
    }
`;

const LaunchDetailsHeaderLeft = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 20px;
    font-size: 1.5rem;
`;

const LaunchDetailsBody = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 30px;
    font-size: 1rem;
`;

const LaunchDetailsBodyItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-size: small;
    width: 100%;
    line-height: 2.5rem;
    background-color: #131313;
    padding-left: 10px;
    padding-right: 10px;

    span:nth-child(1) {
        font-weight: bolder;
    }

    &:last-child {
        border-bottom: none;
    }
`;

const LaunchMintDetails = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    height: 100%;
`;

const MintDetailsInner = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
`;

const MintDetailsCountdownDiv = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 1rem;
    width: 100%;
`;

const AmountDiv = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    font-size: 1rem;

    span {
        font-weight: bolder;
        font-size: 0.8rem;
    }
`;

const MintInput = styled.input`
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    height: 30px;
    background-color: #131313;
    border: 2px dotted #272727;
    width: 300px;
    color: #9aa3af;
    padding: 5px;

    &:focus {
        outline: none;
        background-color: #1b1b1b;
    }
`;

const MintButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 1rem;
    width: 100%;
    padding: 10px;
    border: none;
    background-color: #0fb300;
    border-radius: 5px;
    color: #fff;
    cursor: pointer;
    margin-top: 10px;
    transition: all 0.3s ease-in-out;

    &:disabled {
        background-color: #202020;
        color: #9aa3af;
        cursor: not-allowed;

        &:hover {
            background-color: #202020;
        }
    }

    &:hover {
        background-color: #0d9900;
    }
`;

const CardBodySocialDiv = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;

    svg {
        height: 17px;
        width: 17px;
        cursor: pointer;
        transition: all 0.3s ease-in-out;

        &:hover {
            color: #0d9900;
        }
    }
`;
