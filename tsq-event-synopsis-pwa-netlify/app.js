
const { useEffect, useMemo, useState, useCallback, memo } = React;

// ============================================================
// Error Boundary Component
// ============================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return React.createElement("div", { className: "min-h-screen bg-neutral-50 flex items-center justify-center p-4" },
        React.createElement("div", { className: "max-w-md text-center" },
          React.createElement("h1", { className: "text-2xl font-bold text-red-600 mb-4" }, "Something went wrong"),
          React.createElement("p", { className: "text-neutral-600 mb-4" }, "The app encountered an error. Your data is safely stored in your browser."),
          React.createElement("button", {
            onClick: () => window.location.reload(),
            className: "px-4 py-2 rounded-2xl bg-neutral-900 text-white font-medium shadow hover:opacity-90"
          }, "Reload App")
        )
      );
    }
    return this.props.children;
  }
}

// ============================================================
// Confirmation Modal Component
// ============================================================
function ConfirmModal({ isOpen, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, danger = false }) {
  if (!isOpen) return null;

  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50",
    onClick: onCancel
  },
    React.createElement("div", {
      className: "bg-white rounded-2xl shadow-xl max-w-sm w-full p-6",
      onClick: (e) => e.stopPropagation()
    },
      React.createElement("h3", { className: "text-lg font-semibold mb-2" }, title),
      React.createElement("p", { className: "text-neutral-600 mb-6" }, message),
      React.createElement("div", { className: "flex gap-3 justify-end" },
        React.createElement("button", {
          onClick: onCancel,
          className: "px-4 py-2 rounded-xl border border-neutral-300 font-medium hover:bg-neutral-50"
        }, cancelText),
        React.createElement("button", {
          onClick: onConfirm,
          className: `px-4 py-2 rounded-xl font-medium text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-neutral-900 hover:opacity-90"}`
        }, confirmText)
      )
    )
  );
}

// ============================================================
// Summary Statistics Component
// ============================================================
const SummaryStats = memo(function SummaryStats({ events }) {
  const stats = useMemo(() => {
    const totalEvents = events.length;
    const totalAttendees = events.reduce((sum, e) => sum + (e.attendees || 0), 0);
    const totalExtensions = events.reduce((sum, e) => sum + (e.extensions || 0), 0);
    return { totalEvents, totalAttendees, totalExtensions };
  }, [events]);

  if (events.length === 0) return null;

  return React.createElement("div", { className: "grid grid-cols-3 gap-3 mb-4" },
    React.createElement("div", { className: "rounded-xl bg-blue-50 p-3 border border-blue-100 text-center" },
      React.createElement("div", { className: "text-blue-600 text-xs font-medium" }, "Events"),
      React.createElement("div", { className: "font-bold text-lg" }, fmtInt(stats.totalEvents))
    ),
    React.createElement("div", { className: "rounded-xl bg-green-50 p-3 border border-green-100 text-center" },
      React.createElement("div", { className: "text-green-600 text-xs font-medium" }, "Total Attendees"),
      React.createElement("div", { className: "font-bold text-lg" }, fmtInt(stats.totalAttendees))
    ),
    React.createElement("div", { className: "rounded-xl bg-purple-50 p-3 border border-purple-100 text-center" },
      React.createElement("div", { className: "text-purple-600 text-xs font-medium" }, "Total Extensions"),
      React.createElement("div", { className: "font-bold text-lg" }, fmtCurrency(stats.totalExtensions))
    )
  );
});

// ============================================================
// Event Item Component (Memoized)
// ============================================================
const EventItem = memo(function EventItem({ event, index, totalEvents, onEdit, onDelete }) {
  return React.createElement("li", { className: "border border-neutral-200 rounded-2xl p-4 bg-white" },
    React.createElement("div", { className: "flex items-start justify-between gap-3" },
      React.createElement("div", null,
        React.createElement("div", { className: "text-sm text-neutral-500" }, `#${totalEvents - index} • ${prettyTime(event.timestamp)}`),
        React.createElement("div", { className: "mt-1 font-semibold" }, `BEO: ${event.beo}`)
      ),
      React.createElement("div", { className: "flex gap-2" },
        React.createElement("button", {
          onClick: () => onEdit(event),
          className: "text-xs px-2 py-1 rounded-xl border border-blue-300 text-blue-600 hover:bg-blue-50",
          "aria-label": "Edit entry"
        }, "Edit"),
        React.createElement("button", {
          onClick: () => onDelete(event.id),
          className: "text-xs px-2 py-1 rounded-xl border border-neutral-300 hover:bg-neutral-50",
          "aria-label": "Delete entry"
        }, "Delete")
      )
    ),
    React.createElement("div", { className: "mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm" },
      React.createElement("div", { className: "rounded-xl bg-neutral-50 p-3 border border-neutral-100" },
        React.createElement("div", { className: "text-neutral-500" }, "Attendees"),
        React.createElement("div", { className: "font-medium" }, fmtInt(event.attendees))
      ),
      React.createElement("div", { className: "rounded-xl bg-neutral-50 p-3 border border-neutral-100" },
        React.createElement("div", { className: "text-neutral-500" }, "Extensions"),
        React.createElement("div", { className: "font-medium" }, fmtCurrency(event.extensions))
      ),
      React.createElement("div", { className: "rounded-xl bg-neutral-50 p-3 border border-neutral-100 sm:col-span-1" },
        React.createElement("div", { className: "text-neutral-500" }, "Logged"),
        React.createElement("div", { className: "font-medium" }, new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
      )
    ),
    React.createElement("div", { className: "mt-3 text-sm leading-relaxed whitespace-pre-wrap" }, event.description || React.createElement("em", { className: "text-neutral-500" }, "(No description)"))
  );
});

// ============================================================
// Main App Component
// ============================================================
function App() {
  const [managerName, setManagerName] = useState("");
  const [reportDate, setReportDate] = useState(() => todayISO());
  const [dailyReport, setDailyReport] = useState("");
  const [events, setEvents] = useState([]);

  // Form state
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [beo, setBeo] = useState("");
  const [attendees, setAttendees] = useState("");
  const [extensions, setExtensions] = useState("");
  const [description, setDescription] = useState("");
  const [formErrors, setFormErrors] = useState({});

  // Search/filter state
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null, danger: false });

  const storageKey = useMemo(() => `tsq-event-synopsis:${reportDate}`, [reportDate]);
  const draftKey = useMemo(() => `tsq-event-synopsis:draft:${reportDate}`, [reportDate]);

  // Load data from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setManagerName(parsed.managerName ?? "");
        setDailyReport(parsed.dailyReport ?? "");
        setEvents(Array.isArray(parsed.events) ? parsed.events : []);
      } catch {
        console.error("Failed to parse stored data");
      }
    } else {
      const globalName = localStorage.getItem("tsq-event-synopsis:managerName");
      if (globalName) setManagerName(globalName);
      setDailyReport("");
      setEvents([]);
    }

    // Load draft if exists
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        if (parsedDraft.beo || parsedDraft.attendees || parsedDraft.extensions || parsedDraft.description) {
          setBeo(parsedDraft.beo || "");
          setAttendees(parsedDraft.attendees || "");
          setExtensions(parsedDraft.extensions || "");
          setDescription(parsedDraft.description || "");
          setShowEventForm(true);
        }
      } catch {}
    }
  }, [storageKey, draftKey]);

  // Save data to localStorage
  useEffect(() => {
    const payload = JSON.stringify({ managerName, dailyReport, events });
    localStorage.setItem(storageKey, payload);
    if (managerName) localStorage.setItem("tsq-event-synopsis:managerName", managerName);
  }, [storageKey, managerName, dailyReport, events]);

  // Save form draft to sessionStorage
  useEffect(() => {
    if (showEventForm && !editingEventId) {
      const draft = { beo, attendees, extensions, description };
      if (beo || attendees || extensions || description) {
        localStorage.setItem(draftKey, JSON.stringify(draft));
      }
    }
  }, [draftKey, showEventForm, editingEventId, beo, attendees, extensions, description]);

  // Clear draft when form is closed
  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
  }, [draftKey]);

  // Filtered events based on search
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const query = searchQuery.toLowerCase();
    return events.filter(e =>
      e.beo.toLowerCase().includes(query) ||
      (e.description && e.description.toLowerCase().includes(query))
    );
  }, [events, searchQuery]);

  function validateForm() {
    const errors = {};
    const trimmedBEO = beo.trim();

    if (!trimmedBEO) {
      errors.beo = "BEO number is required";
    }

    if (attendees && isNaN(Number(attendees))) {
      errors.attendees = "Must be a valid number";
    }

    if (extensions && isNaN(Number(extensions.replace(/[^0-9.-]/g, "")))) {
      errors.extensions = "Must be a valid amount";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function resetForm() {
    setBeo("");
    setAttendees("");
    setExtensions("");
    setDescription("");
    setFormErrors({});
    setEditingEventId(null);
    setShowEventForm(false);
    clearDraft();
  }

  function addEventToLog() {
    if (!validateForm()) return;

    const trimmedBEO = beo.trim();
    const evt = {
      id: editingEventId || cryptoRandomId(),
      timestamp: editingEventId ? events.find(e => e.id === editingEventId)?.timestamp : new Date().toISOString(),
      beo: trimmedBEO,
      attendees: toInt(attendees),
      extensions: toCurrencyNumber(extensions),
      description: description.trim(),
    };

    if (editingEventId) {
      // Update existing event
      setEvents((prev) => prev.map(e => e.id === editingEventId ? { ...evt, updatedAt: new Date().toISOString() } : e));
    } else {
      // Add new event
      setEvents((prev) => [evt, ...prev]);
    }

    resetForm();
  }

  function editEvent(event) {
    setEditingEventId(event.id);
    setBeo(event.beo);
    setAttendees(event.attendees != null ? String(event.attendees) : "");
    setExtensions(event.extensions != null ? String(event.extensions) : "");
    setDescription(event.description || "");
    setFormErrors({});
    setShowEventForm(true);
  }

  function deleteEvent(id) {
    setModal({
      isOpen: true,
      title: "Delete Event",
      message: "Remove this event from the log? This action cannot be undone.",
      danger: true,
      onConfirm: () => {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setModal({ isOpen: false });
      }
    });
  }

  function clearDay() {
    setModal({
      isOpen: true,
      title: "Clear Daily Log",
      message: "Clear the entire daily log for this date? This cannot be undone.",
      danger: true,
      onConfirm: () => {
        setDailyReport("");
        setEvents([]);
        setModal({ isOpen: false });
      }
    });
  }

  // Data Export/Import Functions
  function exportBackup() {
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("tsq-event-synopsis:") && !key.includes(":draft:")) {
        allKeys.push(key);
      }
    }

    const backup = {};
    allKeys.forEach(key => {
      try {
        backup[key] = JSON.parse(localStorage.getItem(key));
      } catch {
        backup[key] = localStorage.getItem(key);
      }
    });

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TSQ_Backup_${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importBackup(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target.result);
        let imported = 0;

        Object.entries(backup).forEach(([key, value]) => {
          if (key.startsWith("tsq-event-synopsis:")) {
            localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
            imported++;
          }
        });

        alert(`Successfully imported ${imported} entries. Reloading...`);
        window.location.reload();
      } catch (err) {
        alert("Failed to import backup. Please check the file format.");
        console.error("Import error:", err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function buildEmailBody() {
    const header = `Times Square Event Synopsis\nDate: ${prettyDate(reportDate)}\nManager: ${managerName || "(not set)"}\n\nDaily Report:\n${dailyReport || "(none)"}\n\n`;
    const lines = [];

    // Summary stats
    if (events.length > 0) {
      const totalAttendees = events.reduce((sum, e) => sum + (e.attendees || 0), 0);
      const totalExtensions = events.reduce((sum, e) => sum + (e.extensions || 0), 0);
      lines.push(`SUMMARY: ${events.length} events | ${fmtInt(totalAttendees)} total attendees | ${fmtCurrency(totalExtensions)} total extensions\n`);
    }

    if (events.length === 0) {
      lines.push("No event synopses logged.");
    } else {
      lines.push(`Event Synopses (${events.length})`);
      lines.push("─".repeat(40));
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
      // Confirmation Modal
      React.createElement(ConfirmModal, {
        isOpen: modal.isOpen,
        title: modal.title,
        message: modal.message,
        danger: modal.danger,
        onConfirm: modal.onConfirm,
        onCancel: () => setModal({ isOpen: false })
      }),

      // Header
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

      // Main Content
      React.createElement("main", { className: "max-w-3xl mx-auto w-full px-4 pb-24" },
        // Manager Details Section
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

        // Event Synopses Section
        React.createElement("section", { className: "mt-6 grid gap-4" },
          React.createElement(Card, { title: "Event Synopses" },
            // Summary Statistics
            React.createElement(SummaryStats, { events: events }),

            // Search/Filter
            events.length > 0 && React.createElement("div", { className: "mb-4" },
              React.createElement(LabeledInput, {
                label: "Search Events",
                placeholder: "Search by BEO number or description...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value)
              }),
              searchQuery && filteredEvents.length !== events.length && (
                React.createElement("p", { className: "text-sm text-neutral-500 mt-1" },
                  `Showing ${filteredEvents.length} of ${events.length} events`
                )
              )
            ),

            // Add Event Button
            !showEventForm && React.createElement("button", {
              onClick: () => setShowEventForm(true),
              className: "px-4 py-3 rounded-2xl bg-neutral-900 text-white font-medium shadow hover:opacity-90"
            }, "+ Add an Event Synopsis"),

            // Event Form
            showEventForm && React.createElement("div", { className: "mt-4 border border-neutral-200 rounded-2xl p-4 bg-white" },
              React.createElement("h3", { className: "font-semibold mb-3" }, editingEventId ? "Edit Event" : "New Event"),
              React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4" },
                React.createElement(LabeledInput, {
                  label: "BEO Number", placeholder: "e.g., 707-241031-A",
                  value: beo, onChange: (e) => setBeo(e.target.value),
                  error: formErrors.beo
                }),
                React.createElement(LabeledInput, {
                  label: "# of Attendees", type: "number", min: 0, inputMode: "numeric",
                  placeholder: "e.g., 85", value: attendees, onChange: (e) => setAttendees(e.target.value),
                  error: formErrors.attendees
                }),
                React.createElement(LabeledInput, {
                  label: "Extensions ($)", type: "number", step: "0.01", min: 0, inputMode: "decimal",
                  placeholder: "e.g., 1240.50", value: extensions, onChange: (e) => setExtensions(e.target.value),
                  error: formErrors.extensions
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
                }, editingEventId ? "Save Changes" : "Complete & Add to Log"),
                React.createElement("button", {
                  onClick: resetForm,
                  className: "px-4 py-2 rounded-2xl border border-neutral-300 font-medium hover:bg-neutral-50"
                }, "Cancel")
              )
            ),

            // Event List
            React.createElement("div", { className: "mt-6" },
              filteredEvents.length === 0 ? (
                React.createElement("p", { className: "text-neutral-600" },
                  searchQuery ? "No events match your search." : "No events logged yet for this date."
                )
              ) : (
                React.createElement("ul", { className: "space-y-3" },
                  filteredEvents.map((e, idx) => (
                    React.createElement(EventItem, {
                      key: e.id,
                      event: e,
                      index: idx,
                      totalEvents: filteredEvents.length,
                      onEdit: editEvent,
                      onDelete: deleteEvent
                    })
                  ))
                )
              )
            ),

            // Bottom Actions
            events.length > 0 && React.createElement("div", { className: "mt-4 flex flex-wrap gap-2" },
              React.createElement("button", {
                onClick: exportEmail,
                className: "px-4 py-2 rounded-2xl bg-neutral-900 text-white font-medium shadow hover:opacity-90"
              }, "Export via Email"),
              React.createElement("button", {
                onClick: clearDay,
                className: "px-4 py-2 rounded-2xl border border-red-300 text-red-600 font-medium hover:bg-red-50"
              }, "Clear Today")
            )
          )
        ),

        // Backup/Restore Section
        React.createElement("section", { className: "mt-6 grid gap-4" },
          React.createElement(Card, { title: "Data Backup" },
            React.createElement("p", { className: "text-sm text-neutral-600 mb-4" },
              "Export all your data as a backup file, or restore from a previous backup."
            ),
            React.createElement("div", { className: "flex flex-wrap gap-2" },
              React.createElement("button", {
                onClick: exportBackup,
                className: "px-4 py-2 rounded-2xl border border-neutral-300 font-medium hover:bg-neutral-50"
              }, "Export Backup (JSON)"),
              React.createElement("label", { className: "px-4 py-2 rounded-2xl border border-neutral-300 font-medium hover:bg-neutral-50 cursor-pointer" },
                "Import Backup",
                React.createElement("input", {
                  type: "file",
                  accept: ".json",
                  onChange: importBackup,
                  className: "hidden"
                })
              )
            )
          )
        ),

        React.createElement("div", { className: "h-16" })
      )
    )
  );
}

// ============================================================
// UI Components
// ============================================================
function Card({ title, children }) {
  return React.createElement("div", { className: "rounded-3xl bg-white border border-neutral-200 shadow-sm p-5" },
    title && React.createElement("h2", { className: "text-lg font-semibold mb-3" }, title),
    children
  );
}

function LabeledInput(props) {
  const { label, className = "", error, ...rest } = props;
  return React.createElement("label", { className: `grid gap-1 ${className}` },
    React.createElement("span", { className: "text-sm text-neutral-600" }, label),
    React.createElement("input", {
      ...rest,
      className: `w-full rounded-xl border ${error ? "border-red-300 focus:ring-red-300" : "border-neutral-300 focus:ring-neutral-300"} px-3 py-2 focus:outline-none focus:ring-2`
    }),
    error && React.createElement("span", { className: "text-xs text-red-600" }, error)
  );
}

function LabeledTextArea(props) {
  const { label, className = "", error, ...rest } = props;
  return React.createElement("label", { className: `grid gap-1 ${className}` },
    React.createElement("span", { className: "text-sm text-neutral-600" }, label),
    React.createElement("textarea", {
      ...rest,
      className: `w-full rounded-xl border ${error ? "border-red-300 focus:ring-red-300" : "border-neutral-300 focus:ring-neutral-300"} px-3 py-2 focus:outline-none focus:ring-2`
    }),
    error && React.createElement("span", { className: "text-xs text-red-600" }, error)
  );
}

// ============================================================
// Utility Functions
// ============================================================
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
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
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
  return text.split("\n").map((line) => pad + line).join("\n");
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ============================================================
// App Initialization with Error Boundary
// ============================================================
ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(ErrorBoundary, null,
    React.createElement(App)
  )
);
