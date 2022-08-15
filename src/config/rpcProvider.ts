import 'dotenv/config';

const {
    ALCHEMY_API_KEY: alchemyAPIKey,
} = process.env;

const rpcProvider = Object.freeze({
    eth: {
        alchemy: `https://eth-mainnet.alchemyapi.io/v2/${alchemyAPIKey}`,
        flashbot: 'https://rpc.flashbots.net/fast',
        ankr: 'https://rpc.ankr.com/eth',
        wssAlchemy: `wss://eth-mainnet.alchemyapi.io/v2/${alchemyAPIKey}`,
    },
    rinkeby: {
        alchemy: `wss://eth-rinkeby.alchemyapi.io/v2/${alchemyAPIKey}`,
    },
    goerli: {
        alchemy: `wss://eth-goerli.alchemyapi.io/v2/${alchemyAPIKey}`,
    },
    dev: 'socket://127.0.0.1:8545',
});


export default rpcProvider;