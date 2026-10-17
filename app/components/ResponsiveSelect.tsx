"use client";
import { Children, isValidElement, type ReactNode, type SelectHTMLAttributes } from "react";
import CustomSelect from "./CustomSelect";

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & {
  onChange?: (event: { target: { value: string } }) => void;
};
function optionText(node: ReactNode): string {
  return Children.toArray(node).map(child => isValidElement<{ children?: ReactNode }>(child) ? optionText(child.props.children) : String(child ?? "")).join("");
}
export default function ResponsiveSelect({ children, onChange, className = "", ...props }: Props) {
  const options: { value: string; label: string }[] = [];
  Children.forEach(children, child => {
    if (isValidElement<{ value?: string | number; children?: ReactNode }>(child) && child.type === "option") {
      options.push({ value: String(child.props.value ?? optionText(child.props.children)), label: optionText(child.props.children) });
    }
  });
  return <>
    <span data-native-select-replacement="true" className={`hidden md:inline-flex min-w-0 ${className.includes("w-full") ? "w-full" : ""}`}>
      <CustomSelect value={String(props.value ?? "")} options={options} label={props["aria-label"] || (options[0]?.label.includes("카테고리") ? "공지 카테고리" : options[0]?.label.endsWith("년") ? "연도 선택" : "월 선택")} disabled={props.disabled} onChange={value => onChange?.({ target: { value } })} matchTriggerWidth />
    </span>
    <select {...props} className={`${className} md:hidden`} onChange={onChange}>{children}</select>
  </>;
}
