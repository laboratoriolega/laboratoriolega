"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  getPrestacionesBySheet, 
  updatePrestacion, 
  addPrestacion, 
  deletePrestacion,
  addPrestacionSection
} from "@/actions/prestaciones";
import { Search, Plus, Save, Trash2, Edit2, Loader2, FileSpreadsheet, PlusCircle } from "lucide-react";

interface Section {
  id: number;
  title: string;
  subtitle: string;
  note: string;
  headers: string[];
}

export default function PrestacionesDashboard({ initialSheets }: { initialSheets: string[] }) {
  const [activeSheet, setActiveSheet] = useState(initialSheets[0] || "");
  const [sections, setSections] = useState<Section[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);

  useEffect(() => {
    if (activeSheet) {
      loadSheetData(activeSheet);
    }
  }, [activeSheet]);

  async function loadSheetData(sheetName: string) {
    setLoading(true);
    const res = await getPrestacionesBySheet(sheetName);
    if (res.success) {
      setSections(res.sections || []);
      setRows(res.rows || []);
    }
    setLoading(false);
  }

  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const lowerSearch = search.toLowerCase();
    return rows.filter(row => {
      return Object.values(row.row_data).some(val => 
        String(val).toLowerCase().includes(lowerSearch)
      );
    });
  }, [rows, search]);

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
       updated['Costo Total'] = (parseFloat(updated['Costo Interno ']) || 0) + (parseFloat(updated['Derivación']) || 0) + (parseFloat(updated['Envío']) || 0);
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
      setRows(prev => prev.map(r => r.id === id ? { ...r, row_data: editData } : r));
      setEditingRow(null);
    }
    setIsSaving(false);
  };

  const handleAddRow = async (sectionId: number, headers: string[]) => {
    const newRowData = headers.reduce((acc: any, col) => ({ ...acc, [col]: "" }), {});
    setIsSaving(true);
    const res = await addPrestacion(activeSheet, newRowData, sectionId);
    if (res.success) {
      loadSheetData(activeSheet);
    }
    setIsSaving(false);
  };

  const handleAddSection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const subtitle = formData.get("subtitle") as string;
    const headersStr = formData.get("headers") as string;
    const headers = headersStr.split(",").map(h => h.trim());

    setIsSaving(true);
    const res = await addPrestacionSection(activeSheet, title, subtitle, headers);
    if (res.success) {
      setShowNewSectionForm(false);
      loadSheetData(activeSheet);
    }
    setIsSaving(false);
  };

  const formatValue = (val: any) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
    }
    return val || "-";
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100vh', padding: '1rem' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <FileSpreadsheet size={32} color="var(--primary)" /> Módulo de Prestaciones
          </h2>
          {activeSheet === 'Convenios Particulares' && <p style={{ color: 'var(--primary)', fontWeight: 600 }}>Vista Optimizada por Laboratorios</p>}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '600px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              type="text" 
              placeholder="Buscar en todas las secciones..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="modern-input"
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
          </div>
          <button className="btn-secondary" onClick={() => setShowNewSectionForm(true)}>
            <PlusCircle size={18} /> Nueva Sección
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', borderBottom: '1px solid var(--glass-border)' }}>
        {initialSheets.map(sheet => (
          <button
            key={sheet}
            onClick={() => setActiveSheet(sheet)}
            className={`tab-button ${activeSheet === sheet ? 'active' : ''}`}
          >
            {sheet}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {loading ? (
          <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
            <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>Cargando estructura estructurada...</p>
          </div>
        ) : (
          sections.map(section => {
            const sectionRows = filteredRows.filter(r => r.section_id === section.id);
            if (search && sectionRows.length === 0) return null;

            return (
              <div key={section.id} className="glass-panel" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{section.title}</h3>
                      {section.subtitle && <p style={{ margin: '0.25rem 0 0', opacity: 0.6, fontSize: '0.85rem' }}>{section.subtitle}</p>}
                    </div>
                    <button className="btn-small" onClick={() => handleAddRow(section.id, section.headers)}>
                      <Plus size={14} /> Fila
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(0,0,0,0.02)' }}>
                      <tr>
                        {section.headers?.map(header => (
                          <th key={header} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            {header}
                          </th>
                        ))}
                        <th style={{ width: '80px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionRows.map(row => (
                        <tr key={row.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          {section.headers?.map(header => (
                            <td key={header} style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                              {editingRow === row.id ? (
                                <input 
                                  type="text"
                                  value={editData[header] || ""}
                                  onChange={(e) => handleValueChange(header, e.target.value)}
                                  className="inline-edit-input"
                                />
                              ) : (
                                <span className={header.includes("Importe") || header.includes("Costo") ? "price-value" : ""}>
                                  {formatValue(row.row_data[header])}
                                </span>
                              )}
                            </td>
                          ))}
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                             <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                               {editingRow === row.id ? (
                                 <button className="save-btn" onClick={() => handleSave(row.id)}><Save size={12} /></button>
                               ) : (
                                 <button className="icon-btn" onClick={() => handleEdit(row)}><Edit2 size={12} /></button>
                               )}
                               <button className="icon-btn delete" onClick={() => deletePrestacion(row.id)}><Trash2 size={12} /></button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {section.note && (
                  <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(0,0,0,0.02)', fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.7 }}>
                    {section.note}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Section Modal (Simple) */}
      {showNewSectionForm && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ padding: '2rem', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Nueva Sección de Laboratorio</h3>
            <form onSubmit={handleAddSection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input name="title" placeholder="Nombre del Laboratorio (ej: Laboratorio Central)" required className="modern-input" />
              <input name="subtitle" placeholder="Subtítulo (ej: Valores 2026)" className="modern-input" />
              <input name="headers" placeholder="Columnas separadas por coma (ej: Prestación, Costo, Tipo)" required className="modern-input" />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={isSaving}>Crear Sección</button>
                <button type="button" className="btn-secondary" onClick={() => setShowNewSectionForm(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .tab-button {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          color: var(--text-muted);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          font-size: 0.9rem;
          border-bottom: 2px solid transparent;
        }
        .tab-button.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }
        .glass-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          box-shadow: var(--glass-shadow);
        }
        .modern-input {
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid var(--glass-border);
          background: white;
          width: 100%;
        }
        .inline-edit-input {
          width: 100%;
          padding: 0.3rem;
          border-radius: 4px;
          border: 1px solid var(--primary);
          font-size: 0.85rem;
        }
        .btn-primary { background: var(--primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 700; }
        .btn-secondary { background: rgba(0,0,0,0.05); color: var(--text-main); border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
        .btn-small { background: var(--primary); color: white; border: none; padding: 0.3rem 0.7rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; display: flex; align-items: center; gap: 0.35rem; }
        .icon-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; }
        .icon-btn.delete { color: var(--danger); opacity: 0.6; }
        .save-btn { background: var(--success); color: white; border: none; border-radius: 4px; padding: 4px; cursor: pointer; }
        .price-value { font-weight: 800; color: var(--primary); }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justifyContent: center; zIndex: 1000; backdropFilter: blur(4px); }
      `}</style>
    </div>
  );
}
