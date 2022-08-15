import { getGasPrice } from "../lib/blocknative";

// 0 最快 4 最慢
type Confidence = 0 | 1 | 2 | 3 | 4;

const getCurrentGasPrice = async (confidence: Confidence = 0) => {
  try {
    const gasNow = await getGasPrice();

    const blockPrice = gasNow.blockPrices[0];
    const estimatedPrices = blockPrice.estimatedPrices;
    const gas: Gas = {
      maxGasPrice: estimatedPrices[confidence].maxFeePerGas,
      priorityFee: estimatedPrices[confidence].maxPriorityFeePerGas,
      baseFee: blockPrice.baseFeePerGas,
    };

    return gas;
  } catch (err) {
    throw err;
  }
};

export { getCurrentGasPrice };