import 'dotenv/config';
import { AlchemyWeb3, createAlchemyWeb3 } from '@alch/alchemy-web3';
import rpc from './config/rpcProvider';
import Web3 from 'web3';

export type RPCProvider = 'wssAlchemy' | 'restAlchemy' | 'flashbot' | 'restAnkr';

interface Option {
    networkId: number
    rpcProvider: RPCProvider
}

const getWeb3 = (option: Option): AlchemyWeb3 | Web3 => {
    const { networkId, rpcProvider } = option;
    if (rpcProvider == 'flashbot') {
        const web3 = new Web3(rpc.eth.flashbot);
        return web3;
    }

    if (rpcProvider == 'restAnkr') {
        const web3 = new Web3(rpc.eth.ankr);
        return web3;
    }

    let alchemyURL = rpc.dev;
    if (networkId == 1) {
        if (rpcProvider == 'restAlchemy') {
            alchemyURL = rpc.eth.alchemy;
        } else if (rpcProvider == 'wssAlchemy') {
            alchemyURL = rpc.eth.wssAlchemy;
        }
    }

    if (networkId == 4 ) {
        if (rpcProvider == 'restAlchemy') {
            alchemyURL = rpc.rinkeby.alchemy;
        }
    }

    if (networkId == 5) {
        alchemyURL = rpc.goerli.alchemy;
    }

    return createAlchemyWeb3(`${alchemyURL}`);
};

export { getWeb3 };