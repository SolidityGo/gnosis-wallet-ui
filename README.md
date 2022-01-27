# Gnosis Wallet UI

## Quick Start

Ensure `node>=v12.20.0` is installed.

```sh
yarn install
yarn start
```

The website is on http://localhost:3000/

## Usage

1. Input the address of your Gnosis wallet and the BEP20 token; 
2. Then the website will show the name of the token and the balance;
3. Input the `Receiver` and `Amount` that you want to transfer, click `Sign Transaction`, connect to metamask and sign the message;
4. A blob will show under `My Signature`;
5. Please repeat step 1 to step 4 for each owner of the Gnosis wallet until collect enoguh signatures;
6. Input the collected signatures into `Execute Multi-Signed Tx`;
7. Click `Exec Transaction`, and sign.

### Configuration

- Config entry
  - [useSdk](src/hooks/useSdk.ts)
