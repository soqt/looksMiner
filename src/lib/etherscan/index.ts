import 'dotenv/config';
import { AbiItem } from 'web3-utils';
import axios from 'axios';

const apiKey = process.env.ETHERSCAN_API_KEY;

const getAPIUrl = function (networkId: number) {
    let etherscanAPI = '';
    if (networkId == 4) {
        etherscanAPI = 'https://api-rinkeby.etherscan.io/api';
    } else {
        etherscanAPI = 'https://api.etherscan.io/api';
    }
    return etherscanAPI;
};


/**
 * 通过EtherScan获取ABI
 * 如果合约没有开源，则返回空Array
 * */
const getABI = async function (networkId: number, address: string): Promise<AbiItem[]> {
    const URL = getAPIUrl(networkId);
    try {
        let abi: AbiItem[];
        const result = await axios.get(`${URL}?module=contract&action=getabi&address=${address}&apikey=${apiKey}`);
        // 网络错误
        if (result.status != 200) {
            throw new Error('[getABI] failed]');
        }

        // 合约未开源
        if (result.data.status != 1) {
            return [];
        }

        abi = JSON.parse(result.data.result);
        return abi;
    } catch (err) {
        console.log(`[getABI] failed, ${err}`);
        throw err;
    }
};


export { getABI };