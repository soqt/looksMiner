import axios from 'axios';

const endPoint = 'https://api.blocknative.com/gasprices/blockprices';

const {
  BLOCKNATIVE_API_KEY: blockNativeAPIKey = '',
} = process.env;


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