import { BN } from 'ethereumjs-util';
import { FeeMarketEIP1559Transaction } from '@ethereumjs/tx';
import { AlchemyWeb3 } from '@alch/alchemy-web3';
import Web3 from 'web3';
import Common, { Chain, Hardfork } from '@ethereumjs/common';
import { getWeb3 } from '../web3Provider';
import * as serverChan from '../serverChan'

class Transaction {
    networkId: number;

    from: string;

    to: string;

    gas: Gas;

    value: BN;

    data: string;

    status?: TransactionStatus;

    privateKey :string;

    nonce: number;

    rpc: string;

    common: Common;

    // Value: in Wei
    constructor(networkId: number, sender: Wallet, to: string, value: string, gas: Gas, data?: string, rpc: string = 'alchemy') {
        this.networkId = networkId;
        this.from = sender.address;
        this.to = to;
        this.gas = gas;
        this.data = data || '0x';
        this.privateKey = this.trimPrivateKey(sender.privateKey);
        this.nonce = sender.nonce;
        this.rpc = rpc;
        this.value = new BN(value, 10);

        switch (networkId) {
            case 1: {
                this.common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.London });
                break;
            }
            case 4: {
                this.common = new Common({ chain: Chain.Rinkeby, hardfork: Hardfork.London });
                break;
            }
            default: {
                this.common = Common.custom({ chainId: this.networkId }, { hardfork: Hardfork.London });
            }
        }
    }

    private async constructTX(value: BN, data: string | undefined, gas: Gas, nonce: number) {
        const web3 = getWeb3({ networkId: 1, rpcProvider: 'restAlchemy' });
        const { gasLimit, priorityFee, maxGasPrice } = gas;
        const txWithoutGas = {
            from: this.from,
            nonce,
            to: this.to,
            value,
            data,
        };

        let gl = 0;
        // 如果Gas参数中的gasLimit被赋值，则用gasLimit的值 (比如block zero的时候)
        if (gasLimit && gasLimit != 0) {
            gl = gasLimit;
        } else if (this.networkId == 1 || this.networkId == 4) {
            gl = await this.getGasLimit(txWithoutGas);
        }

        const txData = {
            ...txWithoutGas,
            gasLimit: gl,
            maxPriorityFeePerGas: new BN(web3.utils.toWei(priorityFee + '', 'gwei'), 10),
            maxFeePerGas: new BN(web3.utils.toWei(maxGasPrice + '', 'gwei'), 10),
            chainId: web3.utils.toHex(this.networkId),
            type: '0x02', // eip 1559
            accessList: [],
        };
        // @ts-ignore
        const tx = FeeMarketEIP1559Transaction.fromTxData(txData, { common: this.common });
        const pk = Buffer.from(this.privateKey, 'hex');
        return tx.sign(pk);
    }

    async getGasLimit(tx: any, multiplier: number = 1.5) {
        const web3 = getWeb3({ networkId: 1, rpcProvider: 'restAlchemy' });
        const gl = await web3.eth.estimateGas(tx);
        return Math.round(gl * multiplier);
    }

    async send(successCallback: () => any) {
        try {
            const signedTx = await this.constructTX(this.value, this.data, this.gas, this.nonce);  // estimate gas会花费2秒左右
            let web3: AlchemyWeb3 | Web3;
            if (this.rpc == 'flashbot') {
                web3 = getWeb3({ networkId: 1, rpcProvider: 'flashbot' });
            } else {
                web3 = getWeb3({ networkId: 1, rpcProvider: 'restAlchemy' });
            }
            web3.eth.sendSignedTransaction('0x' + signedTx.serialize().toString('hex'))
                .on('sending', () => {
                    console.log('交易发送中...');
                })
                .on('transactionHash', async (transactionHash) => {
                    console.log(`Transaction Hash: ${transactionHash}`);
                })
                .on('receipt', (async (receipt) => {
                    // const { transactionHash, gasUsed, status, from, to } = receipt;
                    const { transactionHash } = receipt;
                    console.log('[🤟 Transaction Mined] ', transactionHash);
                    await successCallback()
                }))
                .on('error', (err:Error) => {
                    console.log('[Transaction 错误]', err);
                    serverChan.pushMessage("取消挂单失败!", err.message)
                });
        } catch (err) {
            console.log('交易出错了!', err);
            // throw err;
        }
    }

    private trimPrivateKey(pk: string) {
        if (pk.startsWith('0x')) {
            return pk.substring(2);
        } else {
            return pk;
        }
    }
}

export default Transaction;