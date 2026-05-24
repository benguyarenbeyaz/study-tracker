import { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "558495ff-c275-444a-ab94-2c08bbdb3576",
    authority: "https://login.microsoftonline.com/common", 
    redirectUri: typeof window !== "undefined" ? window.location.origin : "/",
  },
  cache: {
    cacheLocation: "sessionStorage",
  }
};

export const loginRequest = {
  scopes: ["Calendars.Read"] 
};