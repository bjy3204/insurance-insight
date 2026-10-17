export type HospitalRecord = Record<"type" | "originalType" | "name" | "sido" | "sigungu" | "dong" | "address" | "tel" | "doctorCount" | "departments" | "traffic" | "homepage", string>;

let pending: Promise<HospitalRecord[]> | undefined;
export function loadHospitalData(): Promise<HospitalRecord[]> {
  if (!pending) {
    pending = fetch("/data/hospitals.json")
      .then(async response => {
        if (!response.ok) throw new Error("병원정보를 불러오지 못했습니다");
        const rows: unknown = await response.json();
        if (!Array.isArray(rows)) throw new Error("병원정보 형식을 확인해 주세요");
        return rows as HospitalRecord[];
      })
      .catch(error => { pending = undefined; throw error; });
  }
  return pending;
}
