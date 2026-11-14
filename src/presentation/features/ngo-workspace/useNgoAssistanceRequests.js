import { useCallback, useEffect, useState } from "react";
import { useApplicationServices } from "@/app/useApplicationServices";

function getErrorKind(error) {
  const status = error.response?.status;
  if (status === 403) return "forbidden";
  if (status === 404) return "notFound";
  return "loadFailed";
}

export default function useNgoAssistanceRequests(requestId) {
  const { ngoWorkspace } = useApplicationServices();
  const [result, setResult] = useState({ key: null, requests: [], request: null, loading: true, errorKind: "" });
  const [reloadKey, setReloadKey] = useState(0);
  const queryKey = `${requestId ?? "list"}:${reloadKey}`;

  useEffect(() => {
    let active = true;

    const load = requestId
      ? ngoWorkspace.getAssistanceRequest(requestId).then((response) => {
          if (active) setResult({ key: queryKey, requests: [], request: response?.data?.assistance_request ?? null, loading: false, errorKind: "" });
        })
      : ngoWorkspace.listAssistanceRequests().then((response) => {
          if (active) setResult({ key: queryKey, requests: response?.data?.assistance_requests ?? [], request: null, loading: false, errorKind: "" });
        });

    load
      .catch((error) => {
        if (active) setResult({ key: queryKey, requests: [], request: null, loading: false, errorKind: getErrorKind(error) });
      });

    return () => {
      active = false;
    };
  }, [ngoWorkspace, queryKey, requestId]);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);
  const matchesCurrentQuery = result.key === queryKey;

  return {
    requests: matchesCurrentQuery ? result.requests : [],
    request: matchesCurrentQuery ? result.request : null,
    loading: !matchesCurrentQuery || result.loading,
    errorKind: matchesCurrentQuery ? result.errorKind : "",
    retry,
  };
}
