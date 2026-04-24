"use client";

import { useState, useEffect, useMemo } from "react";
import { getPrestacionesBySheet, updatePrestacion, addPrestacion, deletePrestacion } from "@/actions/prestaciones";
import { Search, Plus, Save, Trash2, Edit2, Loader2, FileSpreadsheet, Settings } from "lucide-react";
import CreateSectionModal from "./CreateSectionModal";

export default function PrestacionesDashboard({ initialSheets }: { initialSheets: string[] }) {
  const [activeSheet, setActiveSheet] = useState(initialSheets[0] || "");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingSectionData, setEditingSectionData] = useState<any>(null);

  useEffect(() => {
    if (activeSheet) {
      loadSheetData(activeSheet);
    }
  }, [activeSheet]);

  async function loadSheetData(sheetName: string) {
    setLoading(true);
    const res = await getPrestacionesBySheet(sheetName);
    if (res.success) {
      setData(res.data || []);
    }
    setLoading(false);
  }

  const columns = useMemo(() => {
    if (data.length === 0) return [];
    const keys = new Set<string>();
    data.forEach(row => {
      Object.keys(row.row_data).forEach(k => {
        if (k !== 'id' && k !== 'sheet_name' && k !== 'meta_part') keys.add(k);
      });
    });
    return Array.from(keys);
  }, [data]);

  const filteredData = useMemo(() => {
    if (!search) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter(row => {
      return Object.values(row.row_data).some(val =>
        String(val).toLowerCase().includes(lowerSearch)
      );
    });
  }, [data, search]);

  const recalculateRow = (rowData: any, sheet: string) => {
    const updated = { ...rowData };
    if (sheet === 'O. SOCIALES ' && updated['NBU'] && updated['COSTO DERIVACION']) {
      const g = parseFloat(updated['NBU']) || 0;
      const c = parseFloat(updated['COSTO DERIVACION']) || 0;
      updated['COBERTURA OBRA SOCIAL '] = g - c;
    }
    if (updated['Importe'] && !updated['ACTUALIZADO']) {
      updated['ACTUALIZADO'] = (parseFloat(updated['Importe']) || 0) * 1.3;
    }
    if (updated['Costo Interno '] && updated['Derivación'] && updated['Envío']) {
      const ci = parseFloat(updated['Costo Interno ']) || 0;
      const d = parseFloat(updated['Derivación']) || 0;
      const e = parseFloat(updated['Envío']) || 0;
      updated['Costo Total'] = ci + d + e;
    }
    return updated;
  };

  const handleEdit = (row: any) => {
    setEditingRow(row.id);
    setEditData({ ...row.row_data });
  };

  const handleValueChange = (col: string, val: string) => {
    let newEditData = { ...editData, [col]: val };
    newEditData = recalculateRow(newEditData, activeSheet);
    setEditData(newEditData);
  };

  const handleSave = async (id: number) => {
    setIsSaving(true);
    const res = await updatePrestacion(id, editData);
    if (res.success) {
      setData(prev => prev.map(r => r.id === id ? { ...r, row_data: editData } : r));
      setEditingRow(null);
    } else {
      alert("Error al guardar: " + res.error);
    }
    setIsSaving(false);
  };

  const handleAddRow = async (customSheet?: string, customRow?: any, afterId?: number) => {
    const sheet = customSheet || activeSheet;
    if (!sheet) return;
    const rowToSave = customRow || columns.reduce((acc: any, col) => ({ ...acc, [col]: "" }), {});

    setIsSaving(true);
    const res = await addPrestacion(sheet, rowToSave, afterId);
    if (res.success) {
      // Silent reload to ensure correct structural order
      const freshRes = await getPrestacionesBySheet(sheet);
      if (freshRes.success) {
        setData(freshRes.data || []);
        // Find the new row to set editing mode
        const newId = res.data.id;
        setEditingRow(newId);
        setEditData({ ...res.data.row_data });
      }
    } else {
      alert("Error al agregar fila");
    }
    setIsSaving(false);
  };

  const handleTableStructureSubmit = async (title: string, subtitle: string, note: string, columnsWithTypes: Array<{ name: string, type: string }>) => {
    setIsSaving(true);
    try {
      const mainKey = "__EMPTY";

      if (modalMode === "edit" && editingSectionData) {
        const { structuralIds } = editingSectionData;
        if (structuralIds.title) await updatePrestacion(structuralIds.title, { [mainKey]: title, "meta_part": "TITLE" });
        if (structuralIds.subtitle) {
          await updatePrestacion(structuralIds.subtitle, { [mainKey]: subtitle, "meta_part": "SUBTITLE" });
        } else if (subtitle) {
          await addPrestacion(activeSheet, { [mainKey]: subtitle, "meta_part": "SUBTITLE" });
        }
        const metaRow: any = { [mainKey]: "__METADATA__", "meta_part": "METADATA" };
        columnsWithTypes.forEach((col, i) => { const ek = i === 0 ? "__EMPTY" : `__EMPTY_${i}`; metaRow[ek] = col.type; });
        if (structuralIds.metadata) await updatePrestacion(structuralIds.metadata, metaRow);
        const headerLabels: any = { [mainKey]: "Prestaciones", "meta_part": "HEADER" };
        columnsWithTypes.forEach((col, i) => { const ek = i === 0 ? "__EMPTY" : `__EMPTY_${i}`; headerLabels[ek] = col.name; });
        if (structuralIds.header) await updatePrestacion(structuralIds.header, headerLabels);
        if (structuralIds.note) {
          await updatePrestacion(structuralIds.note, { [mainKey]: note, "meta_part": "NOTE" });
        } else if (note) {
          await addPrestacion(activeSheet, { [mainKey]: note, "meta_part": "NOTE" });
        }
      } else {
        await addPrestacion(activeSheet, { [mainKey]: title, "meta_part": "TITLE" });
        if (subtitle) await addPrestacion(activeSheet, { [mainKey]: subtitle, "meta_part": "SUBTITLE" });
        const metaRow: any = { [mainKey]: "__METADATA__", "meta_part": "METADATA" };
        columnsWithTypes.forEach((col, i) => { const ek = i === 0 ? "__EMPTY" : `__EMPTY_${i}`; metaRow[ek] = col.type; });
        await addPrestacion(activeSheet, metaRow);
        const headerLabels: any = { [mainKey]: "Prestaciones", "meta_part": "HEADER" };
        columnsWithTypes.forEach((col, i) => { const ek = i === 0 ? "__EMPTY" : `__EMPTY_${i}`; headerLabels[ek] = col.name; });
        await addPrestacion(activeSheet, headerLabels);
        if (note) await addPrestacion(activeSheet, { [mainKey]: note, "meta_part": "NOTE" });
        await addPrestacion(activeSheet, { [mainKey]: "Nueva Prestación...", "meta_part": "DATA" });
      }
      loadSheetData(activeSheet);
    } catch (e) {
      console.error(e);
      alert("Error al guardar cambios estructurales");
    }
    setModalMode("create");
    setEditingSectionData(null);
    setIsSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta fila?")) return;
    const res = await deletePrestacion(id);
    if (res.success) {
      setData(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleDeleteSection = async (ids: number[]) => {
    if (!confirm(`¿Estás seguro de eliminar toda esta tabla (${ids.length} filas)?`)) return;
    setIsSaving(true);
    for (const id of ids) {
      await deletePrestacion(id);
    }
    loadSheetData(activeSheet);
    setIsSaving(false);
  };

  const openEditModal = (section: any) => {
    const columnsForModal = section.headers.map((h: string) => ({
      name: section.labels[h] || h,
      type: section.types[h] || "text"
    }));
    setEditingSectionData({
      title: section.title,
      subtitle: section.subtitle,
      note: section.note,
      columns: columnsForModal,
      structuralIds: section.structuralIds
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const formatWithTypes = (val: any, type: string) => {
    if (type === 'price' && val !== null && val !== undefined && val !== '') {
      const cleanVal = String(val).replace(',', '.');
      const num = parseFloat(cleanVal);
      if (!isNaN(num)) {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
      }
    }
    return val || "-";
  };

  const renderSectionedView = () => {
    const rawSections: any[] = [];
    let currentSection: any = null;

    data.forEach((row) => {
      const rd = row.row_data;
      const part = rd["meta_part"] || rd["__SECTION_PART__"];
      const entries = Object.entries(rd);
      const internalKeys = ['id', 'sheet_name', 'meta_part', '__SECTION_PART__'];
      const textValues = entries.filter(([k, v]) => v !== null && String(v).trim() !== '' && !internalKeys.includes(k)).map(([_, v]) => v);

      const mainKey = Object.keys(rd).find(k => k === "__EMPTY" || k.toLowerCase().includes("laboratorio")) || Object.keys(rd)[0];
      const mainVal = mainKey ? rd[mainKey] : null;

      const isForcedTitle = part === "TITLE";
      const isForcedSubtitle = part === "SUBTITLE";
      const isForcedMetadata = part === "METADATA";
      const isForcedHeader = part === "HEADER";
      const isForcedNote = part === "NOTE";
      const isForcedData = part === "DATA";

      const isHeuristicTitle = !part && mainVal && textValues.length === 1 &&
        !String(mainVal).includes("NOTA:") && !String(mainVal).includes("Valores") && !String(mainVal).includes("actualizados") &&
        !String(mainVal).includes("Prestación") && mainVal !== "__METADATA__";

      if (isForcedTitle || isHeuristicTitle) {
        currentSection = {
          title: mainVal, subtitle: "", headers: [], labels: {}, types: {}, rows: [], note: "", allIds: [row.id],
          structuralIds: { title: row.id, subtitle: null, metadata: null, header: null, note: null }
        };
        rawSections.push(currentSection);
      } else if (currentSection) {
        currentSection.allIds.push(row.id);
        if (isForcedSubtitle || (!part && (String(mainVal).includes("Valores") || String(mainVal).includes("actualizados")))) {
          currentSection.subtitle = mainVal;
          currentSection.structuralIds.subtitle = row.id;
        } else if (isForcedMetadata || mainVal === "__METADATA__") {
          currentSection.structuralIds.metadata = row.id;
          Object.keys(rd).forEach(k => { if (!internalKeys.includes(k)) currentSection.types[k] = rd[k]; });
        } else if (isForcedHeader || (!part && (String(mainVal).includes("Prestaciones") || String(mainVal).includes("Nombre")))) {
          currentSection.structuralIds.header = row.id;
          currentSection.headers = Object.keys(rd).filter(k => !internalKeys.includes(k) && (rd[k] || k === mainKey));
          currentSection.headers.forEach((h: string) => currentSection.labels[h] = rd[h]);
        } else if (isForcedNote || (!part && String(mainVal).includes("NOTA:"))) {
          currentSection.note = mainVal;
          currentSection.structuralIds.note = row.id;
        } else if (isForcedData || (!part && textValues.length > 0)) {
          currentSection.rows.push(row);
        }
      }
    });

    const lowerSearch = search.toLowerCase();
    const filteredSections = rawSections.filter(section => {
      if (!search) return true;
      const titleMatch = String(section.title).toLowerCase().includes(lowerSearch);
      const rowsMatch = section.rows.some((row: any) => Object.values(row.row_data).some(v => String(v).toLowerCase().includes(lowerSearch)));
      return titleMatch || rowsMatch;
    }).map(section => {
      if (!search) return section;
      if (String(section.title).toLowerCase().includes(lowerSearch)) return section;
      return { ...section, rows: section.rows.filter((row: any) => Object.values(row.row_data).some(v => String(v).toLowerCase().includes(lowerSearch))) };
    });

    if (filteredSections.length === 0) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron resultados.</div>;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {filteredSections.map((section, idx) => (
          <div key={idx} className="section-block" style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '1.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>{section.title}</h3>
                {section.subtitle && <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 600 }}>{section.subtitle}</p>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => openEditModal(section)} className="btn-small-secondary"><Settings size={14} /> Editar Tabla</button>
                <button
                  onClick={() => {
                    const lastId = section.rows.length > 0
                      ? section.rows[section.rows.length - 1].id
                      : (section.structuralIds.note || section.structuralIds.header || section.structuralIds.title);
                    handleAddRow(activeSheet, { "__EMPTY": "Nueva Prestación...", "meta_part": "DATA" }, lastId);
                  }}
                  className="btn-small-primary"
                >
                  <Plus size={14} /> Agregar Fila
                </button>
                <button onClick={() => handleDeleteSection(section.allIds)} className="btn-small-danger"><Trash2 size={14} /> Eliminar Tabla</button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: '#1e3a8a' }}>
                    {(section.headers.length > 0 ? section.headers : columns).map((h: any) => (
                      <th key={h} style={{ padding: '1.25rem 1rem', textAlign: 'left', color: 'white', fontWeight: 700, border: '1px solid #334155', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        {section.labels[h] || h}
                      </th>
                    ))}
                    <th style={{ width: '100px', background: '#1e3a8a', border: '1px solid #334155' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row: any) => (
                    <tr key={row.id} className="table-row-hover">
                      {(section.headers.length > 0 ? section.headers : columns).map((h: any) => {
                        const type = section.types[h] || "text";
                        return (
                          <td key={h} style={{ padding: '0.75rem 1rem', border: '1px solid #f1f5f9' }}>
                            {editingRow === row.id ? (
                              <input type={type === 'number' || type === 'price' ? 'number' : 'text'} step={type === 'price' ? "0.01" : "1"} className="input-inline" value={editData[h] || ""} onChange={(e) => handleValueChange(h, e.target.value)} autoFocus={h === section.headers[0]} />
                            ) : (
                              <span style={{ fontWeight: String(h).includes("EMPTY") ? 700 : 400 }}>{formatWithTypes(row.row_data[h], type)}</span>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'right', padding: '0.5rem 1rem', border: '1px solid #f1f5f9', background: 'white', position: 'sticky', right: 0, zIndex: 5 }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          {editingRow === row.id ? <button onClick={() => handleSave(row.id)} className="btn-action save"><Save size={16} /></button> : <button onClick={() => handleEdit(row)} className="btn-action edit"><Edit2 size={16} /></button>}
                          <button onClick={() => handleDelete(row.id)} className="btn-action delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {section.note && (
              <div style={{ padding: '1.25rem', margin: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', marginTop: '2px' }}>[NOTA:]</div>
                <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, lineHeight: 1.5 }}>{section.note}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <FileSpreadsheet size={32} color="var(--primary)" /> Módulo de Prestaciones
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="modern-input" style={{ width: '100%', paddingLeft: '2.5rem' }} />
          </div>
          {activeSheet === "Convenios Particulares" && (
            <button className="btn-primary" onClick={() => { setModalMode("create"); setEditingSectionData(null); setIsModalOpen(true); }} disabled={isSaving}><Plus size={18} /> Nuevo Convenio</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>{initialSheets.map(sheet => (
        <button key={sheet} onClick={() => setActiveSheet(sheet)} className={activeSheet === sheet ? "tab-active" : "tab-inactive"}>{sheet}</button>
      ))}</div>

      <div style={{ flex: 1 }}>{loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 size={48} className="animate-spin" /><p>Cargando...</p></div>
      ) : (activeSheet === "Convenios Particulares" ? renderSectionedView() : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--glass-bg)' }}>{columns.map(col => <th key={col} style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>{col}</th>)}<th></th></tr></thead>
            <tbody>{filteredData.map(row => (
              <tr key={row.id}>
                {columns.map(col => (<td key={col} style={{ padding: '0.75rem 1rem' }}>{editingRow === row.id ? <input className="input-inline" value={editData[col] || ""} onChange={e => handleValueChange(col, e.target.value)} /> : formatWithTypes(row.row_data[col], 'text')}</td>))}
                <td style={{ textAlign: 'right' }}>{editingRow === row.id ? <button onClick={() => handleSave(row.id)} className="btn-action save"><Save size={14} /></button> : <button onClick={() => handleEdit(row)} className="btn-action edit"><Edit2 size={14} /></button>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ))}</div>
      <CreateSectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleTableStructureSubmit} mode={modalMode} initialData={editingSectionData} />
      <style jsx>{`
        .modern-input { background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 12px; padding: 0.6rem 1rem; }
        .tab-active { padding: 0.6rem 1.2rem; background: var(--primary); color: white; border: none; border-radius: 12px 12px 0 0; font-weight: 700; cursor: pointer; }
        .tab-inactive { padding: 0.6rem 1.2rem; background: rgba(0,0,0,0.05); color: var(--text-muted); border: none; border-radius: 12px 12px 0 0; cursor: pointer; }
        .btn-primary { background: var(--primary); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .btn-small-primary { background: var(--primary); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; }
        .btn-small-secondary { background: #f1f5f9; color: #475569; border: none; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; }
        .btn-small-danger { background: #fee2e2; color: #ef4444; border: none; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; }
        .input-inline { width: 100%; border: 1px solid var(--primary); border-radius: 4px; padding: 0.3rem }
        .btn-action { background: none; border: none; cursor: pointer; }
        .btn-action.save { color: var(--success); }
        .btn-action.edit { color: var(--text-muted); }
        .btn-action.delete { color: var(--danger); }
        .glass-panel { background: white; border-radius: 16px; border: 1px solid var(--glass-border); }
        .table-row-hover:hover { background: #f8fafc; }
      `}</style>
    </div>
  );
}
