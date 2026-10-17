"use client";

type PickerResult = { action: string; docs?: { id: string }[] };
type View = { setFileIds(ids: string): View; setMimeTypes(types: string): View };
type Picker = { setVisible(visible: boolean): void; dispose(): void };
type Builder = {
  setDeveloperKey(key: string): Builder;
  setAppId(id: string): Builder;
  setOAuthToken(token: string): Builder;
  setOrigin(origin: string): Builder;
  setLocale(locale: string): Builder;
  setTitle(title: string): Builder;
  setSize(width: number, height: number): Builder;
  enableFeature(feature: string): Builder;
  addView(view: View): Builder;
  setCallback(callback: (data: PickerResult) => void): Builder;
  build(): Picker;
};
type GoogleWindow = Window & {
  gapi?: { load(name: string, options: { callback(): void; onerror(): void; timeout: number; ontimeout(): void }): void };
  google?: { picker?: { DocsView: new () => View; PickerBuilder: new () => Builder; Feature: { NAV_HIDDEN: string }; Action: { PICKED: string; CANCEL: string } } };
};
let loading: Promise<void> | undefined;
function loadPicker() {
  if (loading) return loading;
  const googleWindow = window as GoogleWindow;
  loading = new Promise<void>((resolve, reject) => {
    const fail = () => reject(new Error("구글 선택창을 불러오지 못했습니다 다시 시도해 주세요"));
    const load = () => googleWindow.gapi?.load("picker", { callback: resolve, onerror: fail, timeout: 15000, ontimeout: fail });
    if (googleWindow.gapi) { load(); return; }
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    const timeout = window.setTimeout(fail, 20000);
    script.onload = () => { window.clearTimeout(timeout); load(); };
    script.onerror = () => { window.clearTimeout(timeout); script.remove(); fail(); };
    document.head.appendChild(script);
  }).catch(error => { loading = undefined; throw error; });
  return loading;
}

export async function chooseCustomerTemplate(config: { developerKey: string; appId: string; accessToken: string; templateId: string; title?: string }): Promise<string | null> {
  await loadPicker();
  const api = (window as GoogleWindow).google?.picker;
  if (!api) throw new Error("구글 선택창 초기화에 실패했습니다");
  return new Promise((resolve, reject) => {
    let picker: Picker;
    const close = () => { picker.setVisible(false); picker.dispose(); };
    const view = new api.DocsView().setFileIds(config.templateId).setMimeTypes("application/vnd.google-apps.spreadsheet");
    picker = new api.PickerBuilder()
      .setDeveloperKey(config.developerKey).setAppId(config.appId).setOAuthToken(config.accessToken)
      .setOrigin(window.location.origin).setLocale("ko").setTitle(config.title || "고객관리 원본 시트를 선택해 주세요")
      .setSize(Math.min(720, window.innerWidth - 16), Math.min(560, window.innerHeight - 32))
      .enableFeature(api.Feature.NAV_HIDDEN).addView(view)
      .setCallback(data => {
        if (data.action === api.Action.CANCEL) { close(); resolve(null); }
        if (data.action === api.Action.PICKED) {
          const id = data.docs?.[0]?.id;
          close();
          if (id !== config.templateId) reject(new Error("표시된 시트를 선택해 주세요"));
          else resolve(id);
        }
      }).build();
    picker.setVisible(true);
  });
}
