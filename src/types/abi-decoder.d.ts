/// <reference types="web3-utils"/>

declare module 'abi-decoder' {
    import { AbiItem } from 'web3-utils';
    export declare function getABIs(): AbiItem[];
    export declare function addABI(items: AbiItem[]): void;
    export declare function removeABI(items: AbiItem[]): void;
    export declare function getMethodIDs(): Map<string, AbiItem>;
    export interface DecodedMethod {
        name: string;
        params: DecodedMethodParam[];
    }
    export interface DecodedMethodParam {
        name: string;
        type: string;
        value?: any;
    }
    export declare function decodeMethod(data: string): DecodedMethod | undefined;
    export interface LogItem {
        transactionIndex: string;
        logIndex: string;
        blockNumber: string;
        transactionHash: string;
        blockHash: string;
        data: string;
        topics: string[];
        address: string;
    }
    export declare function decodeLogs(logs: LogItem[]): ({
        name: string | undefined;
        events: DecodedMethodParam[] | undefined;
        address: string;
    } | undefined)[];
}

