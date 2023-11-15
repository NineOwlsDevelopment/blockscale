import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useUserStore } from '../store';
import Banner from '../components/Banner';
import LaunchCard from '../components/LaunchCard';
import axios from 'axios';
import { toast } from 'react-toastify';

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

export default function Home() {
    const { id } = useUserStore();
    const [launches, setLaunches] = React.useState([] as Launch[]);
    const [search, setSearch] = React.useState('');
    const [page, setPage] = React.useState(1);
    const [limit, setLimit] = React.useState(6);

    const handlePagination = async () => {
        const fetchLaunches = async () => {
            const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/launches/?page=${page}&limit=${limit}`, {
                withCredentials: true,
            });

            setLaunches([...launches, ...res.data]);
        };

        fetchLaunches();
    };

    const handleSearch = async () => {
        try {
            const res = await axios.post(
                `${process.env.REACT_APP_SERVER_URL}/launches/query`,
                {
                    value: search,
                },
                { withCredentials: true }
            );

            setLaunches(res.data);
        } catch (err: any) {
            toast.error(err.response.data.message);
        }
    };

    const debounce = <F extends (...args: any[]) => void>(func: F, delay: number): (() => void) => {
        let timer: NodeJS.Timeout;

        return function (...args: Parameters<F>) {
            clearTimeout(timer);
            timer = setTimeout(() => {
                func(...args);
            }, delay);
        };
    };

    // Debounced search function
    const debouncedSearch = debounce(() => {
        handleSearch();
    }, 500);

    // useEffect for debounced search
    useEffect(() => {
        debouncedSearch();

        // Cancel the debounce on unmount
        return () => clearTimeout(debouncedSearch as unknown as NodeJS.Timeout);
    }, [search]);

    useEffect(() => {
        handlePagination();
    }, [page]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <Container>
                <Banner />

                <SearchBar>
                    <input
                        type="text"
                        placeholder="Enter token name or token symbol"
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </SearchBar>

                <CardContainer>
                    <CardGrid>
                        {launches.map((launch: any) => (
                            <LaunchCard key={launch.id} launch={launch} />
                        ))}
                    </CardGrid>
                </CardContainer>

                <LoadMore onClick={() => setPage(page + 1)}>Load More</LoadMore>
            </Container>
        </>
    );
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
`;

const CardContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`;

const CardGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 5rem;
    padding: 1rem;
    margin: 1rem;

    @media (max-width: 1168px) {
        grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 768px) {
        grid-template-columns: repeat(1, 1fr);
    }
`;

const LoadMore = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #fff;
    font-size: 1.5rem;
    font-weight: 600;
    padding: 1rem;
    background-color: #131313;
    transition: all 0.2s ease-in-out;

    &:hover {
        background-color: #2b2a2a;
    }
`;

const SearchBar = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    width: 100%;
    margin-top: 30px;

    input {
        width: 50%;
        padding: 1rem;
        border-radius: 5px;
        font-size: 1rem;
        font-weight: 600;
        border: 2px dotted #272727;
        transition: all 0.2s ease-in-out;
        background-color: #131313;
        color: #9aa3af;
        box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.75);

        &:focus {
            outline: none;
            background-color: #272727;
        }
    }
`;
