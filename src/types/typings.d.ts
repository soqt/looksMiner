declare interface Gas {
    maxGasPrice: number,
    priorityFee: number,
    gasLimit?: number,
    baseFee?: number
}

declare type TransactionStatus = 'pending' | 'success' | 'fail' | 'dropped';

declare interface ETHTransaction extends Gas {
    transactionHash: string,
    networkId: number,
    status: TransactionStatus,
    from: string,
    to: string,
    value: string,
    nonce: number,
    gasUsed?: number,
    data: string,
    method?: string,
    count?: number, // Mint相关参数
}

declare interface TransactionResponse extends ETHTransaction {
    imageURL?: string,
    name?: string
}

declare interface WalletBase {
    address: string,
    privateKey: string,
}

declare interface Wallet extends WalletBase {
    nonce: number,
    balance: number
}
