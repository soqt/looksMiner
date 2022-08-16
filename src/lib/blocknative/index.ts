import axios from 'axios';
import axiosRetry from "axios-retry";

const endPoint = 'https://api.blocknative.com/gasprices/blockprices';

const {
  BLOCKNATIVE_API_KEY: blockNativeAPIKey = '',
} = process.env;

axiosRetry(axios, {
  retries: 6,
  retryDelay: axiosRetry.exponentialDelay
})

const getGasPrice = async (): Promise<BlockNative.BlockPriceMeta> => {
  try {
    const gas = await axios({
      url: endPoint,
      method: 'GET',
      headers: {
        'Authorization': blockNativeAPIKey,
      },
    });
    return gas.data;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export { getGasPrice };