"use client";

import { useEffect, useState } from "react";

export default function useSalesBookPageSize() {
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setPageSize(query.matches ? 10 : 5);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return pageSize;
}
