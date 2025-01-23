// Initial test not for live use


require('dotenv').config();
const {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL
} = require('@solana/web3.js');
const {
    Token,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
} = require('@solana/spl-token');
const bs58 = require('bs58');

// Validate Environment Variables
const requiredEnvVars = [
    'SOLANA_RPC_URL',
    'PRIVATE_KEY',
    'SOL_TOKEN_MINT_ADDRESS',
    'YOUR_TOKEN_MINT_ADDRESS',
    'FUNDING_AMOUNT',
    'NUM_WALLETS'
];

requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        throw new Error(`Environment variable ${varName} is not set.`);
    }
});

// Initialize Connection
const connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed');

// Load Main Wallet
const privateKey = Uint8Array.from(JSON.parse(process.env.PRIVATE_KEY));
const mainWallet = Keypair.fromSecretKey(privateKey);

// Define Token Mints
const SOL_TOKEN_MINT_ADDRESS = new PublicKey(process.env.SOL_TOKEN_MINT_ADDRESS);
const YOUR_TOKEN_MINT_ADDRESS = new PublicKey(process.env.YOUR_TOKEN_MINT_ADDRESS);

// Utility Functions

/**
 * Get the current SOL balance of a wallet.
 * @param {Keypair} wallet
 * @returns {Promise<number>}
 */
async function getCurrentSOLBalance(wallet) {
    const balance = await connection.getBalance(wallet.publicKey);
    return balance;
}

/**
 * Get the token balance for a specific mint.
 * @param {Keypair} wallet
 * @param {PublicKey} tokenMint
 * @returns {Promise<number>}
 */
async function getTokenBalance(wallet, tokenMint) {
    const token = new Token(connection, tokenMint, TOKEN_PROGRAM_ID, wallet);
    const tokenAccount = await token.getOrCreateAssociatedAccountInfo(wallet.publicKey);
    const balanceInfo = await token.getAccountInfo(tokenAccount.address);
    return parseFloat(balanceInfo.amount.toString()) / Math.pow(10, await getTokenDecimals(tokenMint));
}

/**
 * Get the decimals for a token mint.
 * @param {PublicKey} tokenMint
 * @returns {Promise<number>}
 */
async function getTokenDecimals(tokenMint) {
    const token = new Token(connection, tokenMint, TOKEN_PROGRAM_ID, mainWallet);
    const mintInfo = await token.getMintInfo(tokenMint);
    return mintInfo.decimals;
}

/**
 * Create an associated token account for a wallet and token mint.
 * @param {Keypair} wallet
 * @param {PublicKey} tokenMint
 * @returns {Promise<PublicKey>}
 */
async function createAssociatedTokenAccount(wallet, tokenMint) {
    const token = new Token(connection, tokenMint, TOKEN_PROGRAM_ID, wallet);
    const associatedAccount = await token.getOrCreateAssociatedAccountInfo(wallet.publicKey);
    return associatedAccount.address;
}

/**
 * Perform a simulated trade by transferring SOL or tokens between wallets.
 * @param {Keypair} sender
 * @param {Keypair} receiver
 * @param {string} asset - 'SOL' or 'TOKEN'
 * @param {number} amount - Amount in SOL or tokens
 * @returns {Promise<boolean>}
 */
async function performTrade(sender, receiver, asset, amount) {
    try {
        let transaction = new Transaction();
        if (asset === 'SOL') {
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: sender.publicKey,
                    toPubkey: receiver.publicKey,
                    lamports: amount * LAMPORTS_PER_SOL,
                })
            );
        } else if (asset === 'TOKEN') {
            const token = new Token(connection, YOUR_TOKEN_MINT_ADDRESS, TOKEN_PROGRAM_ID, sender);
            const senderTokenAccount = await createAssociatedTokenAccount(sender, YOUR_TOKEN_MINT_ADDRESS);
            const receiverTokenAccount = await createAssociatedTokenAccount(receiver, YOUR_TOKEN_MINT_ADDRESS);

            transaction.add(
                Token.createTransferInstruction(
                    TOKEN_PROGRAM_ID,
                    senderTokenAccount,
                    receiverTokenAccount,
                    sender.publicKey,
                    [],
                    amount * Math.pow(10, await getTokenDecimals(YOUR_TOKEN_MINT_ADDRESS))
                )
            );
        } else {
            console.error("Unsupported asset type.");
            return false;
        }

        const signature = await connection.sendTransaction(transaction, [sender], {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
        });
        await connection.confirmTransaction(signature, 'confirmed');
        console.log(`Trade successful! Signature: ${signature}`);
        return true;
    } catch (error) {
        console.error("Error during performTrade:", error.message);
        return false;
    }
}

/**
 * Manage a single wallet's trading activity.
 * @param {Keypair} wallet
 * @param {Keypair[]} allWallets
 */
async function manageWallet(wallet, allWallets) {
    while (true) {
        console.log(`\n=== Starting New Trade for Wallet: ${wallet.publicKey.toBase58()} ===`);

        let tradeSuccessful = false;
        let retryCount = 0;
        const maxRetries = 5;

        // Randomly decide to send or receive
        const tradeDirection = Math.random() > 0.5 ? 'SEND' : 'RECEIVE';
        // Randomly decide the asset type
        const asset = Math.random() > 0.5 ? 'SOL' : 'TOKEN';
        // Randomly choose the counterparty wallet
        const counterparty = allWallets[Math.floor(Math.random() * allWallets.length)];

        // Determine a random trade amount between 0.01 and 0.1
        const tradeAmount = parseFloat((Math.random() * 0.09 + 0.01).toFixed(4)); // 0.01 to 0.1

        while (!tradeSuccessful && retryCount < maxRetries) {
            if (tradeDirection === 'SEND') {
                tradeSuccessful = await performTrade(wallet, counterparty, asset, tradeAmount);
            } else {
                tradeSuccessful = await performTrade(counterparty, wallet, asset, tradeAmount);
            }

            if (!tradeSuccessful) {
                retryCount++;
                console.log(`Retrying trade (${retryCount}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (!tradeSuccessful) {
            console.error(`Failed to complete trade after ${maxRetries} retries for wallet ${wallet.publicKey.toBase58()}.`);
        }

        // Random delay between 30 to 90 seconds before next trade
        const tradeDelay = Math.floor(Math.random() * 60 + 30) * 1000;
        console.log(`Waiting for ${tradeDelay / 1000} seconds before the next trade.`);
        await new Promise(resolve => setTimeout(resolve, tradeDelay));
    }
}

/**
 * Initialize and fund multiple wallets.
 * @returns {Promise<Keypair[]>}
 */
async function initializeWallets() {
    const numWallets = parseInt(process.env.NUM_WALLETS, 10);
    const fundingAmount = parseInt(process.env.FUNDING_AMOUNT, 10);

    const wallets = [];

    for (let i = 0; i < numWallets; i++) {
        const wallet = Keypair.generate();
        wallets.push(wallet);
        console.log(`Generated new wallet: ${wallet.publicKey.toBase58()}`);

        // Transfer SOL from main wallet to the new wallet
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: mainWallet.publicKey,
                toPubkey: wallet.publicKey,
                lamports: fundingAmount,
            })
        );

        const signature = await connection.sendTransaction(transaction, [mainWallet]);
        await connection.confirmTransaction(signature, 'confirmed');
        console.log(`Funded wallet ${wallet.publicKey.toBase58()} with ${fundingAmount / LAMPORTS_PER_SOL} SOL`);

        // Initialize Token Accounts
        await createAssociatedTokenAccount(wallet, YOUR_TOKEN_MINT_ADDRESS);
        console.log(`Initialized token account for wallet ${wallet.publicKey.toBase58()}`);
    }

    // Also initialize token account for main wallet
    await createAssociatedTokenAccount(mainWallet, YOUR_TOKEN_MINT_ADDRESS);
    console.log(`Initialized token account for main wallet ${mainWallet.publicKey.toBase58()}`);

    return wallets;
}

/**
 * Distribute tokens from main wallet to all wallets.
 * @param {Keypair[]} wallets
 */
async function distributeTokens(wallets) {
    const mainTokenAccount = await createAssociatedTokenAccount(mainWallet, YOUR_TOKEN_MINT_ADDRESS);
    const token = new Token(connection, YOUR_TOKEN_MINT_ADDRESS, TOKEN_PROGRAM_ID, mainWallet);
    const decimals = await getTokenDecimals(YOUR_TOKEN_MINT_ADDRESS);

    for (const wallet of wallets) {
        const recipientTokenAccount = await createAssociatedTokenAccount(wallet, YOUR_TOKEN_MINT_ADDRESS);
        const amount = Math.floor((Math.random() * 90 + 10) * Math.pow(10, decimals) / 100); // 0.1 to 0.9 tokens

        const transaction = new Transaction().add(
            Token.createTransferInstruction(
                TOKEN_PROGRAM_ID,
                mainTokenAccount,
                recipientTokenAccount,
                mainWallet.publicKey,
                [],
                amount
            )
        );

        const signature = await connection.sendTransaction(transaction, [mainWallet]);
        await connection.confirmTransaction(signature, 'confirmed');
        console.log(`Distributed ${amount / Math.pow(10, decimals)} tokens to wallet ${wallet.publicKey.toBase58()}`);
    }
}

/**
 * Main Execution Function
 */
async function main() {
    try {
        const fundingAmount = parseInt(process.env.FUNDING_AMOUNT, 10);

        console.log(`Starting trading simulation using main wallet: ${mainWallet.publicKey.toBase58()}`);
        console.log(`Funding each simulated wallet with ${fundingAmount / LAMPORTS_PER_SOL} SOL...`);

        // Initialize and Fund Wallets
        const wallets = await initializeWallets();

        // Distribute tokens to wallets
        await distributeTokens(wallets);

        // Start Managing Each Wallet
        wallets.forEach(wallet => {
            manageWallet(wallet, [mainWallet, ...wallets]).catch(error => {
                console.error(`Error managing wallet ${wallet.publicKey.toBase58()}:`, error);
            });
        });

    } catch (error) {
        console.error('Unhandled error in main execution:', error);
        process.exit(1);
    }
}

main().catch(error => {
    console.error('Error in main function:', error);
    process.exit(1);
});
