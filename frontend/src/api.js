
const API_URL = "http://127.0.0.1:5000/api";

async function request(path, options = {}) {
  const response = await fetch(API_URL + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const getJobs = () => request("/jobs");

export const addJob = (data) =>
  request("/jobs", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const getApplications = () =>
  request("/applications");

export const applyJob = (data) =>
  request("/applications", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const getDashboard = () =>
  request("/dashboard");
