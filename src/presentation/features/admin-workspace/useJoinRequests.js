import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { normalizeApiError } from "@/presentation/utils/normalizeApiError";

function messageForError(error, t) {
  const status = error.response?.status;

  if (status === 404) return t("adminJoinRequests.errors.notFound");
  if (status === 409) return t("adminJoinRequests.errors.conflict");

  const { type } = normalizeApiError(error);
  return t(`adminJoinRequests.errors.${type}`);
}

export default function useJoinRequests() {
  const { t } = useTranslation();
  const { admin } = useApplicationServices();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [activeRejectionId, setActiveRejectionId] = useState(null);
  const [rejectionDrafts, setRejectionDrafts] = useState({});
  const [rejectionError, setRejectionError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
          setError(messageForError(requestError, t));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [admin, t]);

  async function refresh() {
    setError("");
    try {
      await loadRequests();
    } catch (requestError) {
      clearRestrictedData(requestError);
      setError(messageForError(requestError, t));
    }
  }

  async function selectRequest(request) {
    setSelectedRequest(request);
    setActiveRejectionId(null);
    setRejectionError("");
    setError("");
    setDetailLoading(true);

    try {
      const response = await admin.getJoinRequest(request.id);
      setSelectedRequest(response.data.join_request);
    } catch (requestError) {
      clearRestrictedData(requestError);
      setError(messageForError(requestError, t));
    } finally {
      setDetailLoading(false);
    }
  }

  async function approve(request) {
    setBusyId(request.id);
    setError("");
    setNotice("");

    try {
      await admin.approveJoinRequest(request.id);
      setSelectedRequest(null);
      await loadRequests();
      setNotice(t("adminJoinRequests.approved"));
    } catch (requestError) {
      clearRestrictedData(requestError);
      setError(messageForError(requestError, t));
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
    setError("");
    setNotice("");
    setRejectionError("");

    try {
      await admin.rejectJoinRequest(request.id, reason);
      setSelectedRequest(null);
      setActiveRejectionId(null);
      setRejectionDrafts((current) => ({ ...current, [request.id]: "" }));
      await loadRequests();
      setNotice(t("adminJoinRequests.rejected"));
    } catch (requestError) {
      clearRestrictedData(requestError);
      setError(messageForError(requestError, t));
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
    error,
    notice,
    refresh,
    selectRequest,
    approve,
    reject,
    setActiveRejectionId,
    changeRejectionDraft,
  };
}
