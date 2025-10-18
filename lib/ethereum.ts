export const getEthereumProvider = () =>
  typeof window !== "undefined" ? (window as typeof window & { ethereum?: any }).ethereum : undefined;
