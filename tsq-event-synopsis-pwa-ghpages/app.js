
  const { useEffect, useMemo, useState } = React;

  function App() {
    const [managerName, setManagerName] = useState("");
    const [reportDate, setReportDate] = useState(() => todayISO());
    const [dailyReport, setDailyReport] = useState("");
    const [events, setEvents] = useState([]);

    const [showEventForm, setShowEventForm] = useState(false);
    const [beo, setBeo] = useState("");
    const [attendees, setAttendees] = useState("");
    const [extensions, setExtensions] = useState("");
    const [description, setDescription] = useState("");

    const storageKey = useMemo(() => `tsq-event-synopsis:${reportDate}`, [reportDate]);

    useEffect(() => {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setManagerName(parsed.managerName ?? "");
          setDailyReport(parsed.dailyReport ?? "");
          setEvents(Array.isArray(parsed.events) ? parsed.events : []);
        } catch {}
      } else {
        const globalName = localStorage.getItem("tsq-event-synopsis:managerName");
        if (globalName) setManagerName(globalName);
        setDailyReport("");
        setEvents([]);
      }
    }, [storageKey]);

    useEffect(() => {
      const payload = JSON.stringify({ managerName, dailyReport, events });
      localStorage.setItem(storageKey, payload);
      if (managerName) localStorage.setItem("tsq-event-synopsis:managerName", managerName);
    }, [storageKey, managerName, dailyReport, events]);

    function addEventToLog() {
      const trimmedBEO = beo.trim();
      if (!trimmedBEO) {
        alert("Please enter a BEO number.");
        return;
      }
      const evt = {
        id: cryptoRandomId(),
        timestamp: new Date().toISOString(),
        beo: trimmedBEO,
        attendees: toInt(attendees),
        extensions: toCurrencyNumber(extensions),
        description: description.trim(),
      };
      setEvents((prev) => [evt, ...prev]);
      setBeo("");
      setAttendees("");
      setExtensions("");
      setDescription("");
      setShowEventForm(false);
    }

    function deleteEvent(id) {
      if (!confirm("Remove this event from the log?")) return;
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }

    function clearDay() {
      if (!confirm("Clear the entire daily log for this date? This cannot be undone.")) return;
      setDailyReport("");
      setEvents([]);
    }

    function buildEmailBody() {
      const header = `Times Square Event Synopsis\nDate: ${prettyDate(reportDate)}\nManager: ${managerName || "(not set)"}\n\nDaily Report:\n${dailyReport || "(none)"}\n\n`;
      const lines = [];
      if (events.length === 0) {
        lines.push("No event synopses logged.");
      } else {
        lines.push(`Event Synopses (${events.length})`);
        events.forEach((e, idx) => {
          lines.push(
            [
              `#${events.length - idx}. BEO: ${e.beo}`,
              `Time Logged: ${prettyTime(e.timestamp)}`,
              `Attendees: ${fmtInt(e.attendees)}`,
              `Extensions: ${fmtCurrency(e.extensions)}`,
              `Description / Issues:`,
              indentMultiline(e.description || "(none)", 2),
              ""
            ].join("\n")
          );
        });
      }
      return header + lines.join("\n");
    }

    function createMailtoHref() {
      const subject = `Times Square Event Synopsis — ${prettyDate(reportDate)} — ${managerName || "Manager"}`;
      const body = buildEmailBody();
      return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    function exportEmail() {
      const subject = `Times Square Event Synopsis — ${prettyDate(reportDate)} — ${managerName || "Manager"}`;
      const body = buildEmailBody();
      if (navigator.share && typeof navigator.share === "function") {
        navigator.share({ title: subject, text: body }).catch(() => {
          window.location.href = createMailtoHref();
        });
      } else {
        window.location.href = createMailtoHref();
      }
    }

    function downloadTxt() {
      const blob = new Blob([buildEmailBody()], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TSQ_Event_Synopsis_${reportDate}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      React.createElement("div", { className: "min-h-screen bg-neutral-50 text-neutral-900 flex flex-col" },
        React.createElement("header", { className: "sticky top-0 z-10 backdrop-blur bg-white/80 border-b border-neutral-200" },
          React.createElement("div", { className: "max-w-3xl mx-auto px-4 py-4 flex items-center justify-between" },
            React.createElement("h1", { className: "text-xl sm:text-2xl font-bold" }, "Times Square Event Synopsis"),
            React.createElement("div", { className: "flex gap-2" },
              React.createElement("button", {
                onClick: exportEmail,
                className: "px-3 py-2 text-sm rounded-2xl shadow hover:shadow-md border border-neutral-300",
                "aria-label": "Export via Email"
              }, "Export via Email"),
              React.createElement("button", {
                onClick: downloadTxt,
                className: "px-3 py-2 text-sm rounded-2xl shadow hover:shadow-md border border-neutral-300",
                "aria-label": "Download TXT"
              }, "Download TXT")
            )
          )
        ),
        React.createElement("main", { className: "max-w-3xl mx-auto w-full px-4 pb-24" },
          React.createElement("section", { className: "mt-4 grid gap-4" },
            React.createElement(Card, { title: "Manager Details" },
              React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4" },
                React.createElement(LabeledInput, {
                  label: "Manager Name", placeholder: "Your name",
                  value: managerName, onChange: (e) => setManagerName(e.target.value), autoComplete: "name"
                }),
                React.createElement(LabeledInput, {
                  label: "Date", type: "date",
                  value: reportDate, onChange: (e) => setReportDate(e.target.value)
                })
              ),
              React.createElement(LabeledTextArea, {
                className: "mt-4",
                label: "Daily Report",
                placeholder: "High-level notes for the day (wins, challenges, staffing, VIPs, incidents, etc.)",
                rows: 4, value: dailyReport, onChange: (e) => setDailyReport(e.target.value)
              })
            )
          ),
          React.createElement("section", { className: "mt-6 grid gap-4" },
            React.createElement(Card, { title: "Event Synopses" },
              !showEventForm && React.createElement("button", {
                onClick: () => setShowEventForm(true),
                className: "px-4 py-3 rounded-2xl bg-neutral-900 text-white font-medium shadow hover:opacity-90"
              }, "+ Add an Event Synopsis"),
              showEventForm && React.createElement("div", { className: "mt-4 border border-neutral-200 rounded-2xl p-4 bg-white" },
                React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4" },
                  React.createElement(LabeledInput, {
                    label: "BEO Number", placeholder: "e.g., 707-241031-A",
                    value: beo, onChange: (e) => setBeo(e.target.value)
                  }),
                  React.createElement(LabeledInput, {
                    label: "# of Attendees", type: "number", min: 0, inputMode: "numeric",
                    placeholder: "e.g., 85", value: attendees, onChange: (e) => setAttendees(e.target.value)
                  }),
                  React.createElement(LabeledInput, {
                    label: "Extensions ($)", type: "number", step: "0.01", min: 0, inputMode: "decimal",
                    placeholder: "e.g., 1240.50", value: extensions, onChange: (e) => setExtensions(e.target.value)
                  }),
                  React.createElement("div", { className: "sm:col-span-2" },
                    React.createElement(LabeledTextArea, {
                      label: "Description / Issues",
                      placeholder: "Describe the event flow, wins, and any issues encountered (service, facility, guest requests, comps/voids, arcade, etc.).",
                      rows: 5, value: description, onChange: (e) => setDescription(e.target.value)
                    })
                  )
                ),
                React.createElement("div", { className: "mt-4 flex flex-wrap gap-2" },
                  React.createElement("button", {
                    onClick: addEventToLog,
                    className: "px-4 py-2 rounded-2xl bg-neutral-900 text-white font-medium shadow hover:opacity-90"
                  }, "Complete & Add to Log"),
                  React.createElement("button", {
                    onClick: () => setShowEventForm(false),
                    className: "px-4 py-2 rounded-2xl border border-neutral-300 font-medium hover:bg-neutral-50"
                  }, "Cancel")
                )
              ),
              React.createElement("div", { className: "mt-6" },
                events.length === 0 ? (
                  React.createElement("p", { className: "text-neutral-600" }, "No events logged yet for this date.")
                ) : (
                  React.createElement("ul", { className: "space-y-3" },
                    events.map((e, idx) => (
                      React.createElement("li", { key: e.id, className: "border border-neutral-200 rounded-2xl p-4 bg-white" },
                        React.createElement("div", { className: "flex items-start justify-between gap-3" },
                          React.createElement("div", null,
                            React.createElement("div", { className: "text-sm text-neutral-500" }, `#${events.length - idx} • ${prettyTime(e.timestamp)}`),
                            React.createElement("div", { className: "mt-1 font-semibold" }, `BEO: ${e.beo}`)
                          ),
                          React.createElement("button", {
                            onClick: () => deleteEvent(e.id),
                            className: "text-xs px-2 py-1 rounded-xl border border-neutral-300 hover:bg-neutral-50",
                            "aria-label": "Delete entry"
                          }, "Delete")
                        ),
                        React.createElement("div", { className: "mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm" },
                          React.createElement("div", { className: "rounded-xl bg-neutral-50 p-3 border border-neutral-100" },
                            React.createElement("div", { className: "text-neutral-500" }, "Attendees"),
                            React.createElement("div", { className: "font-medium" }, fmtInt(e.attendees))
                          ),
                          React.createElement("div", { className: "rounded-xl bg-neutral-50 p-3 border border-neutral-100" },
                            React.createElement("div", { className: "text-neutral-500" }, "Extensions"),
                            React.createElement("div", { className: "font-medium" }, fmtCurrency(e.extensions))
                          ),
                          React.createElement("div", { className: "rounded-xl bg-neutral-50 p-3 border border-neutral-100 sm:col-span-1" },
                            React.createElement("div", { className: "text-neutral-500" }, "Logged"),
                            React.createElement("div", { className: "font-medium" }, new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
                          )
                        ),
                        React.createElement("div", { className: "mt-3 text-sm leading-relaxed whitespace-pre-wrap" }, e.description || React.createElement("em", { className: "text-neutral-500" }, "(No description)"))
                      )
                    ))
                  )
                )
              ),
              events.length > 0 && React.createElement("div", { className: "mt-4 flex flex-wrap gap-2" },
                React.createElement("button", {
                  onClick: exportEmail,
                  className: "px-4 py-2 rounded-2xl bg-neutral-900 text-white font-medium shadow hover:opacity-90"
                }, "Export via Email"),
                React.createElement("button", {
                  onClick: clearDay,
                  className: "px-4 py-2 rounded-2xl border border-neutral-300 font-medium hover:bg-neutral-50"
                }, "Clear Today")
              )
            )
          ),
          React.createElement("div", { className: "h-16" })
        )
      )
    );
  }

  function Card({ title, children }) {
    return React.createElement("div", { className: "rounded-3xl bg-white border border-neutral-200 shadow-sm p-5" },
      title && React.createElement("h2", { className: "text-lg font-semibold mb-3" }, title),
      children
    );
  }

  function LabeledInput(props) {
    const { label, className = "", ...rest } = props;
    return React.createElement("label", { className: `grid gap-1 ${className}` },
      React.createElement("span", { className: "text-sm text-neutral-600" }, label),
      React.createElement("input", { ...rest, className: "w-full rounded-xl border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300" })
    );
  }

  function LabeledTextArea(props) {
    const { label, className = "", ...rest } = props;
    return React.createElement("label", { className: `grid gap-1 ${className}` },
      React.createElement("span", { className: "text-sm text-neutral-600" }, label),
      React.createElement("textarea", { ...rest, className: "w-full rounded-xl border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300" })
    );
  }

  function todayISO() {
    const d = new Date();
    const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return tz.toISOString().slice(0, 10);
  }

  function prettyDate(isoDate) {
    try {
      const [y, m, d] = isoDate.split("-").map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1);
      return dt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return isoDate;
    }
  }

  function prettyTime(iso) {
    try {
      return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return iso;
    }
  }

  function toInt(v) {
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n) : null;
  }

  function toCurrencyNumber(v) {
    if (v == null || v === "") return null;
    const n = Number(String(v).replace(/[^0-9.\\-]/g, ""));
    return Number.isFinite(n) ? Number(n.toFixed(2)) : null;
  }

  function fmtInt(n) {
    if (n == null) return "—";
    return new Intl.NumberFormat().format(n);
  }

  function fmtCurrency(n) {
    if (n == null) return "—";
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
  }

  function indentMultiline(text, spaces = 2) {
    const pad = " ".repeat(spaces);
    return text.split("\\n").map((line) => pad + line).join("\\n");
  }

  function cryptoRandomId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
