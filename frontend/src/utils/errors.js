// Turn any axios rejection into something worth showing a person.
//
// Handlers used to read `err.response.data.message` (or `.errors.username`)
// directly. That works for an HTTP error response and throws a TypeError for
// everything else — server unreachable, CORS refusal, DNS failure, timeout,
// offline — because those rejections have no `response` at all. The throw
// happened inside the catch block, so the user got no toast and no clue.
export const getApiErrorMessage = (err, fallback = 'Something went wrong.') => {
  // No response: the request never completed.
  if (!err?.response) {
    if (err?.code === 'ECONNABORTED')
      return 'The server took too long to respond.';
    return 'Could not reach the server. Check your connection and try again.';
  }

  const { status, data } = err.response;

  // The API's field-error shape: { errors: { username, password, ... } }
  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors).find(
      (v) => typeof v === 'string' && v.trim()
    );
    if (first) return first;
  }

  if (typeof data?.message === 'string' && data.message) return data.message;
  if (typeof data === 'string' && data) return data;

  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return 'You do not have access to this.';
  if (status === 404) return 'Not found.';
  if (status === 429) return 'Too many attempts. Please wait and try again.';
  if (status >= 500) return 'The server had a problem. Please try again.';

  return fallback;
};

export default getApiErrorMessage;
