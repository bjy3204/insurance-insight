"use client";

import HospitalInfoPopup from "@/app/claim-docs/hospital-info";
import type { HomeController } from "../hooks/useHomeController";
export default function HospitalDialog({ controller }: { controller: HomeController }) {
const { open, hospitalOpen, setHospitalOpen } = controller;
return (<><HospitalInfoPopup
  open={hospitalOpen}
  onClose={() => setHospitalOpen(false)}
/></>);
}
