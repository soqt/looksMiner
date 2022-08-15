declare namespace BlockNative{
    interface BlockPriceMeta {
      system: 'bitcoin' | 'ethereum',
      network: 'main',
      unit: string,
      maxPrice: number,
      currentBlockNumber: number,
      msSinceLastBlock: number,
      blockPrices: BlockPrice[]
    }
  
    interface BlockPrice {
      blockNumber: number,
      estimatedTransactionCount: number,
      baseFeePerGas: number,
      estimatedPrices:EstimatedPrice[],
      estimatedBaseFees: EstimateBaseFee[]
    }
  
    interface EstimatedPrice {
      confidence: number,
      price: number,
      maxPriorityFeePerGas: number,
      maxFeePerGas: number
    }
  
    interface EstimateBaseFee {
      [pending: string]: Pending[]
    }
  
    interface Pending {
      confidence: number,
      baseFee: number
    }
  }