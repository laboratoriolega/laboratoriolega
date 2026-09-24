"use client";

import { useState } from "react";
import { updateCobranza, createCobranza, deleteCobranza } from "@/actions/listados";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2, Save, X, Search, ChevronDown, CheckSquare } from "lucide-react";

type Tab = 'pendiente' | 'factura_instante' | 'finalizado';

const TAB_LABELS: Record<Tab, string> = {
  pendiente: 'Pendientes',
  factura_instante: 'Facturados al instante',
  finalizado: 'Finalizados',
};

const TAB_COLORS: Record<Tab, { bg: string; text: string; border: string }> = {
  pendiente: { bg: '#EF4444', text: 'white', border: '#EF4444' },
  factura_instante: { bg: '#0EA5E9', text: 'white', border: '#0EA5E9' },
  finalizado: { bg: '#10B981', text: 'white', border: '#10B981' },
};

function formatMethods(method: string | null | undefined): string {
  if (!method) return '';
  return method.split(',').filter(Boolean).join(' + ') || '';
}

function getItemTab(item: any): Tab {
  if (item.tipo === 'factura_instante') return 'factura_instante';
  if (item.tipo === 'finalizado' || item.seguimiento === 'Finalizado') return 'finalizado';
  return 'pendiente';
}

function AmountCell({ amount, method }: { amount: any; method: any }) {
  const amt = parseFloat(amount);
  const fmt = formatMethods(method);
  if (!amount && !fmt) return <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>;
  return (
    <div>
      {amount ? (
        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
          ${amt.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </div>
      ) : null}
      {fmt ? (
        <div style={{
          display: 'inline-block', marginTop: amount ? '0.2rem' : 0,
          padding: '0.1rem 0.45rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700,
          background: 'rgba(14,165,233,0.12)', color: 'var(--primary)', border: '1px solid rgba(14,165,233,0.25)'
        }}>{fmt}</div>
      ) : null}
    </div>
  );
}

export default function CobranzasTable({ data }: { data: any[] }) {
  const [items, setItems] = useState(data);
  const [activeTab, setActiveTab] = useState<Tab>('pendiente');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [showNewRow, setShowNewRow] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkNroFactura, setBulkNroFactura] = useState("");
  const [bulkObservacion, setBulkObservacion] = useState("");

  const counts: Record<Tab, number> = { pendiente: 0, factura_instante: 0, finalizado: 0 };
  items.forEach(it => counts[getItemTab(it)]++);

  const filtered = items.filter(it => {
    if (getItemTab(it) !== activeTab) return false;
    const s = searchTerm.toLowerCase();
    if (!s) return true;
    return (
      it.paciente?.toLowerCase().includes(s) ||
      it.observacion?.toLowerCase().includes(s) ||
      it.nro_factura?.toLowerCase().includes(s) ||
      (it.fecha ? format(new Date(it.fecha), "dd/MM/yyyy").includes(s) : false)
    );
  });

  const groups = filtered.reduce((acc: any, item: any) => {
    const month = item.month_group || 'sin-fecha';
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {});
  const sortedMonths = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  async function handleSave(id: number) {
    const updates = { ...editValues };
    // Auto-finalize when estado changes to FACTURADO
    if (updates.estado_factura === 'FACTURADO') {
      updates.tipo = 'finalizado';
      updates.seguimiento = 'Finalizado';
    }
    const res = await updateCobranza(id, updates);
    if (!res.error) {
      setItems(prev => prev.map(it => it.id === id ? { ...it, ...updates } : it));
      setEditingId(null);
    } else {
      alert(res.error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este registro?")) return;
    const res = await deleteCobranza(id);
    if (!res.error) setItems(prev => prev.filter(it => it.id !== id));
  }

  async function handleMoveToFinalizado(id: number) {
    const res = await updateCobranza(id, { tipo: 'finalizado', seguimiento: 'Finalizado' });
    if (!res.error) setItems(prev => prev.map(it => it.id === id ? { ...it, tipo: 'finalizado', seguimiento: 'Finalizado' } : it));
  }

  const toggleMonth = (month: string) => {
    setCollapsedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {(Object.keys(TAB_LABELS) as Tab[]).map(tab => {
          const active = activeTab === tab;
          const col = TAB_COLORS[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.6rem 1.4rem", borderRadius: "10px", fontSize: "0.88rem", fontWeight: 700,
                border: `1.5px solid ${col.border}`,
                background: active ? col.bg : `${col.bg}18`,
                color: active ? col.text : col.bg,
                display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.2s", cursor: "pointer"
              }}
            >
              {TAB_LABELS[tab]}
              <span style={{
                padding: "0.15rem 0.5rem", borderRadius: "6px",
                background: active ? "rgba(0,0,0,0.18)" : `${col.bg}30`,
                fontSize: "0.78rem", fontWeight: 800
              }}>
                {counts[tab]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + New */}
      <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", maxWidth: "300px", width: "100%" }}>
          <Search size={16} style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input type="text" placeholder="Buscar paciente, observación..." className="input-field" style={{ paddingLeft: "2.4rem" }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => setShowNewRow(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
          <Plus size={16} /> Nueva Facturación
        </button>
      </div>

      {/* New Record Form */}
      {showNewRow && (
        <form
          action={async (fd) => {
            const res = await createCobranza(fd);
            if (!res.error) window.location.reload();
          }}
          className="glass-panel"
          style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", alignItems: "end" }}
        >
          <input type="hidden" name="tipo" value={activeTab} />
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Fecha</label>
            <input name="fecha" type="date" required className="input-field" defaultValue={format(new Date(), "yyyy-MM-dd")} />
          </div>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Paciente</label>
            <input name="paciente" required className="input-field" placeholder="Nombre completo" />
          </div>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>DNI</label>
            <input name="dni" className="input-field" placeholder="DNI" />
          </div>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Nro. Factura</label>
            <input name="nro_factura" className="input-field" placeholder="001-0001" />
          </div>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Coseguro $</label>
            <input name="coseguro_amount" type="number" step="0.01" className="input-field" placeholder="0.00" />
          </div>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Particular $</label>
            <input name="particular_amount" type="number" step="0.01" className="input-field" placeholder="0.00" />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Observación</label>
            <input name="observacion" className="input-field" placeholder="Detalles adicionales..." />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar</button>
            <button type="button" onClick={() => setShowNewRow(false)} style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer", padding: "0.5rem" }}><X size={18} /></button>
          </div>
        </form>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && activeTab !== 'finalizado' && (
        <div className="glass-panel" style={{
          position: "sticky", top: "1rem", zIndex: 100, padding: "1rem 1.5rem",
          display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center",
          border: "2px solid var(--primary)", background: "var(--bg-gradient-end)",
          boxShadow: "0 8px 32px rgba(14,165,233,0.15)", borderRadius: "12px",
          animation: "fadeIn 0.2s ease"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ background: "rgba(14,165,233,0.15)", padding: "0.6rem", borderRadius: "8px", color: "var(--primary)" }}>
              <CheckSquare size={24} />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Seleccionados</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-main)" }}>{selectedIds.size} registros</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total a Facturar</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--primary)" }}>
              ${Array.from(selectedIds).reduce((acc, id) => {
                const item = items.find(it => it.id === id);
                return acc + (item?.total ? parseFloat(item.total) : 0);
              }, 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ width: "1px", height: "40px", background: "var(--glass-border)" }} />
          <div style={{ flex: 1, display: "flex", gap: "1rem", minWidth: "300px" }}>
            <input 
              placeholder="Nro. Factura (ej: 001-1234)" 
              className="input-field" 
              value={bulkNroFactura}
              onChange={e => setBulkNroFactura(e.target.value)}
              style={{ fontWeight: 600 }}
            />
            <input 
              placeholder="Observación (opcional)" 
              className="input-field" 
              style={{ flex: 1, fontWeight: 600 }}
              value={bulkObservacion}
              onChange={e => setBulkObservacion(e.target.value)}
            />
          </div>
          <button 
            className="btn-primary" 
            style={{ padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
            onClick={async () => {
              if (!confirm(`¿Facturar y finalizar los ${selectedIds.size} registros seleccionados?`)) return;
              const updates: any = { 
                 estado_factura: 'FACTURADO', 
                 tipo: 'finalizado', 
                 seguimiento: 'Finalizado' 
              };
              if (bulkNroFactura) updates.nro_factura = bulkNroFactura;
              if (bulkObservacion) updates.observacion = bulkObservacion;

              setEditingId(-1);
              try {
                await Promise.all(Array.from(selectedIds).map(id => updateCobranza(id, updates)));
                setItems(prev => prev.map(it => selectedIds.has(it.id) ? { ...it, ...updates } : it));
                setSelectedIds(new Set());
                setBulkNroFactura("");
                setBulkObservacion("");
              } catch (e) {
                alert("Error al procesar algunos registros");
              } finally {
                setEditingId(null);
              }
            }}
            disabled={editingId === -1}
          >
            {editingId === -1 ? 'Procesando...' : 'Facturar y Finalizar'}
          </button>
        </div>
      )}

      {/* Data Tables */}
      {sortedMonths.length > 0 ? sortedMonths.map(month => (
        <div key={month} className="glass-panel" style={{ overflow: "hidden", borderRadius: "16px" }}>
          {/* Month header */}
          <div 
            onClick={() => toggleMonth(month)}
            style={{ padding: "1rem 1.5rem", background: "var(--bg-gradient-end)", borderBottom: "1px solid var(--glass-border)", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", userSelect: "none" }}
          >
            <ChevronDown size={18} style={{ transform: collapsedMonths[month] ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-muted)' }} />
            <h4 style={{ margin: 0, fontSize: "1rem", textTransform: "capitalize", color: "var(--text-main)" }}>
              {month !== 'sin-fecha' ? format(new Date(month + "-02"), "MMMM yyyy", { locale: es }) : 'Sin fecha'}
            </h4>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
              {groups[month].length} {groups[month].length === 1 ? 'registro' : 'registros'}
            </span>
            <div style={{ flex: 1 }} />
            
            {activeTab !== 'finalizado' && (
              <label 
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', padding: '0.3rem 0.6rem', background: 'rgba(14,165,233,0.1)', borderRadius: '6px' }} 
                onClick={e => e.stopPropagation()}
              >
                <input type="checkbox" 
                  style={{ cursor: 'pointer', accentColor: 'var(--primary)', width: '14px', height: '14px' }}
                  checked={groups[month].length > 0 && groups[month].every((item: any) => selectedIds.has(item.id))}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    const newSet = new Set(selectedIds);
                    groups[month].forEach((item: any) => {
                      if (isChecked) newSet.add(item.id);
                      else newSet.delete(item.id);
                    });
                    setSelectedIds(newSet);
                  }}
                /> Selección Masiva
              </label>
            )}
          </div>

          {/* Cards layout */}
          {!collapsedMonths[month] && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {groups[month].map((item: any, idx: number) => {
              const isEditing = editingId === item.id;
              const isFacturado = item.estado_factura === 'FACTURADO';
              return (
                <div
                  key={item.id}
                  style={{
                    padding: "1.1rem 1.5rem",
                    borderBottom: idx < groups[month].length - 1 ? "1px solid var(--glass-border)" : "none",
                    background: selectedIds.has(item.id) ? "rgba(14,165,233,0.06)" : (isEditing ? "rgba(14,165,233,0.04)" : "transparent"),
                    transition: "background 0.2s",
                    display: "flex",
                    gap: "1rem"
                  }}
                >
                  {/* Checkbox column */}
                  {activeTab !== 'finalizado' && (
                    <div style={{ paddingTop: '0.35rem' }}>
                      <input 
                        type="checkbox" 
                        style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer', accentColor: 'var(--primary)' }}
                        checked={selectedIds.has(item.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedIds);
                          if (e.target.checked) newSet.add(item.id);
                          else newSet.delete(item.id);
                          setSelectedIds(newSet);
                        }}
                      />
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    {/* Row 1: date + patient + estado badge + actions */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", flexWrap: "wrap", flex: 1 }}>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap", fontWeight: 600 }}>
                        {item.fecha ? format(new Date(item.fecha), "dd/MM/yyyy") : '—'}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{item.paciente}</div>
                        {item.dni && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.dni}</div>}
                      </div>
                      {/* Estado badge */}
                      {!isEditing && (
                        <span style={{
                          padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700,
                          background: isFacturado ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)',
                          color: isFacturado ? '#10B981' : '#EF4444',
                          border: `1px solid ${isFacturado ? '#10B981' : '#EF4444'}`,
                          whiteSpace: "nowrap"
                        }}>
                          {item.estado_factura || 'NO FACTURADO'}
                        </span>
                      )}
                      {isEditing && (
                        <select
                          className="input-field"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.82rem", width: "auto" }}
                          defaultValue={item.estado_factura || 'NO FACTURADO'}
                          onChange={(e) => setEditValues({ ...editValues, estado_factura: e.target.value })}
                        >
                          <option value="NO FACTURADO">NO FACTURADO</option>
                          <option value="FACTURADO">FACTURADO</option>
                        </select>
                      )}
                    </div>
                    {/* Actions */}
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSave(item.id)} style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "white", background: "var(--success)", border: "none", padding: "0.35rem 0.8rem", borderRadius: "7px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}><Save size={14} /> Guardar</button>
                          <button onClick={() => setEditingId(null)} style={{ border: "1px solid var(--glass-border)", background: "none", padding: "0.35rem 0.6rem", borderRadius: "7px", cursor: "pointer", color: "var(--text-muted)" }}><X size={16} /></button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingId(item.id); setEditValues({ observacion: item.observacion, nro_factura: item.nro_factura, estado_factura: item.estado_factura }); }}
                            style={{ color: "var(--primary)", border: "1px solid rgba(14,165,233,0.3)", background: "rgba(14,165,233,0.08)", padding: "0.35rem 0.75rem", borderRadius: "7px", fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}
                          >
                            Editar
                          </button>
                          {activeTab !== 'finalizado' && (
                            <button
                              onClick={() => handleMoveToFinalizado(item.id)}
                              style={{ color: "#10B981", border: "1px solid #10B981", background: "rgba(16,185,129,0.08)", padding: "0.35rem 0.75rem", borderRadius: "7px", fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}
                            >
                              Finalizar
                            </button>
                          )}
                          <button onClick={() => handleDelete(item.id)} style={{ color: "var(--danger)", border: "none", background: "none", cursor: "pointer", padding: "0.35rem" }}><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Row 2: amounts + nro factura + observacion */}
                  <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
                    {/* Coseguro */}
                    <div style={{ minWidth: "110px" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Coseguro</div>
                      <AmountCell amount={item.coseguro_amount} method={item.coseguro_method} />
                    </div>
                    {/* Particular */}
                    <div style={{ minWidth: "110px" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Particular</div>
                      <AmountCell amount={item.particular_amount} method={item.particular_method} />
                    </div>
                    {/* Total */}
                    <div style={{ minWidth: "90px" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total</div>
                      <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--primary)" }}>
                        {item.total ? `$${parseFloat(item.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '—'}
                      </div>
                    </div>
                    {/* Nro Factura */}
                    <div style={{ minWidth: "120px" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Nro. Factura</div>
                      {isEditing ? (
                        <input className="input-field" style={{ padding: "0.3rem 0.5rem", fontSize: "0.85rem" }} defaultValue={item.nro_factura} onChange={(e) => setEditValues({ ...editValues, nro_factura: e.target.value })} placeholder="001-0001" />
                      ) : (
                        <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{item.nro_factura || '—'}</span>
                      )}
                    </div>
                    {/* Observacion */}
                    {(item.observacion || isEditing) && (
                      <div style={{ flex: 1, minWidth: "160px" }}>
                        <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Observación</div>
                        {isEditing ? (
                          <input className="input-field" style={{ padding: "0.3rem 0.5rem", fontSize: "0.85rem", width: "100%" }} defaultValue={item.observacion} onChange={(e) => setEditValues({ ...editValues, observacion: e.target.value })} />
                        ) : (
                          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{item.observacion}</span>
                        )}
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )) : (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", borderRadius: "16px" }}>
          No se encontraron registros en esta sección.
        </div>
      )}
    </div>
  );
}
