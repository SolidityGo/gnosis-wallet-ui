# Gnosis Wallet UI

## Quick Start

```sh
yarn install
yarn start
```

### Configuration

- Config entry
  - [useSdk](src/hooks/useSdk.ts)

### Generate Contract Bindings

If a new abi was generated, we can put them in [src/sdk/abi](src/sdk/abi) folder, and then
run `yarn run generate-typed-contracts` to generate the contract TS bindings, then we can find bindings
in [src/sdk/contracts](src/sdk/contracts)
