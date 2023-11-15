import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import ConnectWallet from './ConnectWallet';
import logo from '../assets/logo.png';

export default function Navbar() {
    const navigate = useNavigate();

    return (
        <Nav>
            <NavLeft onClick={() => navigate('/')}>
                <img src={logo} alt="logo" />
                Blockscale
            </NavLeft>

            <NavCenter>
                <button onClick={() => navigate('/create-launch')}>Create Launch</button>
                <button onClick={() => navigate('/create-token')}>Create Token</button>
            </NavCenter>

            <NavRight>
                <ConnectWallet />
            </NavRight>
        </Nav>
    );
}

const Nav = styled.nav`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 6vh;
    background-color: #0d0d0d;
    border-bottom: 2px dotted #272727;
    color: #9aa3af;

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
            color: #0fb300;
        }
    }

    a {
        text-decoration: none;
        color: #9aa3af;
    }
`;

const NavLeft = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex: 20%;
    font-weight: bolder;
    padding: 10px;
    cursor: pointer;

    img {
        height: 30px;
        width: 30px;
        margin-right: 10px;
    }
`;

const NavCenter = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 60%;

    @media (max-width: 768px) {
        display: none;
    }
`;

const NavRight = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    flex: 20%;

    @media (max-width: 768px) {
        flex: 100%;
    }
`;
