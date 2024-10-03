import { ApolloProvider } from '@apollo/client';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { client } from './api/apollo.ts';
import App from './App.tsx';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ApolloProvider>,
);

// Use contextBridge
// window.ipcRenderer.on('main-process-message', (_event, message) => {
//   console.log(message)
// })
