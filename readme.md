# Rainbow Boy Solana Token Volume Simulation Script

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Script Overview](#script-overview)
- [Security Considerations](#security-considerations)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Introduction

The **Solana Token Volume Simulation Script (GheyBOT1.0)** is a Node.js application designed to simulate trading activity for a specific Solana token. By orchestrating random transfers of SOL and your designated token between multiple wallets, this script generates realistic trading volume, enabling developers and project teams to test their tokenomics, liquidity pools, and other ecosystem components under simulated market conditions.

## Features

- **Multiple Wallet Simulation**: Generates and manages multiple wallets to mimic different traders.
- **Randomized Trades**: Executes SOL and token transfers at random intervals and amounts to simulate real trading behavior.
- **Flexible Configuration**: Easily adjust the number of wallets, funding amounts, trade frequencies, and more via environment variables.
- **Comprehensive Logging**: Provides detailed logs of all transactions and activities for monitoring and debugging.
- **Secure Wallet Management**: Ensures secure handling of private keys and sensitive information.

## Prerequisites

Before setting up and running the script, ensure you have the following:

- **Node.js (v14.x or later)**: [Download and install Node.js](https://nodejs.org/)
- **npm (Node Package Manager)**: Comes bundled with Node.js.
- **Solana CLI** (optional, for advanced wallet management): [Install Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- **Access to a Solana RPC Endpoint**: You can use public endpoints like [Solana Mainnet Beta](https://api.mainnet-beta.solana.com) or set up your own.

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/solana-token-volume-simulator.git
   cd solana-token-volume-simulator
   ```

2. **Install Dependencies**

   Ensure you're in the project directory and run:

   ```bash
   npm install
   ```

   This command installs all necessary packages listed in `package.json`.

## Configuration

The script relies on environment variables for configuration. Follow these steps to set up your environment:

1. **Create a `.env` File**

   In the project root directory, create a file named `.env`:

   ```bash
   touch .env
   ```

2. **Populate the `.env` File**

   Open `.env` in your preferred text editor and add the following variables:

   ```env
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   PRIVATE_KEY=[YOUR_MAIN_WALLET_PRIVATE_KEY_JSON_ARRAY]
   SOL_TOKEN_MINT_ADDRESS=So11111111111111111111111111111111111111112 # Wrapped SOL
   YOUR_TOKEN_MINT_ADDRESS=[YOUR_TOKEN_MINT_ADDRESS]
   FUNDING_AMOUNT=1000000000 # Amount in lamports (1 SOL = 1,000,000,000 lamports)
   NUM_WALLETS=5
   ```

   **Variable Descriptions:**

   - `SOLANA_RPC_URL`: The RPC endpoint URL for the Solana network. Example for mainnet: `https://api.mainnet-beta.solana.com`.
   - `PRIVATE_KEY`: Your main wallet's private key as a JSON array. **Ensure this key is kept secure and never exposed publicly.**
   - `SOL_TOKEN_MINT_ADDRESS`: The mint address for Wrapped SOL. Typically, `So11111111111111111111111111111111111111112`.
   - `YOUR_TOKEN_MINT_ADDRESS`: Replace with your specific token's mint address.
   - `FUNDING_AMOUNT`: The amount of SOL (in lamports) to fund each simulated wallet. (1 SOL = 1,000,000,000 lamports)
   - `NUM_WALLETS`: The number of wallets to simulate for generating trading volume.

   **Example `.env` File:**

   ```env
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   PRIVATE_KEY=[123,45,67,...] # Replace with your actual private key array
   SOL_TOKEN_MINT_ADDRESS=So11111111111111111111111111111111111111112
   YOUR_TOKEN_MINT_ADDRESS=YourTokenMintAddressHere
   FUNDING_AMOUNT=1000000000
   NUM_WALLETS=5
   ```

## Usage

Once configured, you can run the simulation script as follows:

1. **Start the Simulation**

   ```bash
   node simulate-volume.js
   ```

   Replace `simulate-volume.js` with the actual filename of your script if different.

2. **Monitor Output**

   The script will log actions to the console, including wallet generation, funding, token distribution, and simulated trades. Example output:

   ```
   Starting trading simulation using main wallet: YourMainWalletPublicKey
   Funding each simulated wallet with 1 SOL...
   Generated new wallet: Wallet1PublicKey
   Funded wallet Wallet1PublicKey with 1 SOL
   Initialized token account for wallet Wallet1PublicKey
   ...
   === Starting New Trade for Wallet: Wallet1PublicKey ===
   Trade successful! Signature: TransactionSignature
   Waiting for 45 seconds before the next trade.
   ```

3. **Stopping the Simulation**

   To stop the script, press `Ctrl + C` in the terminal.

## Script Overview

### 1. **Environment Setup**

The script begins by loading environment variables using the `dotenv` package. It validates the presence of all required variables to ensure smooth execution.

### 2. **Connection and Wallet Initialization**

- **Connection**: Establishes a connection to the Solana network using the provided RPC URL.
- **Main Wallet**: Loads the main wallet using the provided private key, which will fund and interact with other simulated wallets.
- **Token Mints**: Defines the mint addresses for SOL and your specific token.

### 3. **Utility Functions**

- **`getCurrentSOLBalance`**: Retrieves the SOL balance of a given wallet.
- **`getTokenBalance`**: Fetches the balance of your specific token for a wallet.
- **`getTokenDecimals`**: Obtains the number of decimals for your token to handle precise calculations.
- **`createAssociatedTokenAccount`**: Ensures each wallet has an associated token account for your specific token.

### 4. **Performing Trades**

- **`performTrade`**: Simulates a trade by transferring either SOL or your token between wallets. The function constructs and sends a transaction, handling both SOL and token transfers based on the specified asset type.

### 5. **Wallet Management**

- **`manageWallet`**: Continuously performs trades for a given wallet. It randomly decides whether to send or receive SOL/tokens, selects a counterparty wallet, determines a random trade amount, and introduces random delays between trades to mimic real-world trading activity.

### 6. **Wallet Initialization and Funding**

- **`initializeWallets`**: Generates the specified number of wallets, funds each with the designated amount of SOL from the main wallet, and initializes their associated token accounts.
- **`distributeTokens`**: Distributes a random amount of your specific token from the main wallet to each simulated wallet, enabling them to participate in token trades.

### 7. **Main Execution Flow**

The `main` function orchestrates the entire process:

1. Initializes and funds multiple wallets.
2. Distributes tokens to each wallet.
3. Starts managing each wallet's trading activity concurrently.

## Security Considerations

- **Private Key Management**: The script requires access to your main wallet's private key. **Never expose or commit your private keys**. Ensure the `.env` file is excluded from version control by adding it to `.gitignore`.

  ```gitignore
  # .gitignore
  .env
  ```

- **Secure Storage**: Store your private keys securely. Consider using environment variables or secure key management services.

- **Transaction Fees**: Each transaction incurs SOL fees. Monitor wallet balances to prevent depletion.

## Testing

Before deploying the script on the Solana mainnet, perform thorough testing on the **devnet** or **testnet**:

1. **Switch RPC URL**

   In your `.env` file, set `SOLANA_RPC_URL` to a devnet endpoint:

   ```env
   SOLANA_RPC_URL=https://api.devnet.solana.com
   ```

2. **Use Test Wallets and Tokens**

   Generate test wallets and use test tokens to avoid risking real assets.

3. **Run the Script**

   Execute the script as described in the [Usage](#usage) section and monitor behavior.

## Troubleshooting

- **Insufficient Funds**

  Ensure that the main wallet has enough SOL and tokens to fund all simulated wallets and cover transaction fees.

- **Invalid Private Key**

  Verify that the `PRIVATE_KEY` in the `.env` file is correctly formatted as a JSON array of numbers.

- **Network Issues**

  If experiencing connectivity problems, check the `SOLANA_RPC_URL` and ensure the endpoint is operational.

- **Token Decimals Mismatch**

  Ensure that the `YOUR_TOKEN_MINT_ADDRESS` corresponds to a token with the correct decimal configuration. Adjust the `getTokenBalance` calculations if necessary.

## Contributing

Contributions are welcome! If you find issues or have suggestions for improvements, feel free to open an issue or submit a pull request.

1. **Fork the Repository**

2. **Create a Feature Branch**

   ```bash
   git checkout -b feature/YourFeatureName
   ```

3. **Commit Your Changes**

   ```bash
   git commit -m "Add your message here"
   ```

4. **Push to the Branch**

   ```bash
   git push origin feature/YourFeatureName
   ```

5. **Open a Pull Request**

## License

This project is licensed under the [MIT License](LICENSE).

---

**Disclaimer**: This script is intended for simulation and testing purposes only. Use it responsibly and ensure compliance with all relevant laws and regulations. The author is not liable for any misuse or damages arising from the use of this script.
```
