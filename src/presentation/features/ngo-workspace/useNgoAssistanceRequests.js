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
  const [result, setResult] = useState({
    key: null,
    requests: [],
    request: null,
    resources: [],
    resourceErrorKind: "",
    loading: true,
    errorKind: "",
  });
  const [reloadKey, setReloadKey] = useState(0);
  const queryKey = `${requestId ?? "list"}:${reloadKey}`;

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        if (!requestId) {
          const response = await ngoWorkspace.listAssistanceRequests();
          if (active) setResult({
            key: queryKey,
            requests: response?.data?.assistance_requests ?? [],
            request: null,
            resources: [],
            resourceErrorKind: "",
            loading: false,
            errorKind: "",
          });
          return;
        }

        const response = await ngoWorkspace.getAssistanceRequest(requestId);
        const request = response?.data?.assistance_request ?? null;
        let resources = [];
        let resourceErrorKind = "";

        if (request?.status === "APPROVED") {
          try {
            const resourceResponse = await ngoWorkspace.listAssistanceRequestResources(requestId);
            resources = resourceResponse?.data?.resource_allocations ?? [];
          } catch {
            resourceErrorKind = "resourceCheckFailed";
          }
        }

        if (active) setResult({
          key: queryKey,
          requests: [],
          request,
          resources,
          resourceErrorKind,
          loading: false,
          errorKind: "",
        });
      } catch (error) {
        if (active) setResult({
          key: queryKey,
          requests: [],
          request: null,
          resources: [],
          resourceErrorKind: "",
          loading: false,
          errorKind: getErrorKind(error),
        });
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [ngoWorkspace, queryKey, requestId]);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);
  const matchesCurrentQuery = result.key === queryKey;

  return {
    requests: matchesCurrentQuery ? result.requests : [],
    request: matchesCurrentQuery ? result.request : null,
    resources: matchesCurrentQuery ? result.resources : [],
    resourceErrorKind: matchesCurrentQuery ? result.resourceErrorKind : "",
    loading: !matchesCurrentQuery || result.loading,
    errorKind: matchesCurrentQuery ? result.errorKind : "",
    retry,
  };
}
