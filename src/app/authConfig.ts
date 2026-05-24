import { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "558495ff-c275-444a-ab94-2c08bbdb3576",
    authority: "https://login.microsoftonline.com/common", 
    redirectUri: "https://zany-zebra-qgxvxwvrp5gc456-3000.app.github.dev",
  },
  cache: {
    cacheLocation: "sessionStorage",
  }
};

export const loginRequest = {
  scopes: ["Calendars.Read"] 
};