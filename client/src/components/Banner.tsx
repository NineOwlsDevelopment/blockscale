import React from 'react';
import styled from 'styled-components';

export default function Banner() {
    return (
        <Container>
            <div>
                <h1>Launch your own token presale on Solana.</h1>
            </div>
        </Container>
    );
}

const Container = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    height: 500px;
    border: 2px dotted #272727;
    /* box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.75); */

    text-align: center;
`;
