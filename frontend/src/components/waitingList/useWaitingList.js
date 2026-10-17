import { useCallback, useEffect, useState } from "react";
import api from "../../api/api";

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

export default function useWaitingList() {
  const [waitingList, setWaitingList] = useState([]);
  const [waitingListCount, setWaitingListCount] = useState(0);

  const [waitingListFilter, setWaitingListFilter] = useState({
    status: "active", // active = waiting + notified
    patient: "",
    therapist_id: "all",
    preferred_date: "",
    preferred_time_period: "all",
  });

  const loadWaitingList = useCallback(
    async (overrideFilter = waitingListFilter) => {
      try {
        const params = new URLSearchParams();

        if (overrideFilter.status && overrideFilter.status !== "all") {
          params.append("status", overrideFilter.status);
        }

        if (overrideFilter.patient?.trim()) {
          params.append("patient", overrideFilter.patient.trim());
        }

        if (
          overrideFilter.therapist_id &&
          overrideFilter.therapist_id !== "all"
        ) {
          params.append("therapist_id", overrideFilter.therapist_id);
        }

        if (overrideFilter.preferred_date) {
          params.append("preferred_date", overrideFilter.preferred_date);
        }

        if (
          overrideFilter.preferred_time_period &&
          overrideFilter.preferred_time_period !== "all"
        ) {
          params.append(
            "preferred_time_period",
            overrideFilter.preferred_time_period
          );
        }

        const query = params.toString();
        const res = await api.get(
          `callcenter/waiting-list/${query ? `?${query}` : ""}`
        );

        setWaitingList(res.data.waiting_list || []);
        setWaitingListCount(res.data.count || 0);
      } catch (err) {
        console.error("Failed to load waiting list", err);
        setWaitingList([]);
        setWaitingListCount(0);
      }
    },
    [waitingListFilter]
  );

  const handleApplyWaitingListFilters = async () => {
    await loadWaitingList(waitingListFilter);
  };

  const resetWaitingListFilters = async () => {
    const resetFilter = {
      status: "active",
      patient: "",
      therapist_id: "all",
      preferred_date: "",
      preferred_time_period: "all",
    };

    setWaitingListFilter(resetFilter);
    await loadWaitingList(resetFilter);
  };

  const showWaitingListHistory = async () => {
    const historyFilter = {
      ...waitingListFilter,
      status: "all",
    };

    setWaitingListFilter(historyFilter);
    await loadWaitingList(historyFilter);
  };

  const showActiveWaitingList = async () => {
    const activeFilter = {
      ...waitingListFilter,
      status: "active",
    };

    setWaitingListFilter(activeFilter);
    await loadWaitingList(activeFilter);
  };

  const addToWaitingList = async ({
    patient_id,
    preferred_therapist_id,
    preferred_date,
    preferred_time,
    preferred_time_period,
    notes,
  }) => {
    const res = await api.post("callcenter/waiting-list/", {
      patient_id,
      preferred_therapist_id,
      preferred_date,
      preferred_time,
      preferred_time_period,
      notes,
    });

    await loadWaitingList();
    return res.data;
  };

  const deleteWaitingListEntry = async (entryId) => {
    await api.delete(`callcenter/waiting-list/${entryId}/`);
    await loadWaitingList();
  };

  useEffect(() => {
    loadWaitingList();
  }, [loadWaitingList]);

  return {
    waitingList,
    waitingListCount,

    waitingListFilter,
    setWaitingListFilter,

    loadWaitingList,
    handleApplyWaitingListFilters,
    resetWaitingListFilters,
    showWaitingListHistory,
    showActiveWaitingList,

    addToWaitingList,
    deleteWaitingListEntry,
  };
}