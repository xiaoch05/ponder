import type {
  BlockFilterCriteria,
  EventSource,
  FactoryCriteria,
  LogFilterCriteria,
} from "@/config/sources.js";
import type { HeadlessKysely } from "@/database/kysely.js";
import type {
  Block,
  Log,
  Transaction,
  TransactionReceipt,
} from "@/types/eth.js";
import type { Checkpoint } from "@/utils/checkpoint.js";
import type {
  Address,
  RpcBlock,
  RpcLog,
  RpcTransaction,
  RpcTransactionReceipt,
} from "viem";

export type RawEvent = {
  chainId: number;
  sourceId: string;
  log?: Log;
  block: Block;
  transaction?: Transaction;
  transactionReceipt?: TransactionReceipt;
  encodedCheckpoint: string;
};

export interface SyncStore {
  kind: "sqlite" | "postgres";
  db: HeadlessKysely<any>;

  /**
   * Insert a list of logs & associated transactions matching a given log filter
   * within a specific block. Also insert the log interval recording the eth_getLogs
   * request that was made and returned this result.
   *
   * Note that `block.number` should always be equal to `interval.endBlock`.
   */
  insertLogFilterInterval(options: {
    chainId: number;
    logFilter: LogFilterCriteria;
    block: RpcBlock;
    transactions: RpcTransaction[];
    transactionReceipts: RpcTransactionReceipt[];
    logs: RpcLog[];
    interval: { startBlock: bigint; endBlock: bigint };
  }): Promise<void>;

  /**
   * Get all block intervals where logs (and associated blocks & transactions)
   * matching the specified log filter have already been inserted.
   */
  getLogFilterIntervals(options: {
    chainId: number;
    logFilter: LogFilterCriteria;
  }): Promise<[number, number][]>;

  /**
   * Insert a list of logs containing factory child addresses.
   *
   * Note that the log filter interval for these logs gets inserted
   * in a separate call to `insertLogFilterInterval`. The purpose of this
   * method is to make the logs available to `getFactoryChildAddresses`
   * without requiring that the associated block & transaction have been inserted.
   */
  insertFactoryChildAddressLogs(options: {
    chainId: number;
    logs: RpcLog[];
  }): Promise<void>;

  /**
   * Get all child contract addresses that have been created by
   * the specified factory up to the specified block number.
   *
   * Returns an async generator with a default page size of 500.
   */
  getFactoryChildAddresses(options: {
    chainId: number;
    factory: FactoryCriteria;
    fromBlock: bigint;
    toBlock: bigint;
    pageSize?: number;
  }): AsyncGenerator<Address[]>;

  /**
   * Insert a list of logs & associated transactions produced by all child
   * contracts of the specified factory within a specific block. Also insert the log
   * interval recording the eth_getLogs request that was made and returned this result.
   *
   * Note that `block.number` should always be equal to `interval.endBlock`.
   */
  insertFactoryLogFilterInterval(options: {
    chainId: number;
    factory: FactoryCriteria;
    block: RpcBlock;
    transactions: RpcTransaction[];
    transactionReceipts: RpcTransactionReceipt[];
    logs: RpcLog[];
    interval: { startBlock: bigint; endBlock: bigint };
  }): Promise<void>;

  /**
   * Get all block intervals where logs (and associated blocks & transactions)
   * produced by all child contracts of the specified factory contract have already
   * been inserted.
   */
  getFactoryLogFilterIntervals(options: {
    chainId: number;
    factory: FactoryCriteria;
  }): Promise<[number, number][]>;

  /**
   * Insert a block matching a given block filter. Also insert the block interval. It
   * is possible for block to be undefined if we already know it is in the database.
   *
   * Note that `block.number` should always be equal to `interval.endBlock`.
   */
  insertBlockFilterInterval(options: {
    chainId: number;
    blockFilter: BlockFilterCriteria;
    block?: RpcBlock;
    interval: { startBlock: bigint; endBlock: bigint };
  }): Promise<void>;

  /**
   * Get all block intervals where blocks matching the specified block
   * filter have already been inserted.
   */
  getBlockFilterIntervals(options: {
    chainId: number;
    blockFilter: BlockFilterCriteria;
  }): Promise<[number, number][]>;

  /**
   * Returns true if the block exists in the database.
   */
  getBlock(options: {
    chainId: number;
    blockNumber: number;
  }): Promise<boolean>;

  /**
   * Inserts a new realtime block and any logs/transactions that match the
   * registered sources. Does NOT insert intervals to mark this data as finalized,
   * see insertRealtimeInterval for that.
   */
  insertRealtimeBlock(options: {
    chainId: number;
    block: RpcBlock;
    transactions: RpcTransaction[];
    transactionReceipts: RpcTransactionReceipt[];
    logs: RpcLog[];
  }): Promise<void>;

  /**
   * Marks data as finalized by inserting cache intervals for all registered sources
   * in real time.
   */
  insertRealtimeInterval(options: {
    chainId: number;
    logFilters: LogFilterCriteria[];
    factories: FactoryCriteria[];
    blockFilters: BlockFilterCriteria[];
    interval: { startBlock: bigint; endBlock: bigint };
  }): Promise<void>;

  /**
   * Deletes logs and contract calls from the store with a block number GREATER
   * than the specified block number. Any data at fromBlock is not deleted.
   */
  deleteRealtimeData(options: {
    chainId: number;
    fromBlock: bigint;
  }): Promise<void>;

  /** RPC REQUEST METHODS */

  insertRpcRequestResult(options: {
    request: string;
    blockNumber: bigint;
    chainId: number;
    result: string;
  }): Promise<void>;

  getRpcRequestResult(options: {
    request: string;
    blockNumber: bigint;
    chainId: number;
  }): Promise<{
    request: string;
    blockNumber: bigint;
    chainId: number;
    result: string;
  } | null>;

  /** EVENTS METHOD */

  getLogEvents(arg: {
    sources: EventSource[];
    fromCheckpoint: Checkpoint;
    toCheckpoint: Checkpoint;
    limit: number;
  }): AsyncGenerator<RawEvent[]>;

  getLastEventCheckpoint(arg: {
    sources: EventSource[];
    fromCheckpoint: Checkpoint;
    toCheckpoint: Checkpoint;
  }): Promise<Checkpoint | undefined>;
}
