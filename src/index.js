import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { DAppProvider } from '@usedapp/core';
import { HashRouter } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Configs } from './configs';

ReactDOM.render(
  <React.StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <HashRouter>
        <DAppProvider
          config={{
            readOnlyChainId: Configs.NETWORK_CONFIG.chainId,
            readOnlyUrls: { [Configs.NETWORK_CONFIG.chainId]: Configs.NETWORK_CONFIG.rpcUrls },
            pollingInterval: 3000,
          }}
        >
          <App />
        </DAppProvider>
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>,
  document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
