const DEFAULT_API_URL = "https://sgm.mabcontrol.ar";

export const getServerUrl = () => {
  return localStorage.getItem("server_url") || DEFAULT_API_URL;
};

export const setServerUrl = (url) => {
  localStorage.setItem("server_url", url);
};

export const getApiUrl = () => {
  const url = getServerUrl();
  return `${url}/api`;
};
