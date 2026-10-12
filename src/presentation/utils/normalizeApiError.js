export function normalizeApiError(error) {
  if (!error.response) {
    return {
      type: "network",
      status: null,
      message: "Unable to connect to the server.",
      fieldErrors: {},
    };
  }

  const { status, data } = error.response;

  if (status === 400) {
    return {
      type: "validation",
      status,
      message: data?.message || "Validation failed.",
      fieldErrors: data?.errors || {},
    };
  }

  if (status === 401) {
    return {
      type: "unauthorized",
      status,
      message: "Authentication failed.",
      fieldErrors: {},
    };
  }

  if (status === 403) {
    return {
      type: "forbidden",
      status,
      application: data?.data?.application || null,
      message: "You are not allowed to perform this action.",
      fieldErrors: {},
    };
  }

  if (status === 409) {
    return {
      type: "conflict",
      status,
      message: data?.message || "This information already exists.",
      fieldErrors: {},
    };
  }

  if (status >= 500) {
    return {
      type: "server",
      status,
      message: "A server error occurred. Please try again later.",
      fieldErrors: {},
    };
  }

  return {
    type: "unknown",
    status,
    message: "Something went wrong. Please try again.",
    fieldErrors: {},
  };
}
