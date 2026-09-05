import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { client } from "../../api/client";

/**
 * Type-to-search dropdown for picking an institute/NGO by name or numeric
 * ID. Used when creating a new inspection template, since every template
 * now belongs to a specific institute (InspectionTemplate.institute).
 */
function InstitutePicker({ institutes, value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = institutes.find((i) => String(i.id) === String(value));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return institutes.slice(0, 20);
    return institutes
      .filter((i) => i.name.toLowerCase().includes(q) || String(i.id) === q)
      .slice(0, 20);
  }, [query, institutes]);

  return (
    <div className="relative">
      <input
        className="w-full border border-[var(--line)] px-3 py-2"
        placeholder="Search institute/NGO by name or ID…"
        value={selected ? `${selected.name} (ID ${selected.id})` : query}
        onChange={(e) => {
          onChange("");
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto bg-white border border-[var(--line)] shadow">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-[var(--ink-soft)]">No institutes match.</div>
          )}
          {filtered.map((i) => (
            <button
              type="button"
              key={i.id}
              onClick={() => {
                onChange(i.id);
                setQuery("");
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--paper)]"
            >
              {i.name} <span className="text-[var(--ink-soft)]">— ID {i.id} · {i.district}, {i.state}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InspectionTemplates() {
  const [templates, setTemplates] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [instituteId, setInstituteId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterInstitute, setFilterInstitute] = useState("");

  function load() {
    setLoading(true);
    const params = filterInstitute ? `?institute=${filterInstitute}` : "";
    client
      .get(`/inspections/templates/${params}`)
      .then(({ data }) => setTemplates(data))
      .finally(() => setLoading(false));
  }
  useEffect(load, [filterInstitute]);

  useEffect(() => {
    client.get("/registry/institutes/").then(({ data }) => setInstitutes(data));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!instituteId) {
      setError("Please select an institute/NGO for this template.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await client.post("/inspections/templates/", {
        name,
        description,
        is_active: true,
        institute: instituteId,
      });
      setName("");
      setDescription("");
      setInstituteId("");
      setShowForm(false);
      load();
    } catch {
      setError("Could not create template.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(t) {
    await client.patch(`/inspections/templates/${t.id}/`, { is_active: !t.is_active });
    load();
  }

  async function handleDelete(t) {
    if (!window.confirm(`Delete template "${t.name}"? Existing assignments using it will be affected.`)) return;
    try {
      await client.delete(`/inspections/templates/${t.id}/`);
      load();
    } catch {
      setError("Could not delete — it's likely still referenced by existing assignments.");
    }
  }

  return (
    <div className="p-8 space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--ink)]">Inspection Templates</h1>
          <p className="text-sm text-[var(--ink-soft)]">
            Checklists used when officers submit an inspection — each one belongs to a specific institute/NGO.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-[var(--ink)] text-white text-sm font-medium px-4 py-2 hover:bg-[var(--accent)] transition-colors"
        >
          {showForm ? "Cancel" : "+ New Template"}
        </button>
      </header>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-[var(--line)] p-4 space-y-3">
          <label className="block text-sm space-y-1">
            <span className="text-[var(--ink-soft)]">Institute / NGO</span>
            <InstitutePicker institutes={institutes} value={instituteId} onChange={setInstituteId} />
          </label>
          <label className="block text-sm space-y-1">
            <span className="text-[var(--ink-soft)]">Name</span>
            <input
              required
              className="w-full border border-[var(--line)] px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-sm space-y-1">
            <span className="text-[var(--ink-soft)]">Description</span>
            <textarea
              rows={2}
              className="w-full border border-[var(--line)] px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="bg-[var(--ink)] text-white text-sm font-medium px-4 py-2 disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create — then add questions"}
          </button>
        </form>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--ink-soft)]">Filter by institute:</span>
        <select
          className="border border-[var(--line)] px-2 py-1.5 text-sm bg-white"
          value={filterInstitute}
          onChange={(e) => setFilterInstitute(e.target.value)}
        >
          <option value="">All institutes</option>
          {institutes.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} (ID {i.id})
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-[var(--line)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left text-[var(--ink-soft)]">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Institute / NGO</th>
              <th className="px-4 py-2 font-medium">Questions</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="px-4 py-4 text-[var(--ink-soft)]" colSpan={5}>Loading…</td></tr>
            )}
            {!loading && templates.length === 0 && (
              <tr><td className="px-4 py-4 text-[var(--ink-soft)]" colSpan={5}>No templates yet — create one above.</td></tr>
            )}
            {templates.map((t) => (
              <tr key={t.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-2.5 font-medium">{t.name}</td>
                <td className="px-4 py-2.5">
                  {t.institute_name || <span className="text-[var(--ink-soft)]">— general —</span>}
                </td>
                <td className="px-4 py-2.5">{t.fields.length}</td>
                <td className="px-4 py-2.5">
                  <button onClick={() => toggleActive(t)} className={t.is_active ? "text-[var(--ok)]" : "text-[var(--ink-soft)]"}>
                    {t.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <Link to={`/templates/${t.id}`} className="text-[var(--accent)] underline mr-3">Edit questions</Link>
                  <button onClick={() => handleDelete(t)} className="text-[var(--danger)] underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
