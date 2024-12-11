
export enum ChainId {
  ETH = '0x1', // Ethereum Mainnet
  BSC = '0x38', // BNB Smart Chain Mainnet
  POLYGON = '0x89', // Polygon Mainnet
  AVALANCHE = '0xa86a', // Avalanche C-Chain
}

export const chainMapping = {
  eth: ChainId.ETH,
  bsc: ChainId.BSC,
  polygon: ChainId.POLYGON,
  avalanche: ChainId.AVALANCHE,
};
