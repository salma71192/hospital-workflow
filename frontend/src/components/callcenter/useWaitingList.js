import { useEffect, useState } from "react";
import api from "../../api/api";

export default function useWaitingList() {
  const [waitingList, setWaitingList] = useState([]);
  const [waitingListCount, setWaitingListCount] = useState(0);

  const loadWaitingList = async () => {
    try {
      const res = await api.get("callcenter/waiting-list/");
      setWaitingList(res.data.waiting_list || []);
      setWaitingListCount(res.data.count || 0);
    } catch (err) {
      console.error("Failed to load waiting list", err);
      setWaitingList([]);
      setWaitingListCount(0);
    }
  };

  const addToWaitingList = async ({
    patient_id,
    preferred_therapist_id,
    preferred_date,
    preferred_time,
    notes,
  }) => {
    const res = await api.post("callcenter/waiting-list/", {
      patient_id,
      preferred_therapist_id,
      preferred_date,
      preferred_time,
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
  }, []);

  return {
    waitingList,
    waitingListCount,
    loadWaitingList,
    addToWaitingList,
    deleteWaitingListEntry,
  };
}