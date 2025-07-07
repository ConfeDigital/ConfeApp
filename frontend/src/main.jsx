import React from "react";
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store';
import App from './App.jsx';
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { msalConfig } from "./auth-config.js";

import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL before rendering
const initializeMsal = async () => {
  try {
    await msalInstance.initialize();

    // Set active account if available
    if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
      msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
    }

    // Listen for sign-in events
    msalInstance.addEventCallback((event) => {
      if (event.eventType === EventType.LOGIN_SUCCESS && event.payload?.account) {
        msalInstance.setActiveAccount(event.payload.account);
      }
    });

    // Render the app after initialization
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <Provider store={store}>
        <App instance={msalInstance} />
      </Provider>
    );

  } catch (error) {
    console.error("MSAL Initialization Error:", error);
  }
};

// Start the initialization
initializeMsal();
