// ===================================================================================
// === YOUR NEW, CORRECT SMART CONTRACT ADDRESS IS NOW HERE ===
// ===================================================================================
export const CHADFLIP_CONTRACT_ADDRESS = "0xfD354a6835A868e935A5F02a6a75d16019E84e12";
// ===================================================================================

export const CHAD_TOKEN_ADDRESS = "0x2bb4219b8e85c111613f3ee192a115676f230d35";

// IMPORTANT: Replace this with the REAL MON token address on Monad Testnet
// If you don't know it, you can leave the placeholder, but leverage > 1x will fail.
export const MON_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";

// The official Chain ID for the Monad Testnet. This is used to ensure the user is on the correct network.
export const MONAD_TESTNET_CHAIN_ID = 8008135n; // Use BigInt `n` for compatibility with ethers.js

export const chadFlipContractABI = [
    {"inputs":[{"internalType":"address","name":"_monTokenAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"betId","type":"uint256"},{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"leverage","type":"uint256"}],"name":"BetPlaced","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"betId","type":"uint256"},{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"bool","name":"won","type":"bool"},{"indexed":false,"internalType":"uint256","name":"payoutAmount","type":"uint256"}],"name":"BetResolved","type":"event"},
    {"inputs":[],"name":"MAX_LEVERAGE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"MON_TOKEN","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"betId","type":"uint256"}],"name":"bets","outputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"player","type":"address"},{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"leverage","type":"uint256"},{"internalType":"uint256","name":"collateral","type":"uint256"},{"internalType":"bool","name":"predictionUp","type":"bool"},{"internalType":"uint256","name":"placedTimestamp","type":"uint256"},{"internalType":"bool","name":"isResolved","type":"bool"}],"internalType":"struct Bet","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"player","type":"address"}],"name":"dailyBetAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"dailyBetLimit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"houseEdgePercent","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"player","type":"address"}],"name":"lastBetDay","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"nextBetId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"oracle","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"uint256","name":"_leverage","type":"uint256"},{"internalType":"bool","name":"_predictionUp","type":"bool"}],"name":"placeBet","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"_betId","type":"uint256"},{"internalType":"bool","name":"_priceWentUp","type":"bool"}],"name":"resolveBet","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"_newLimit","type":"uint256"}],"name":"setDailyBetLimit","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"_newEdge","type":"uint256"}],"name":"setHouseEdgePercent","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"_newOracle","type":"address"}],"name":"setOracle","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"withdrawTokens","outputs":[],"stateMutability":"nonpayable","type":"function"}
] as const;

export const erc20ABI = [
    {
        "type": "function", "name": "approve", "stateMutability": "nonpayable",
        "inputs": [ { "type": "address", "name": "spender" }, { "type": "uint256", "name": "amount" } ],
        "outputs": [{ "type": "bool", "name": "" }]
    },
    {
        "type": "function", "name": "balanceOf", "stateMutability": "view",
        "inputs": [{ "type": "address", "name": "owner" }],
        "outputs": [{ "type": "uint256", "name": "" }]
    },
    {
        "type": "function", "name": "decimals", "stateMutability": "view",
        "inputs": [],
        "outputs": [{ "type": "uint8", "name": "" }]
    },
    {
        "type": "function", "name": "allowance", "stateMutability": "view",
        "inputs": [ { "type": "address", "name": "owner" }, { "type": "address", "name": "spender" } ],
        "outputs": [{ "type": "uint256", "name": "" }]
    }
] as const;