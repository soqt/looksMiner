import _ from 'lodash';
import dotenv from 'dotenv';
import { BN } from "ethereumjs-util";
import { getWeb3 } from "./src/web3Provider";
import Transaction from "./src/transaction/Transaction";
import { AlchemyWeb3 } from "@alch/alchemy-web3";
import LooksRareClient from "./src/lib/looksrare";
import { getCurrentGasPrice } from './src/gas';
import * as serverChan from './src/serverChan';
import logger from './src/logger'

dotenv.config();

const {
    PUBLIC_ADDRESS: publicAddress,
    PRIVATE_KEY: privateKey,
    LOOKSRARE_API_KEY: looksrareAPIKey,
    HIGHER_PRICE_NFT_IDS: higherPriceNftIds
} = process.env;

const looksrareContract = "0x59728544b08ab483533076417fbbb2fd0b17ce3a"
const NftContract = "0x34d85c9CDeB23FA97cb08333b511ac86E1C4E258" // Otherside
const higerPriceIds = higherPriceNftIds ? higherPriceNftIds.split(",") : []

const PRICE_RATIO_RANGE = [1.05, 1.06]
const PRICE_MULTIPLIER = 1.08

const web3 = getWeb3({ networkId: 1, rpcProvider: 'restAlchemy'}) as AlchemyWeb3

/**
 * 取消Looksrare全部挂单
 * @param callback {() => any} Transaction成功后的回调函数
 * */
const cancelListing = async (callback: () => any) => {
    const lrClient = new LooksRareClient(looksrareAPIKey!)
    const abi = require('./src/looksrareABI.json')
    const looksContract = new web3.eth.Contract(abi, looksrareContract);
    const orderNonce = await lrClient.getOrdersNonce(publicAddress!)
    const data = looksContract.methods['cancelAllOrdersForSender'](orderNonce).encodeABI();
    const nonce = await web3.eth.getTransactionCount(publicAddress!, 'latest'); //get latest nonce
    const sender: Wallet = {
        privateKey: privateKey!,
        address: publicAddress!,
        nonce,
        balance: 0
    }

    const gas = await getCurrentGasPrice(2)
    const tx = new Transaction(1, sender, looksrareContract, "0", gas, data)
    await tx.send(callback)
}

/**
 * 根据地板价计算挂单价
 * @param floorPriceInWei {string} 地板价(单位Wei)
 * @return {string} 挂单价(单位Wei)
 * */
const calculateNewPrice = (floorPriceInWei: string): string => {
    const ether = web3.utils.fromWei(new BN(floorPriceInWei))
    const newFloorInEth = parseFloat(ether) * PRICE_MULTIPLIER
    const newFloor = Math.round(newFloorInEth * 100) / 100
    return web3.utils.toWei(newFloor + '', 'ether')
}

/**
 * 从Alchemy API获取当前钱包中全部对应合约的NFT
 * @return {string[]} tokenId
 * */
const getTokenIds = async () : Promise<string[]> => {
    try {
        const nfts = await web3.alchemy.getNfts({
            owner: publicAddress!,
            contractAddresses: [NftContract],
        });
        const ids = nfts.ownedNfts.map(nft => {
            const tokenId = nft.id.tokenId
            return web3.utils.hexToNumber(tokenId) + ''
        })
        return ids
    } catch (err) {
        logger.error(err)
        throw err
    }
}

/**
 * 计算当前Nft挂单价与地板价的百分比
 * @param {string} nftPrice NFT挂单价(单位Wei)
 * @param {string} floorPrice 当前NFT系列地板价(单位Wei)
 * @return number 小数
 * */
const calculatePriceDiffRatio = (nftPrice: string, floorPrice: string): number => {
    const curPriceEth = web3.utils.fromWei(nftPrice, 'ether')
    const curFloorEth = web3.utils.fromWei(floorPrice, 'ether')
    return parseFloat(curPriceEth) / parseFloat(curFloorEth)
}

interface NFTPrice {
    tokenId: string
    price: string
}

/**
 * 上架NFT
 * @param nftIds {string[]} Nft ID Array
 * @param floorPrice {string} 单位Wei
 * */
const listNfts = async(nftIds: string[], floorPrice: string): Promise<NFTPrice[]> => {
    try {
        let listings: NFTPrice[] = []
        const lrClient = new LooksRareClient(looksrareAPIKey!)
        for (let i = 0; i < nftIds.length; i++) {
            let newPrice = calculateNewPrice(floorPrice)
            const tokenId = nftIds[i]
            if (_.includes(higerPriceIds, tokenId)) {
                const ether = web3.utils.toWei("0.2", 'ether')
                newPrice = (new BN(newPrice).add(new BN(ether))).toString()
            }
            const curPriceWei = await lrClient.getNftPrice(NftContract, tokenId)
            const curPriceEth = parseFloat(web3.utils.fromWei(curPriceWei, 'ether'))
            const newPriceEth = parseFloat(web3.utils.fromWei(newPrice, 'ether'))

            if (curPriceEth == 0 || newPriceEth < curPriceEth) {
                logger.info(`准备上架${nftIds[i]}`)
                await lrClient.createOrder(NftContract, privateKey!, tokenId, newPrice)
                listings.push({
                    tokenId,
                    price: newPriceEth.toString()
                })
            }
        }
        logger.info(`Successfully listed tokens ${listings}`)
        await serverChan.pushMessage("成功上架", listings.toString())
        return listings
    } catch (err) {
        logger.error("挂单错误", err)
        serverChan.pushMessage("挂单错误", (err as Error).message)
        throw err
    }
}

const main = async () => {
    try {
        const nftIds = await getTokenIds()
        let nftId = ''
        for (let i = 0; i < nftIds.length; i++) {
            if (!_.includes(higerPriceIds, nftIds[i])) {
                nftId = nftIds[i]
                break
            }
        }
        const lrClient = new LooksRareClient(looksrareAPIKey!)

        const { floorPrice } = await lrClient.getCollectionsStats(NftContract)

        const nftPrice = await lrClient.getNftPrice(NftContract, nftId)

        const priceInfo = `[挂单价格]: ${web3.utils.fromWei(nftPrice, 'ether')} ETH; [地板价]: ${web3.utils.fromWei(floorPrice, 'ether')} ETH`
        logger.info(priceInfo)
        await serverChan.pushMessage("当前NFT价格信息", priceInfo)

        const priceDiffRatio = calculatePriceDiffRatio(nftPrice, floorPrice)
        if (priceDiffRatio != 0 && priceDiffRatio < PRICE_RATIO_RANGE[0]) {
            const callback = async () => {
                serverChan.pushMessage("取消挂单成功")
                await listNfts(nftIds, floorPrice)
            }
            await serverChan.pushMessage("正在取消挂单", `当前价格已经低于地板价的${PRICE_RATIO_RANGE[0]})倍`)

            await cancelListing(callback)
        } else if (priceDiffRatio == 0 || priceDiffRatio > PRICE_RATIO_RANGE[1]){
            logger.info("[out range] Listing token now...")
            await listNfts(nftIds, floorPrice)
        }
    } catch (err) {
        throw err
    }
}

main()
    .then(async() => {
        logger.info("Done.")
    })
    .catch(err => {
        logger.error(err)
    })