"use client";

import { useState, useEffect, useMemo } from "react";
import { getPrestacionesBySheet, updatePrestacion, addPrestacion, deletePrestacion } from "@/actions/prestaciones";
import { Search, Plus, Save, Trash2, Edit2, Loader2, FileSpreadsheet } from "lucide-react";
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
        if (k !== 'id' && k !== 'sheet_name') keys.add(k);
      });
    });
    return Array.from(keys);
  }, [data]);

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

  const handleAdd = async (customSheet?: string, customRow?: any) => {
    const sheet = customSheet || activeSheet;
    if (!sheet) return;
    const rowToSave = customRow || columns.reduce((acc: any, col) => ({ ...acc, [col]: "" }), {});

    setIsSaving(true);
    const res = await addPrestacion(sheet, rowToSave);
    if (res.success) {
      loadSheetData(sheet);
      return res;
    } else {
      alert("Error al agregar fila");
    }
    setIsSaving(false);
  };

  const handleCreateSection = async (title: string, subtitle: string, headers: string[]) => {
    setIsSaving(true);
    try {
      const mainKey = "__EMPTY"; // Usually safe key for title
      await addPrestacion(activeSheet, { [mainKey]: title });
      if (subtitle) await addPrestacion(activeSheet, { [mainKey]: subtitle });
      const headerRow: any = { [mainKey]: "Prestaciones" };
      headers.forEach((h, i) => {
        if (h.toLowerCase() !== "prestaciones") {
          const ek = i === 0 ? "__EMPTY" : `__EMPTY_${i}`;
          if (i === 0) headerRow["__EMPTY"] = "Prestaciones"; // Specific mapping
          headerRow[ek] = h;
        }
      });
      await addPrestacion(activeSheet, headerRow);
      await addPrestacion(activeSheet, { [mainKey]: "Nueva Prestación..." });
      loadSheetData(activeSheet);
    } catch (e) {
      console.error(e);
    }
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

  const formatValue = (val: any) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
    }
    return val || "-";
  };

  const renderSectionedView = () => {
    const rawSections: any[] = [];
    let currentSection: any = null;

    // First, group everything WITHOUT filtering
    data.forEach((row) => {
      const rd = row.row_data;
      const values = Object.values(rd);
      const textValues = values.filter(v => v !== null && String(v).trim() !== '');
      const mainKey = Object.keys(rd).find(k => k === "__EMPTY" || k.toLowerCase().includes("laboratorio")) || Object.keys(rd)[0];
      const mainVal = mainKey ? rd[mainKey] : null;

      const isNewSection = mainVal && textValues.length === 1 &&
        !mainVal.includes("NOTA:") && !mainVal.includes("Valores") && !mainVal.includes("actualizados") && !mainVal.includes("Prestación");
      const isSubHeader = mainVal && (mainVal.includes("Valores") || mainVal.includes("actualizados"));
      const isRowHeader = mainVal && (mainVal.includes("Prestaciones") || mainVal.includes("Nombre"));
      const isNote = mainVal && mainVal.includes("NOTA:");

      if (isNewSection) {
        currentSection = { title: mainVal, subtitle: "", headers: [], labels: {}, rows: [], note: "", allIds: [row.id] };
        rawSections.push(currentSection);
      } else if (currentSection) {
        currentSection.allIds.push(row.id);
        if (isSubHeader) currentSection.subtitle = mainVal;
        else if (isRowHeader) {
          currentSection.headers = Object.keys(rd).filter(k => k !== 'id' && (rd[k] || k === mainKey));
          currentSection.headers.forEach((h: string) => currentSection.labels[h] = rd[h]);
        } else if (isNote) currentSection.note = mainVal;
        else if (textValues.length > 0) currentSection.rows.push(row);
      } else if (textValues.length > 0) {
        currentSection = { title: "General", subtitle: "", headers: Object.keys(rd).filter(k => k !== 'id' && k !== 'sheet_name'), labels: {}, rows: [row], note: "", allIds: [row.id] };
        rawSections.push(currentSection);
      }
    });

    // Now apply Search filter
    const lowerSearch = search.toLowerCase();
    const filteredSections = rawSections.filter(section => {
      if (!search) return true;
      const titleMatch = section.title.toLowerCase().includes(lowerSearch);
      const rowsMatch = section.rows.some((row: any) =>
        Object.values(row.row_data).some(v => String(v).toLowerCase().includes(lowerSearch))
      );
      return titleMatch || rowsMatch;
    }).map(section => {
      if (!search) return section;
      const titleMatch = section.title.toLowerCase().includes(lowerSearch);
      // If title matches, show all rows. If not, only matching rows.
      if (titleMatch) return section;
      return {
        ...section,
        rows: section.rows.filter((row: any) =>
          Object.values(row.row_data).some(v => String(v).toLowerCase().includes(lowerSearch))
        )
      };
    });

    if (filteredSections.length === 0) return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No se encontraron resultados.
      </div>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {filteredSections.map((section, idx) => (
          <div key={idx} className="section-block" style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '1.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>{section.title}</h3>
                {section.subtitle && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{section.subtitle}</p>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleAdd(activeSheet, { "__EMPTY": "Nueva Prestación..." })} className="btn-small-primary"><Plus size={14} /> Agregar Fila</button>
                <button onClick={() => handleDeleteSection(section.allIds)} className="btn-small-danger"><Trash2 size={14} /> Eliminar Tabla</button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: '#1e3a8a' }}>
                    {(section.headers.length > 0 ? section.headers : columns).map((h: any) => (
                      <th key={h} style={{ padding: '1rem', textAlign: 'left', color: 'white', fontWeight: 600, border: '1px solid #334155', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        {section.labels[h] || h}
                      </th>
                    ))}
                    <th style={{ width: '100px', background: '#1e3a8a', border: '1px solid #334155' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row: any) => (
                    <tr key={row.id} className="table-row-hover">
                      {(section.headers.length > 0 ? section.headers : columns).map((h: any) => (
                        <td key={h} style={{ padding: '0.75rem 1rem', border: '1px solid #e2e8f0' }}>
                          {editingRow === row.id ? (
                            <input className="input-inline" value={editData[h] || ""} onChange={(e) => handleValueChange(h, e.target.value)} autoFocus={h === section.headers[0]} />
                          ) : (
                            <span style={{ fontWeight: String(h).includes("EMPTY") ? 700 : 400 }}>{formatValue(row.row_data[h])}</span>
                          )}
                        </td>
                      ))}
                      <td style={{ textAlign: 'right', padding: '0.5rem 1rem', border: '1px solid #e2e8f0', background: 'white', position: 'sticky', right: 0, zIndex: 5 }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          {editingRow === row.id ? (
                            <button onClick={() => handleSave(row.id)} className="btn-action save"><Save size={16} /></button>
                          ) : (
                            <button onClick={() => handleEdit(row)} className="btn-action edit"><Edit2 size={16} /></button>
                          )}
                          <button onClick={() => handleDelete(row.id)} className="btn-action delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <button className="btn-primary" onClick={() => setIsModalOpen(true)} disabled={isSaving}><Plus size={18} /> Nuevo Convenio</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
        {initialSheets.map(sheet => (
          <button key={sheet} onClick={() => setActiveSheet(sheet)} className={activeSheet === sheet ? "tab-active" : "tab-inactive"}>{sheet}</button>
        ))}
      </div>

      <div style={{ flex: 1 }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 size={48} className="animate-spin" /><p>Cargando...</p></div>
        ) : (
          activeSheet === "Convenios Particulares" ? renderSectionedView() : (
            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--glass-bg)' }}>
                    {columns.map(col => <th key={col} style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>{col}</th>)}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map(row => (
                    <tr key={row.id}>
                      {columns.map(col => (
                        <td key={col} style={{ padding: '0.75rem 1rem' }}>
                          {editingRow === row.id ? <input className="input-inline" value={editData[col] || ""} onChange={e => handleValueChange(col, e.target.value)} /> : formatValue(row.row_data[col])}
                        </td>
                      ))}
                      <td style={{ textAlign: 'right' }}>
                        {editingRow === row.id ? <button onClick={() => handleSave(row.id)} className="btn-action save"><Save size={14} /></button> : <button onClick={() => handleEdit(row)} className="btn-action edit"><Edit2 size={14} /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <CreateSectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateSection} />

      <style jsx>{`
        .modern-input { background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 12px; padding: 0.6rem 1rem; }
        .tab-active { padding: 0.6rem 1.2rem; background: var(--primary); color: white; border: none; border-radius: 12px 12px 0 0; font-weight: 700; cursor: pointer; }
        .tab-inactive { padding: 0.6rem 1.2rem; background: rgba(0,0,0,0.05); color: var(--text-muted); border: none; border-radius: 12px 12px 0 0; cursor: pointer; }
        .btn-primary { background: var(--primary); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .btn-small-primary { background: var(--primary); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; }
        .btn-small-danger { background: #fee2e2; color: #ef4444; border: none; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; }
        .input-inline { width: 100%; border: 1px solid var(--primary); border-radius: 4px; padding: 0.3rem }
        .btn-action { background: none; border: none; cursor: pointer; }
        .btn-action.save { color: var(--success); }
        .btn-action.edit { color: var(--text-muted); }
        .btn-action.delete { color: var(--danger); }
        .glass-panel { background: white; border-radius: 16px; border: 1px solid var(--glass-border); }
      `}</style>
    </div>
  );
}
