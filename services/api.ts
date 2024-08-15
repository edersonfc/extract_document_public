import axios from "axios";

const apiConfig = {
  projectId: process.env.REACT_APP_PROJECT_ID,
  publishedName: process.env.REACT_APP_PUBLISHED_NAME,
  predictionKey: process.env.REACT_APP_PREDICTION_KEY || ''
}

const api = axios.create({
  baseURL: `${process.env.REACT_APP_URL_SERVIDOR_API}`,
});

export { api, apiConfig };