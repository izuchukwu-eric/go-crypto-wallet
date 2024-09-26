# Turborepo starter

This is an official starter Turborepo.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

### Project Structure

- `apps/backend`: Contains the backend code written in Go.
- `apps/frontend`: Contains the frontend code written in Next.js.
- `packages/ui`: Contains shared UI components.
- `packages/eslint-config`: Contains shared ESLint configurations.
- `packages/typescript-config`: Contains shared TypeScript configurations.

### API Endpoints

#### Backend (Go)

- `GET /`: Health check endpoint.
- `POST /wallet`: Creates a new wallet.
- `GET /wallets`: Lists all wallets.
- `POST /sign`: Signs a transaction.

#### Running the backend (Go)

- `npm run docker:build`: Build the backend.
- `npm run docker:run`: Run the backend.

#### Frontend (Next.js)

- `POST /api/fetchBalance`: Fetches the balance of a given wallet address.
- `POST /api/signTransaction`: Signs a transaction.
- `POST /api/fetchTransactions`: Fetches the last 3 transactions of a given wallet address.

#### Running the Frontend (Next.js)

- `docker run -p 5432:5432 -e POSTGRES_PASSWORD=your-postgres-password -d postgres`: startup postgres.
- `cd apps/frontend`: cd into the frontend folder.
- `npm install `: Install node_modules.
- `npm run dev `: Run the frontend

### Function Descriptions

#### Backend Functions

- **main**: Initializes the server, sets up routes, and starts the server.
- **healthCheck**: Health check handler that returns a simple message.
- **createWallet**: Creates a new wallet and returns the wallet details.
- **listWallets**: Lists all wallets.
- **signTransaction**: Signs a transaction using AWS KMS and returns the signed transaction.

#### Frontend Functions

- **generateWallet**: Generates a new wallet by making a request to the backend.
- **createNewWallet**: Creates a new wallet and updates the user's wallet information in the database.
- **broadcastTransaction**: Broadcasts a signed transaction to the Ethereum network.
- **fetchBalance**: Fetches the balance of a given wallet address.
- **signTransaction**: Signs a transaction by making a request to the backend.
- **fetchTransactions**: Fetches the last 3 transactions of a given wallet address.
