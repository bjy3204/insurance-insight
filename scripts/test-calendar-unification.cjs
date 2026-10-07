const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
const code =
  ts.transpileModule(
    fs.readFileSync("app/components/calendar/Calendar.tsx", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText + "\nexports.testStore=useCalendarData;";
function harness(identity) {
  const slots = [],
    effects = [],
    history = [],
    local = new Map();
  let index = 0,
    localReads = 0,
    localWrites = 0,
    failRead = false,
    failWrite = false;
  const db = {
    calendar_events: [
      {
        id: "old",
        user_id: "approved-user",
        title: "기존 일정",
        date: "2026-11-01",
        content: "보존",
        time: null,
        place: null,
        memo: null,
        icon: "📅",
        color: "blue",
      },
      {
        id: "other",
        user_id: "other-user",
        title: "다른 회원",
        date: "2026-11-02",
      },
    ],
    calendar_checklists: [
      {
        id: "check-old",
        user_id: "approved-user",
        text: "기존 체크",
        completed: false,
      },
    ],
  };
  const react = {
    useState(initial) {
      const i = index++;
      if (!(i in slots))
        slots[i] = typeof initial === "function" ? initial() : initial;
      return [
        slots[i],
        (value) => {
          slots[i] = typeof value === "function" ? value(slots[i]) : value;
        },
      ];
    },
    useRef(value) {
      const i = index++;
      if (!(i in slots)) slots[i] = { current: value };
      return slots[i];
    },
    useCallback(fn) {
      index++;
      return fn;
    },
    useEffect(fn) {
      const i = index++;
      if (!(i in slots)) {
        slots[i] = true;
        effects.push(fn);
      }
    },
  };
  const chain = {
    on() {
      return this;
    },
    subscribe() {
      return this;
    },
  };
  const supabase = {
    channel: () => chain,
    removeChannel: async () => {},
    from(table) {
      let action = "read",
        fields,
        filters = [];
      const q = {
        select() {
          return q;
        },
        order() {
          return q;
        },
        limit() {
          return q;
        },
        eq(key, value) {
          filters.push([key, value]);
          return q;
        },
        insert(value) {
          action = "insert";
          fields = value;
          return q;
        },
        update(value) {
          action = "update";
          fields = value;
          return q;
        },
        delete() {
          action = "delete";
          return q;
        },
        then(resolve, reject) {
          history.push({ table, action, filters: [...filters] });
          if (
            (action === "read" && failRead) ||
            (action !== "read" && failWrite)
          )
            return Promise.resolve({
              error: Error("network"),
              data: null,
            }).then(resolve, reject);
          const match = (row) =>
            filters.every(([key, value]) => row[key] === value);
          let data = db[table].filter(match);
          if (action === "insert") {
            data = [{ ...fields, id: "new-" + history.length }];
            db[table].push(...data);
          }
          if (action === "update") {
            data.forEach((row) => Object.assign(row, fields));
          }
          if (action === "delete") {
            db[table] = db[table].filter((row) => !match(row));
          }
          return Promise.resolve({ data, error: null }).then(resolve, reject);
        },
      };
      return q;
    },
  };
  const localStorage = {
    getItem(key) {
      localReads++;
      return local.get(key) || null;
    },
    setItem(key, value) {
      localWrites++;
      local.set(key, value);
    },
  };
  const storage = {
    readLocalEvents: () =>
      JSON.parse(
        localStorage.getItem("insurance-calendar-local-events-v1") || "[]",
      ),
    saveLocalEvents: (rows) =>
      localStorage.setItem(
        "insurance-calendar-local-events-v1",
        JSON.stringify(rows),
      ),
    calendarUpdated: () => {},
  };
  const module = { exports: {} };
  const context = {
    exports: module.exports,
    require: (name) =>
      name === "react"
        ? react
        : name === "react/jsx-runtime"
          ? { jsx: () => {}, jsxs: () => {} }
          : name === "@/lib/supabase"
            ? { supabase }
            : name.endsWith("calendar-storage")
              ? storage
              : name.endsWith("reminder-utils")
                ? {
                    LOCAL_EVENTS_KEY: "insurance-calendar-local-events-v1",
                    CALENDAR_UPDATED: "insurance-calendar-updated",
                    koreaDate: () => "2026-10-06",
                  }
                : {},
    window: { addEventListener() {}, removeEventListener() {} },
    localStorage,
    crypto: { randomUUID: () => "local-new" },
    Date,
    Promise,
    console,
  };
  vm.runInNewContext(code, context);
  const render = () => {
    index = 0;
    return module.exports.testStore(identity);
  };
  render();
  effects.forEach((fn) => fn());
  return {
    render,
    db,
    local,
    history,
    setFailRead: (v) => (failRead = v),
    setFailWrite: (v) => (failWrite = v),
    counts: () => ({ localReads, localWrites }),
  };
}
const flush = async () => {
  for (let i = 0; i < 8; i++)
    await new Promise((resolve) => setImmediate(resolve));
};
(async () => {
  const cloud = harness({
    userId: "approved-user",
    approved: true,
    loading: false,
  });
  await flush();
  let store = cloud.render();
  assert.equal(store.ready, true);
  assert.equal(store.events[0].id, "old");
  assert.equal(store.checklists[0].id, "check-old");
  assert.equal(cloud.counts().localReads, 0);
  const draft = {
    title: "수정 일정",
    date: "2026-11-01",
    content: "유지",
    time: "",
    place: "",
    memo: "",
    icon: "📅",
    color: "blue",
  };
  await store.saveEvent(draft, "old");
  assert.equal(
    cloud.db.calendar_events.find((row) => row.id === "old").title,
    "수정 일정",
  );
  assert.equal(
    cloud.db.calendar_events.find((row) => row.id === "other").title,
    "다른 회원",
  );
  store = cloud.render();
  cloud.setFailWrite(true);
  await assert.rejects(store.saveEvent(draft));
  assert.equal(cloud.counts().localWrites, 0);
  assert.equal(cloud.counts().localReads, 0);
  cloud.setFailWrite(false);
  await store.changeChecklist("check-old", { completed: true });
  assert.equal(cloud.db.calendar_checklists[0].completed, true);
  for (const query of cloud.history.filter((item) =>
    ["update", "delete"].includes(item.action),
  ))
    assert(
      query.filters.some(
        ([key, value]) => key === "user_id" && value === "approved-user",
      ),
    );
  const broken = harness({
    userId: "approved-user",
    approved: true,
    loading: false,
  });
  broken.setFailRead(true);
  await flush();
  const brokenStore = broken.render();
  assert.equal(brokenStore.ready, false);
  await assert.rejects(brokenStore.saveEvent(draft));
  assert.equal(broken.counts().localWrites, 0);
  const guest = harness({ userId: null, approved: false, loading: false });
  await flush();
  let guestStore = guest.render();
  await guestStore.saveEvent(draft);
  guestStore = guest.render();
  assert.equal(guestStore.events[0].title, draft.title);
  assert.equal(guest.history.length, 0);
  await guestStore.changeChecklist(null, { text: "로컬 체크" });
  assert(guest.local.has("insurance-calendar-local-checklists-v1"));
  assert.equal(guest.history.length, 0);
  console.log(
    "Calendar checks passed: existing IDs, owner filters, cloud-only approved writes, no local fallback, blocked failed loads, local events and checklists.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
