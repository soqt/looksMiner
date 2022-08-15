import axios from 'axios';
import { BigNumber, ethers } from 'ethers';
import { addressesByNetwork, generateMakerOrderTypedData, SupportedChainId, MakerOrder } from '@looksrare/sdk';

const endpoint = 'https://api.looksrare.org/api/v1';

type OrderStatus = "VALID" | "CANCELLED"

export interface Order {
    hash: string,
    collectionAddress: string,
    tokenId: string,
    isOrderAsk: boolean,
    price: string
    status: OrderStatus
}

interface CollectionStat {
    floorPrice: string
}


class LooksRareClient {
    apiKey: string

    constructor(apiKey: string) {
        this.apiKey = apiKey
    }

    getOrdersNonce = async (address: string): Promise<number> => {
        try {
            const  { data } = await axios.get(`${endpoint}/orders/nonce`, {
                params: {
                    address,
                },
            });

            if (data.success) {
                return parseInt(data.data);
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            throw err;
        }
    };

    createOrder = async (
        collectionAddress: string,
        privateKey: string,
        tokenId: string,
        priceInWei: string,
    ) => {
        const price = BigNumber.from(priceInWei)
        const order = await this.prepareMakeOrder(collectionAddress, privateKey, tokenId, price);
        try {
            const { data } = await axios.post(`${endpoint}/orders`, order, {
                headers: {
                    'X-Looks-Api-Key': this.apiKey
                },
            });
            return data;
        } catch (err) {
            throw err;
        }
    };

    getOrder = async (contractAddress: string, tokenId: string): Promise<Order> => {
        try {
            const  { data } = await axios.get(`${endpoint}/orders/`, {
                params: {
                    isOrderAsk: true,
                    collection: contractAddress,
                    tokenId: tokenId,
                    sort: "NEWEST"
                },
            });

            if (data.success) {
                return data.data[0];
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            throw err;
        }
    }

    getNftPrice = async (contractAddress: string, tokenId: string): Promise<string> => {
        try {
            const order = await this.getOrder(contractAddress, tokenId)
            if (order.status == "VALID") {
                return order.price
            } else {
                return "0"
            }
        } catch (err) {
            throw err;
        }
    }


    getCollectionsStats = async (address: string): Promise<CollectionStat> => {
        try {
            const  { data } = await axios.get(`${endpoint}/collections/stats`, {
                params: {
                    address,
                },
            });

            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            throw err;
        }
    };

    prepareMakeOrder = async (
        collectionAddress: string,
        privateKey: string,
        tokenId: string,
        priceInWei: BigNumber,
    ): Promise<any> => {
        const signer = new ethers.Wallet(privateKey);
        const signerAddress = await signer.getAddress();
        const chainId = SupportedChainId.MAINNET;

        const addresses = addressesByNetwork[chainId];
        const nonce = await this.getOrdersNonce(signerAddress);

        const now = Math.floor(Date.now() / 1000);
        const paramsValue: any[] = [];

        // Get protocolFees and creatorFees from the contracts
        // const netPriceRatio = BigNumber.from(10000).sub(protocolFees.add(creatorFees)).toNumber();
        // This variable is used to enforce a max slippage of 25% on all orders, if a collection change the fees to be >25%, the order will become invalid
        // const minNetPriceRatio = 7500;
        const makerOrder: MakerOrder = {
            isOrderAsk: true,
            signer: signerAddress,
            collection: collectionAddress,
            price: priceInWei.toString(), // :warning: PRICE IS ALWAYS IN WEI :warning:
            tokenId: tokenId, //string; Token id is 0 if you use the STRATEGY_COLLECTION_SALE strategy
            amount: '1',
            strategy: addresses.STRATEGY_STANDARD_SALE,
            currency: addresses.WETH,
            nonce: nonce,
            startTime: now,
            endTime: now + (86400 * 7), // 7 day validity
            // minPercentageToAsk: Math.max(netPriceRatio, minNetPriceRatio),
            minPercentageToAsk: 8500,
            params: paramsValue,
        };

        const { domain, value, type } = generateMakerOrderTypedData(signerAddress, chainId, makerOrder);
        const signature = await signer._signTypedData(domain, type, value);

        const data = {
            ...makerOrder,
            signature,
        };
        return data;
    };
}

export default LooksRareClient;