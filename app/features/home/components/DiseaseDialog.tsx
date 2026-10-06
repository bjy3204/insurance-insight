"use client";

import DiseaseCodePopup from "@/app/claim-docs/disease-code-popup";
import type { HomeController } from "../hooks/useHomeController";
export default function DiseaseDialog({ controller }: { controller: HomeController }) {
const { open, diseaseOpen, setDiseaseOpen } = controller;
return (<><DiseaseCodePopup
  open={diseaseOpen}
  onClose={() => setDiseaseOpen(false)}
/></>);
}
