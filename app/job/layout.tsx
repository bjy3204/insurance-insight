import JobVideo from "./JobVideo";
export default function JobLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<JobVideo /></>;
}
