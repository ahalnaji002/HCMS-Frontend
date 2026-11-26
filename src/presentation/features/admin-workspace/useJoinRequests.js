import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { normalizeApiError } from "@/presentation/utils/normalizeApiError";
import { useToast } from "@/presentation/components/ui";

function errorKey(error) {
  const status = error.response?.status;

  if (status === 404) return "adminJoinRequests.errors.notFound";
  if (status === 409) return "adminJoinRequests.errors.conflict";

  const { type } = normalizeApiError(error);
  return `adminJoinRequests.errors.${type}`;
}

export default function useJoinRequests() {
  const { t } = useTranslation();
  const { admin } = useApplicationServices();
  // Action results go to the shared toast; a failed list load is shown in place.
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [activeRejectionId, setActiveRejectionId] = useState(null);
  const [rejectionDrafts, setRejectionDrafts] = useState({});
  const [rejectionError, setRejectionError] = useState("");
  const [loadError, setLoadError] = useState("");

  const loadRequests = useCallback(async () => {
    const response = await admin.listJoinRequests();
    setRequests(response.data.join_requests);
  }, [admin]);

  function clearRestrictedData(requestError) {
    const status = requestError.response?.status;
    if (status === 403 || status === 404) {
      setRequests([]);
      setSelectedRequest(null);
      setActiveRejectionId(null);
    }
  }

  useEffect(() => {
    let active = true;

    admin.listJoinRequests()
      .then((response) => {
        if (active) setRequests(response.data.join_requests);
      })
      .catch((requestError) => {
        if (active) {
          clearRestrictedData(requestError);
          setLoadError(errorKey(requestError));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [admin]);

  async function refresh() {
    setLoadError("");
    try {
      await loadRequests();
    } catch (requestError) {
      clearRestrictedData(requestError);
      setLoadError(errorKey(requestError));
    }
  }

  async function selectRequest(request) {
    setSelectedRequest(request);
    setActiveRejectionId(null);
    setRejectionError("");
    setDetailLoading(true);

    try {
      const response = await admin.getJoinRequest(request.id);
      setSelectedRequest(response.data.join_request);
    } catch (requestError) {
      clearRestrictedData(requestError);
      toast.error({ key: errorKey(requestError) });
    } finally {
      setDetailLoading(false);
    }
  }

  async function approve(request) {
    setBusyId(request.id);

    try {
      await admin.approveJoinRequest(request.id);
      setSelectedRequest(null);
      await loadRequests();
      toast.success({ key: "adminJoinRequests.approved" });
    } catch (requestError) {
      clearRestrictedData(requestError);
      toast.error({ key: errorKey(requestError) });
    } finally {
      setBusyId(null);
    }
  }

  async function reject(request) {
    const reason = rejectionDrafts[request.id]?.trim() || "";

    if (!reason) {
      setRejectionError(t("adminJoinRequests.rejectionRequired"));
      return;
    }

    if (reason.length > 500) {
      setRejectionError(t("adminJoinRequests.rejectionTooLong"));
      return;
    }

    setBusyId(request.id);
    setRejectionError("");

    try {
      await admin.rejectJoinRequest(request.id, reason);
      setSelectedRequest(null);
      setActiveRejectionId(null);
      setRejectionDrafts((current) => ({ ...current, [request.id]: "" }));
      await loadRequests();
      toast.success({ key: "adminJoinRequests.rejected" });
    } catch (requestError) {
      clearRestrictedData(requestError);
      toast.error({ key: errorKey(requestError) });
    } finally {
      setBusyId(null);
    }
  }

  function changeRejectionDraft(id, value) {
    setRejectionDrafts((current) => ({ ...current, [id]: value }));
    if (rejectionError) setRejectionError("");
  }

  return {
    requests,
    selectedRequest,
    loading,
    detailLoading,
    busyId,
    activeRejectionId,
    rejectionDrafts,
    rejectionError,
    loadError,
    refresh,
    selectRequest,
    approve,
    reject,
    setActiveRejectionId,
    changeRejectionDraft,
  };
}
