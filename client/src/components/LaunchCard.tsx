import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import gold from '../assets/gold.png';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { FaSquareXTwitter as TwitterIcon } from 'react-icons/fa6';
import { BsDiscord as DiscordIcon, BsGlobe } from 'react-icons/bs';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

let max_number = 9000000000000000;

export default function LaunchCard({ launch }: any) {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState('');
    const [status, setStatus] = useState('');

    const handleClick = (id: string) => {
        navigate(`/launchpad/${id}`);
    };

    const handleSocialLinkClick = (event: any, link: string) => {
        event.preventDefault();
        window.open(link, '_blank');
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

    const getStartCountdown = () => {
        const launchDate = new Date(launch.start_date);
        const now = new Date();
        const diff = launchDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    const getEndCountdown = () => {
        if (new Date(launch.end_date) < new Date()) {
            return setCountdown('0d 0h 0m 0s');
        }

        const launchDate = new Date(launch.end_date);
        const now = new Date();
        const diff = launchDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    useEffect(() => {
        if (Number(launch.current_supply) >= Number(launch.max_supply)) {
            setStatus('finished');
            return setCountdown('0d 0h 0m 0s');
        }

        if (new Date(launch.start_date) < new Date()) {
            const interval = setInterval(() => {
                setStatus('live');
                getEndCountdown();
            }, 1000);

            return () => clearInterval(interval);
        }

        if (new Date(launch.start_date) > new Date()) {
            const interval = setInterval(() => {
                setStatus('upcoming');
                getStartCountdown();
            }, 1000);

            return () => clearInterval(interval);
        }

        if (new Date(launch.end_date) < new Date()) {
            setStatus('ended');
            return setCountdown('0d 0h 0m 0s');
        }
    }, [launch.start_date, launch.end_date]);

    return (
        <Card>
            <CardHeader>
                <CardHeaderContainer>
                    <CardHeaderLeft>
                        <img src={`${process.env.REACT_APP_AWS_BASE_URL}${launch.image}`} alt="token_image" />
                        <span>{launch.name}</span>
                    </CardHeaderLeft>
                    {/* 
                    <CardHeaderRight>
                        <CardHeaderRightDiv>
                            <span>Price:</span>
                            <span>0.0001 BLS</span>
                        </CardHeaderRightDiv>

                        <CardHeaderRightDiv>
                            <span>Max Supply:</span>
                            <span>10M BLS</span>
                        </CardHeaderRightDiv>
                    </CardHeaderRight> */}
                </CardHeaderContainer>
            </CardHeader>

            <CardBody>
                <CardBodyContainer>
                    <CardBodyItem>
                        <span>Max Supply:</span>
                        <span>{Number(launch.max_supply).toLocaleString('en-US')}</span>
                    </CardBodyItem>

                    <CardBodyItem>
                        <span>Price (1 {launch.symbol}):</span>
                        <span>{launch.price / LAMPORTS_PER_SOL} SOL</span>
                    </CardBodyItem>

                    <CardBodyItem>
                        <span>Progress:</span>
                        <Box
                            sx={{
                                width: '100%',
                                margin: 'auto',
                                position: 'relative',
                            }}
                        >
                            <LinearProgress
                                variant="determinate"
                                value={(launch.current_supply / Number(launch.max_supply)) * 100}
                                sx={{
                                    height: 15,
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
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                }}
                            >
                                {launch.current_supply.toLocaleString('en-US')} /{' '}
                                {launch.max_supply.toLocaleString('en-US')}
                            </div>
                        </Box>
                    </CardBodyItem>

                    <CardBodyItem>
                        <span>Socials:</span>
                        <CardBodySocialDiv>
                            {launch.website && (
                                <BsGlobe
                                    onClick={(event) => {
                                        handleSocialLinkClick(event, launch.website);
                                    }}
                                />
                            )}

                            {launch.twitter && (
                                <TwitterIcon
                                    onClick={(event) => {
                                        handleSocialLinkClick(event, launch.twitter);
                                    }}
                                />
                            )}

                            {launch.discord && (
                                <DiscordIcon
                                    onClick={(event) => {
                                        handleSocialLinkClick(event, launch.discord);
                                    }}
                                />
                            )}
                        </CardBodySocialDiv>
                    </CardBodyItem>
                </CardBodyContainer>
            </CardBody>

            <CardFooter>
                <CardFooterContainer>
                    <CardFooterLeft>
                        <CardFooterLeftDiv>
                            <span>{getLaunchStatus()}</span>
                            <span>{countdown}</span>
                        </CardFooterLeftDiv>
                    </CardFooterLeft>

                    <CardFooterRight>
                        <button
                            onClick={() => {
                                handleClick(`${launch.id}`);
                            }}
                        >
                            View
                        </button>
                    </CardFooterRight>
                </CardFooterContainer>
            </CardFooter>
        </Card>
    );
}

const Card = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 500px;
    width: 300px;
    border: 2px dotted #272727;
    /* background-color: #0e0e0e; */
    background-color: #131313;
    border-radius: 5px;
    font-family: 'Roboto', sans-serif;
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.75);
`;

// HEADER
const CardHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100px;
    width: 100%;
    border-bottom: 2px dotted #272727;
`;

const CardHeaderContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

const CardHeaderLeft = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    height: 100px;
    padding-left: 10px;
    gap: 10px;
    font-size: 1rem;
    flex: 50%;
    font-weight: bold;

    img {
        height: 40px;
        width: 40px;
        border-radius: 50%;
    }
`;

const CardHeaderRight = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 5px;
    height: 100px;
    padding-right: 10px;
    font-size: 0.8rem;
    flex: 50%;
`;

const CardHeaderRightDiv = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

// BODY
const CardBody = styled.div`
    display: flex;
    align-items: center;
    justify-content: spa;
    height: 400px;
    width: 100%;
`;

const CardBodyContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    width: 100%;
    height: 100%;
    padding: 10px;
    gap: 10px;
`;

const CardBodyItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
    width: 100%;
`;

const CardBodyItemLabel = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
`;

const CardBodySocialDiv = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    gap: 10px;

    svg {
        height: 20px;
        width: 20px;
        cursor: pointer;
        transition: all 0.3s ease-in-out;

        &:hover {
            color: #0fb300;
        }
    }
`;

// FOOTER
const CardFooter = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
    width: 100%;
    border-top: 2px dotted #272727;
`;

const CardFooterContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

const CardFooterLeft = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    height: 100px;
    padding-left: 10px;
    gap: 5px;
    font-size: 0.8rem;
    flex: 50%;
    font-weight: bold;
`;

const CardFooterLeftDiv = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
    gap: 5px;
`;

const CardFooterRight = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 5px;
    height: 100px;
    padding-right: 10px;
    font-size: 0.8rem;
    flex: 50%;

    button {
        padding: 10px;
        border-radius: 5px;
        background-color: #038518;
        color: white;
        font-weight: bold;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease-in-out;

        &:hover {
            background-color: #0fb300;
        }
    }
`;
