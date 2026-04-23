"use client";

import { useState, useEffect, useMemo } from "react";
import { getPrestacionesBySheet, updatePrestacion, addPrestacion, deletePrestacion } from "@/actions/prestaciones";
import { Search, Plus, Save, Trash2, Edit2, Loader2, ChevronRight, Table, FileSpreadsheet } from "lucide-react";

export default function PrestacionesDashboard({ initialSheets }: { initialSheets: string[] }) {
  const [activeSheet, setActiveSheet] = useState(initialSheets[0] || "");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  // Get dynamic columns from the row_data of the first row
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    // Get all unique keys from all rows to be safe, but usually first row is enough
    const keys = new Set<string>();
    data.forEach(row => {
      Object.keys(row.row_data).forEach(k => {
        if (k !== 'id' && k !== 'sheet_name') keys.add(k);
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
    // Basic heuristics for formulas detected in the Excel
    if (sheet === 'O. SOCIALES ' && updated['NBU'] && updated['COSTO DERIVACION']) {
      const g = parseFloat(updated['NBU']) || 0;
      const c = parseFloat(updated['COSTO DERIVACION']) || 0;
      updated['COBERTURA OBRA SOCIAL '] = g - c;
    }
    
    // Pattern: "ACTUALIZADO" is usually 1.25x or 1.3x of "Importe" or "Costo"
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

  const handleAdd = async () => {
    if (!activeSheet) return;
    const newRow = columns.reduce((acc: any, col) => ({ ...acc, [col]: "" }), {});
    setIsSaving(true);
    const res = await addPrestacion(activeSheet, newRow);
    if (res.success) {
      loadSheetData(activeSheet);
    } else {
      alert("Error al agregar fila");
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

  const formatValue = (val: any) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
    }
    return val || "-";
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100vh', padding: '1rem' }}>
      
      {/* Header & Search */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <FileSpreadsheet size={32} color="var(--primary)" /> Módulo de Prestaciones
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Gestión dinámica de tarifarios y convenios</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              type="text" 
              placeholder="Buscar en esta hoja..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="modern-input"
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
          </div>
          <button className="btn-primary" onClick={handleAdd} disabled={isSaving}>
            <Plus size={18} /> Nueva Fila
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
        {initialSheets.map(sheet => (
          <button
            key={sheet}
            onClick={() => setActiveSheet(sheet)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '12px 12px 0 0',
              background: activeSheet === sheet ? 'var(--primary)' : 'rgba(0,0,0,0.05)',
              color: activeSheet === sheet ? 'white' : 'var(--text-muted)',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              fontSize: '0.85rem'
            }}
          >
            {sheet}
          </button>
        ))}
      </div>

      {/* Table Area */}
      <div className="glass-panel" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
            <p>Cargando datos de la hoja...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead style={{ background: 'var(--glass-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  {columns.map(col => (
                    <th key={col} style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {col}
                    </th>
                  ))}
                  <th style={{ padding: '1rem', width: '100px', borderBottom: '2px solid var(--glass-border)' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--glass-border)', background: editingRow === row.id ? 'rgba(14, 165, 233, 0.05)' : 'transparent' }}>
                    {columns.map(col => (
                      <td key={col} style={{ padding: '0.75rem 1rem' }}>
                        {editingRow === row.id ? (
                          <input 
                            type="text"
                            value={editData[col] || ""}
                            onChange={(e) => handleValueChange(col, e.target.value)}
                            style={{ 
                              width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--primary)',
                              fontSize: '0.85rem', background: 'white'
                            }}
                          />
                        ) : (
                          <span style={{ 
                            fontWeight: col.includes("Importe") || col.includes("Costo") ? 700 : 400,
                            color: col.includes("Importe") || col.includes("Costo") ? 'var(--primary)' : 'inherit'
                          }}>
                            {formatValue(row.row_data[col])}
                          </span>
                        )}
                      </td>
                    ))}
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {editingRow === row.id ? (
                          <button onClick={() => handleSave(row.id)} disabled={isSaving} style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}>
                            <Save size={14} />
                          </button>
                        ) : (
                          <button onClick={() => handleEdit(row)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <Edit2 size={14} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(row.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.6 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No se encontraron resultados en esta hoja.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .modern-input {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 0.6rem 1rem;
          font-size: 0.9rem;
          color: var(--text-main);
          transition: all 0.2s;
        }
        .modern-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
          background: white;
        }
        .glass-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          box-shadow: var(--glass-shadow);
        }
        .btn-primary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.3);
        }
      `}</style>
    </div>
  );
}
