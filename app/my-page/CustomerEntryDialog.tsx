"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Car, FilePlus2, HeartPulse, Landmark, Plus, UserRound, UserRoundPlus, X } from "lucide-react";
import { lockPageScroll } from "@/app/features/home/components/dashboard/DashboardDialog";
import CustomerIdentityFields from "./CustomerIdentityFields";
import CustomerFormSelect from "./CustomerFormSelect";
import MemoSelect from "@/app/components/memos/MemoSelect";
import { customerGender, customerVehicles, emptyCustomerVehicle, shortCustomerBirth, formatCustomerBirth, formatCustomerPhone, formatCustomerDate, type CustomerIdentity } from "./customer-form-fields";
import { medicalMaturity } from "./customer-lookup-model";
import useCustomerFormOptions, { type CustomerOptionKind } from "./useCustomerFormOptions";
import styles from "./CustomerEntryDialog.module.css";

export type CustomerEntryKind = "customer" | "contract";
export type CustomerEntryValues = Record<string, string>;

export default function CustomerEntryDialog({ kind, values, onChange, onClose, customers = [], onSubmit, saving = false, error = "", editing = false }: { customers?: readonly CustomerIdentity[]; kind: CustomerEntryKind; values: CustomerEntryValues; onChange: (field: string, value: string) => void; onClose: () => void; onSubmit?: () => void; saving?: boolean; error?: string; editing?: boolean }) {
  const savedOptions = useCustomerFormOptions(kind === "customer");
  const medicalEnd = medicalMaturity(values.medicalJoined || "");
  const vehicles = customerVehicles(values);
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const fieldPrefix = useId();
  const title = kind === "customer" ? editing ? "고객정보 수정" : "고객추가" : editing ? "계약 수정" : "계약추가";
  const TitleIcon = kind === "customer" ? UserRoundPlus : FilePlus2;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const unlock = lockPageScroll();
    panel.current?.querySelector<HTMLElement>('input:not([type="checkbox"]), textarea, [data-first-field] button')?.focus({ preventScroll: true });
    const keyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[role="listbox"]') || target.closest('[role="dialog"]') !== panel.current) return;
      if (event.key === "Escape") { event.stopPropagation(); onClose(); }
      if (event.key !== "Tab") return;
      const elements = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || []);
      if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements.at(-1)?.focus(); }
      if (!event.shiftKey && document.activeElement === elements.at(-1)) { event.preventDefault(); elements[0]?.focus(); }
    };
    document.addEventListener("keydown", keyboard);
    return () => { document.removeEventListener("keydown", keyboard); unlock(); previous?.focus({ preventScroll: true }); };
  }, [onClose]);

  const field = (name: string, label: string, options: { wide?: boolean; dateInput?: boolean; birth?: boolean; phone?: boolean; type?: string; placeholder?: string; suffix?: string; value?: string; change?: (value: string) => void } = {}) => {
    const id = `${fieldPrefix}-${name}`;
    const fullBirth = kind === "customer" && name === "birth";
    const currentValue = options.value ?? (options.birth && !fullBirth ? shortCustomerBirth(values[name] || "") : values[name] || "");
    const change = (value: string) => options.change ? options.change(value) : onChange(name, value);
    const inherited = kind === "contract" && values.sameInsured !== "false" && (name === "insured" || name === "insuredBirth");
    const placeholder = inherited ? values[name === "insured" ? "owner" : "ownerBirth"] || options.placeholder || (options.birth ? "960901" : undefined) : options.placeholder || (options.birth ? fullBirth ? "960901-2" : "960901" : undefined);
    return <div className={`${styles.field} ${options.wide ? styles.wide : ""}`} key={name}>
      <label htmlFor={id} className={styles.label}>{label}{options.birth && fullBirth && customerGender(values[name] || "") && <span aria-hidden="true" data-gender={customerGender(values[name] || "")} className={styles.gender}>{customerGender(values[name])}</span>}</label>
      {options.suffix && <div data-popup-field-wrapper="true" className={styles.suffixField}><input id={id} name={name} aria-label={label} type="text" inputMode="numeric" autoComplete="off" value={values[name] || ""} onChange={event => onChange(name, event.target.value.replace(/\D/g, ""))} /><span>{options.suffix}</span></div>}
      {!options.suffix && <input id={id} name={name} type={options.type === "number" ? "text" : options.type || "text"} value={inherited ? "" : currentValue} placeholder={placeholder} autoComplete="off"
        inputMode={options.birth || options.phone || options.dateInput || options.type === "number" ? "numeric" : undefined} maxLength={options.birth ? fullBirth ? 8 : 6 : options.dateInput ? 10 : undefined}
        onChange={event => change(options.dateInput ? formatCustomerDate(event.target.value) : options.birth ? fullBirth ? formatCustomerBirth(event.target.value) : shortCustomerBirth(event.target.value) : options.phone ? formatCustomerPhone(event.target.value) : options.type === "number" ? event.target.value.replace(/\D/g, "") : event.target.value)} />}
    </div>;
  };
  const phone = () => <div className={`${styles.field} ${styles.phoneField}`}>
    <label htmlFor={`${fieldPrefix}-phone`} className={styles.label}>전화번호</label>
    <div className={styles.phoneRow}>
      <div className={styles.carrier}><MemoSelect label="통신사" placeholder="통신사" value={values.carrier || ""} onChange={value => onChange("carrier", value)} options={["SKT", "KT", "LG U+", "SKT 알뜰", "KT 알뜰", "LG U+ 알뜰"].map(value => ({ value, label: value }))} /></div>
      <input id={`${fieldPrefix}-phone`} name="phone" aria-label="전화번호" type="tel" inputMode="numeric" autoComplete="off" placeholder="010-1234-5678" value={values.phone || ""} onChange={event => onChange("phone", formatCustomerPhone(event.target.value))} />
    </div>
  </div>;
  const select = (name: CustomerOptionKind | "medicalInsurer", label: string) => {
    const optionKind = name === "medicalInsurer" ? "insurer" : name;
    return <div key={name} className={styles.field}><span className={styles.label}>{label}</span><CustomerFormSelect label={label} value={values[name] || ""} options={savedOptions.options[optionKind]} disabled={!savedOptions.ready || savedOptions.saving} onAdd={value => savedOptions.update(optionKind, value, "add")} onRemove={value => savedOptions.update(optionKind, value, "remove")} onChange={value => onChange(name, value)} /></div>;
  };
  const memo = () => <div className={`${styles.field} ${styles.wide}`}><label htmlFor={`${fieldPrefix}-memo`} className={styles.label}>메모</label><textarea id={`${fieldPrefix}-memo`} name="memo" rows={3} value={values.memo || ""} onChange={event => onChange("memo", event.target.value)} /></div>;
  const section = (label: string, icon: ReactNode, children: ReactNode, contract = false, action?: ReactNode) => <section className={styles.section}><div className={styles.sectionHeading}><h3>{icon}{label}</h3>{action}</div><div className={`${styles.grid} ${contract ? styles.contractGrid : ""}`}>{children}</div></section>;

  return createPortal(<div className={`${styles.overlay} fixed inset-0 bg-black/40`} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={panel} className={styles.dialog} data-popup-frame="true" data-account-inputs="true" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header data-popup-header="true" className={styles.header}>
        <h2 id={titleId} data-popup-title="true" className={styles.title}><TitleIcon size={25} />{title}</h2>
        <button type="button" data-popup-close="true" aria-label={`${title} 닫기`} onClick={onClose}><X size={20} /></button>
      </header>
      <div className={`${styles.body} overflow-y-auto`} inert={saving}>
        {kind === "customer" && savedOptions.error && <div role="alert" className="mb-3 flex items-center gap-2 text-sm text-red-500">{savedOptions.error}{!savedOptions.ready && <button type="button" onClick={savedOptions.reload} className="underline">다시 시도</button>}</div>}
        {kind === "customer" ? <>
          {section("고객정보", <UserRound />, <>
            {select("category", "유입경로")}{field("name", "이름")}{field("birth", "생년월일", { birth: true })}
            {phone()}{field("job", "직업")}{field("email", "이메일", { type: "email" })}
            {field("address", "주소", { wide: true })}{memo()}
          </>)}
          {section("실손의료비", <HeartPulse />, <>
            {field("medicalInsurer", "보험사")}{field("medicalJoined", "가입일", { dateInput: true })}
            <div className={`${styles.field} ${styles.fixedSelect}`}><span className={styles.label}>세대</span><MemoSelect label="실손 세대" placeholder="선택" value={values.medicalGeneration || ""} onChange={value => onChange("medicalGeneration", value)} options={[1, 2, 3, 4, 5].map(generation => ({ value: String(generation), label: `${generation}세대` }))} /></div>
            <div className={styles.field}><label htmlFor={`${fieldPrefix}-medicalMaturity`} className={styles.label}>만기일</label><input id={`${fieldPrefix}-medicalMaturity`} name="medicalMaturity" type="text" autoComplete="off" value={values.medicalMaturity ?? medicalEnd?.text ?? ""} onChange={event => onChange("medicalMaturity", event.target.value)} /></div>
          </>, true)}
          {section("보험금 청구", <Landmark />, <>
            {field("accountOwner", "예금주")}{field("accountBirth", "생년월일", { birth: true })}{field("bank", "은행")}
            {field("accountNumber", "계좌번호", { wide: true })}
          </>)}
          {section("차량정보", <Car />, <>
            <div className={`${styles.wide} ${styles.vehicleGroups}`}>{vehicles.map((vehicle, index) => <div key={index} className={styles.vehicleGroup}>
              {vehicles.length > 1 && <h4>차량{index + 1}</h4>}<div className={styles.grid}>
                {([['vehicleNumber','차량번호'],['vehicleType','차종'],['renewal','갱신일'],['insurer','보험사'],['driver','운전자지정'],['discount','할인']] as const).map(([key, label]) => field(`vehicle-${index}-${key}`, label, { value: vehicle[key], dateInput: key === "renewal", change: value => onChange("vehicles", JSON.stringify(vehicles.map((item, position) => position === index ? { ...item, [key]: value } : item))) }))}
              </div>
            </div>)}</div>
          </>, false, <button type="button" aria-label="차량 추가" title="차량 추가" className={styles.addVehicle} disabled={vehicles.length >= 100} onClick={() => onChange("vehicles", JSON.stringify([...vehicles, emptyCustomerVehicle()]))}><Plus size={20} /></button>)}
        </> : <>
          {section("계약자·피보험자 정보", <UserRound />, <>
            <CustomerIdentityFields customers={customers} name={values.owner || ""} birth={values.ownerBirth || ""} onNameChange={value => onChange("owner", value)} onBirthChange={value => onChange("ownerBirth", value)} />
            {field("insured", "피보험자")}{field("insuredBirth", "생년월일(피)", { birth: true })}
          </>, true, <label className={styles.sameInsured}><input type="checkbox" checked={values.sameInsured !== "false"} onChange={event => onChange("sameInsured", String(event.target.checked))} />계피동일</label>)}
          {section("계약정보", <FilePlus2 />, <>
            {field("date", "계약일", { dateInput: true })}
            <div className={`${styles.field} ${styles.fixedSelect}`}><span className={styles.label}>만기</span><MemoSelect label="만기" placeholder="선택" value={values.maturity || ""} onChange={value => onChange("maturity", value)} options={["80세 만기", "90세 만기", "100세 만기", "갱신"].map(value => ({ value, label: value }))} /></div>
            {field("insurer", "보험사")}{field("premium", "보험료", { type: "number", suffix: "원" })}
            {field("product", "상품명", { wide: true })}
          </>, true)}
          {section("보장정보", <FilePlus2 />, <>
            {field("immunity", "면책기간", { type: "number", suffix: "개월" })}{field("reduction", "감액기간", { type: "number", suffix: "개월" })}
            {memo()}
          </>, true)}
        </>}
      </div>
      <footer className={styles.footer}>
        {error && <p role="alert" className={styles.saveError}>{error}</p>}
        <label className={styles.consentConfirmation}>
          <input type="checkbox" disabled={saving} checked={values.consentConfirmed === "true"} onChange={event => onChange("consentConfirmed", String(event.target.checked))} />
          <span>고객에게 개인정보 수집·이용 내용을 안내하고, 필요한 동의를 받았음을 확인합니다.</span>
        </label>
        <button data-popup-action="true" data-action-height="48" type="button" className={styles.cancel} disabled={saving} onClick={onClose}>취소</button>
        <button data-popup-action="true" data-action-height="48" type="button" className={styles.submit} disabled={!onSubmit || saving || values.consentConfirmed !== "true"} onClick={onSubmit}>{saving ? "저장 중" : editing ? "저장" : "추가"}</button>
      </footer>
    </div>
  </div>, document.body);
}
