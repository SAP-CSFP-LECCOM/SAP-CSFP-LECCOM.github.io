import {
  createDefaultRoot,
  loadRoot,
  normalizeRoot,
  saveRoot,
} from './storage.js';

let serverAvailable = null;

function isJson(response) {
  return (response.headers.get('content-type') || '').includes('application/json');
}

async function fetchApi(path, options = {}) {
  const response = await fetch(path, {
    cache: 'no-store',
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers ?? {}),
    },
  });
  return response;
}

export async function loadPersistedRoot() {
  if (window.location.hostname.endsWith('.github.io')) {
    serverAvailable = false;
    return loadRoot();
  }

  try {
    const response = await fetchApi('/api/data');
    if (response.status === 204) {
      serverAvailable = true;
      return loadRoot();
    }
    if (response.ok && isJson(response)) {
      const data = await response.json();
      const normalized = normalizeRoot(data);
      serverAvailable = true;
      try {
        saveRoot(normalized);
      } catch {}
      return normalized;
    }
    serverAvailable = false;
  } catch {
    serverAvailable = false;
  }
  return loadRoot();
}

export async function savePersistedRoot(root) {
  try {
    saveRoot(root);
  } catch (error) {
    console.warn('Could not cache schedule locally:', error);
  }

  if (serverAvailable !== true) return { server: false };

  const response = await fetchApi('/api/data', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(root),
  });
  if (!response.ok) {
    throw new Error(`Local schedule server returned ${response.status}.`);
  }
  return { server: true };
}

export function isServerStorageAvailable() {
  return serverAvailable === true;
}

export function defaultRoot() {
  return createDefaultRoot();
}
