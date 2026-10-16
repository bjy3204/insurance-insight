"use client";

import PolicyInsertsEditor from "./PolicyInsertsEditor";
import { useEffect } from "react";
import { useSharedHomeController } from "@/app/features/home/HomeControllerProvider";
export default function PolicyInsertsPage() {
  const { authLoading, authUser, authStatus, setCmPinState, setCmPinOpen } = useSharedHomeController();
  useEffect(() => {
    if (!authLoading && (!authUser || authStatus !== "approved")) {
      setCmPinState("not-approved");
      setCmPinOpen(true);
    }
  }, [authLoading, authUser, authStatus, setCmPinState, setCmPinOpen]);
  return <PolicyInsertsEditor />;
}
