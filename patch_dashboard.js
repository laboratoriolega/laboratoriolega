const fs = require('fs');

const file = 'src/components/PrestacionesDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add state to the top
content = content.replace(
  'const [editingSectionData, setEditingSectionData] = useState<any>(null);',
  'const [editingSectionData, setEditingSectionData] = useState<any>(null);\n  const [expandedMonths, setExpandedMonths] = useState<{[key: string]: boolean}>({});'
);

// We'll replace the renderSectionedView function completely.
const newRenderSectionedView = `
  const renderSectionedView = () => {
    const rawSections: any[] = [];
    let currentSection: any = null;
    let currentMonth: string | null = null;
    let currentMonthId: number | null = null;

    evaluatedData.forEach((row) => {
      const rd = row.row_data;
      const part = rd["meta_part"] || rd["__SECTION_PART__"];
      const entries = Object.entries(rd);
      const internalKeys = ['id', 'sheet_name', 'meta_part', '__SECTION_PART__', '__row_color'];
      const isInternalKey = (k: string) => internalKeys.includes(k) || k.startsWith('__cell_color_') || k.startsWith('__SECTION_');
      const textValues = entries.filter(([k, v]) => v !== null && String(v).trim() !== '' && !isInternalKey(k)).map(([_, v]) => v);

      const mainKey = Object.keys(rd).find(k => k === "__EMPTY" || k.toLowerCase().includes("laboratorio")) || Object.keys(rd)[0];
      const mainVal = mainKey ? rd[mainKey] : null;

      const isForcedMonth = part === "MONTH_TITLE";
      const isForcedTitle = part === "TITLE";
      const isForcedSubtitle = part === "SUBTITLE";
      const isForcedMetadata = part === "METADATA";
      const isForcedHeader = part === "HEADER";
      const isForcedNote = part === "NOTE";
      const isForcedData = part === "DATA";

      const isHeuristicTitle = !part && mainVal && textValues.length === 1 &&
        !String(mainVal).includes("NOTA:") && !String(mainVal).includes("Valores") && !String(mainVal).includes("actualizados") &&
        !String(mainVal).includes("Prestación") && mainVal !== "__METADATA__";

      if (isForcedMonth) {
        currentMonth = String(mainVal).trim();
        currentMonthId = row.id;
      } else if (isForcedTitle || isHeuristicTitle) {
        currentSection = {
          title: mainVal, subtitle: "", headers: [], labels: {}, types: {}, rows: [], note: "", allIds: [row.id],
          structuralIds: { title: row.id, subtitle: null, metadata: null, header: null, note: null },
          month: currentMonth,
          monthId: currentMonthId
        };
        rawSections.push(currentSection);
      } else if (currentSection) {
        currentSection.allIds.push(row.id);
        if (isForcedSubtitle || (!part && (String(mainVal).includes("Valores") || String(mainVal).includes("actualizados")))) {
          currentSection.subtitle = mainVal;
          currentSection.structuralIds.subtitle = row.id;
        } else if (isForcedMetadata || mainVal === "__METADATA__") {
          currentSection.structuralIds.metadata = row.id;
          Object.keys(rd).forEach(k => { if (!isInternalKey(k)) currentSection.types[k] = rd[k]; });
          if (isExcelSheet) {
             let priceCols: string[] = [];
             if (activeSheet === "Delgado") {
               priceCols = ["__EMPTY_1", "__EMPTY_3", "__EMPTY_4", "__EMPTY_5", "__EMPTY_6", "__EMPTY_7", "__EMPTY_8", "__EMPTY_9"];
             } else if (activeSheet === "Cotizador") {
               priceCols = ["__EMPTY_1", "__EMPTY_4", "__EMPTY_5", "__EMPTY_6", "__EMPTY_7", "__EMPTY_8"];
             } else if (activeSheet === "Federacion-PAMI") {
               priceCols = ["__EMPTY_1", "__EMPTY_2", "__EMPTY_3", "__EMPTY_4", "__EMPTY_5", "__EMPTY_6", "__EMPTY_7"];
             }
             priceCols.forEach(c => currentSection.types[c] = "price");
          }
        } else if (isForcedHeader || (!part && (String(mainVal).includes("Prestaciones") || String(mainVal).includes("Nombre")))) {
          currentSection.structuralIds.header = row.id;
          currentSection.headers = Object.keys(rd).filter(k => !isInternalKey(k) && (rd[k] || k === mainKey));
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
      if (String(section.title).toLowerCase().includes(lowerSearch)) return true;
      if (section.subtitle && String(section.subtitle).toLowerCase().includes(lowerSearch)) return true;
      return section.rows.some((row: any) => Object.values(row.row_data).some(v => String(v).toLowerCase().includes(lowerSearch)));
    });

    if (filteredSections.length === 0) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron resultados.</div>;

    const renderSection = (section: any, idx: number) => (
      <div key={idx} className="section-block" style={{ background: 'var(--glass-bg)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '1.5rem 0', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>{section.title}</h3>
            {section.subtitle && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 600 }}>{section.subtitle}</p>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => openEditModal(section)} className="btn-small-secondary"><Settings size={14} /> <span>Editar Tabla</span></button>
            <button
              onClick={() => {
                const lastId = section.rows.length > 0
                  ? section.rows[section.rows.length - 1].id
                  : (section.structuralIds.note || section.structuralIds.header || section.structuralIds.subtitle || section.structuralIds.title);
                handleAddRow(activeSheet, { "__EMPTY": "Nueva Prestación...", "meta_part": "DATA" }, lastId);
              }}
              className="btn-small-primary"
            >
              <Plus size={14} /> <span>Agregar Fila</span>
            </button>
            <button onClick={() => handleDeleteSection(section.allIds)} className="btn-small-danger"><Trash2 size={14} /> <span>Eliminar Tabla</span></button>
          </div>
        </div>

        <div className="custom-scrollbar" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '70vh', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', position: 'relative' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: 'var(--glass-bg)', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                {(section.headers.length > 0 ? section.headers : columns).map((h: string) => {
                  if (h === 'id' || h === 'sheet_name' || h === 'meta_part' || h.startsWith('__cell_color_') || h === '__row_color' || h === '__SECTION_PART__') return null;
                  return <th key={h} style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-main)', borderBottom: '2px solid var(--primary)', whiteSpace: 'nowrap' }}>{section.labels[h] || h}</th>;
                })}
                <th style={{ position: 'sticky', right: 0, background: 'var(--glass-bg)', borderBottom: '2px solid var(--primary)', zIndex: 11 }}></th>
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row: any, i: number) => {
                const type = section.types[row] || 'text';
                return (
                  <tr key={row.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--glass-border)', backgroundColor: row.row_data.__row_color || (i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)') }}>
                    {(section.headers.length > 0 ? section.headers : columns).map((h: string) => {
                      if (h === 'id' || h === 'sheet_name' || h === 'meta_part' || h.startsWith('__cell_color_') || h === '__row_color' || h === '__SECTION_PART__') return null;
                      const cellColor = row.row_data[\`__cell_color_\${h}\`];
                      const isPrice = section.types[h] === 'price';
                      const isDescriptionCol = h === '__EMPTY' || h === '__EMPTY_1' && section.headers.includes('__EMPTY_1');
                      return (
                        <td key={h} style={{ padding: '0.85rem 1rem', border: '1px solid var(--glass-border)', background: cellColor || 'transparent' }}>
                          {editingRow === row.id ? (
                            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                              {isExcelSheet && <input type="color" title="Color de celda" value={editData[\`__cell_color_\${h}\`] || "#ffffff"} onChange={(e) => setEditData({ ...editData, [\`__cell_color_\${h}\`]: e.target.value })} style={{ width: '20px', height: '20px', padding: 0, border: 'none' }} />}
                              <input className="input-inline" value={editData[h] || ""} onChange={e => handleValueChange(h, e.target.value)} style={{ minWidth: isPrice ? '120px' : 'auto' }} />
                            </div>
                          ) : (
                            <span style={{ fontWeight: isDescriptionCol ? 600 : 400, fontFamily: isPrice ? 'Courier New, monospace' : 'inherit' }}>{formatWithTypes(row.row_data[h], section.types[h] || 'text')}</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'right', padding: '0.5rem 1rem', border: '1px solid var(--glass-border)', background: 'var(--table-sticky-bg)', position: 'sticky', right: 0, zIndex: 5 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {editingRow === row.id && isExcelSheet && (
                          <input type="color" title="Color de fila" value={editData?.__row_color || "#ffffff"} onChange={(e) => setEditData({ ...editData, __row_color: e.target.value })} style={{ width: '24px', height: '24px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                        )}
                        {editingRow === row.id ? <button onClick={() => handleSave(row.id)} className="btn-action save" style={{ color: 'var(--success)' }}><Save size={16} /></button> : <button onClick={() => handleEdit(row)} className="btn-action edit" style={{ color: 'var(--primary)' }}><Edit2 size={16} /></button>}
                        <button onClick={() => handleDelete(row.id)} className="btn-action delete" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {section.note && (
          <div style={{ padding: '1.25rem', margin: '1.5rem', background: 'var(--bg-gradient-end)', borderRadius: '12px', border: '1.5px solid var(--glass-border)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', marginTop: '2px' }}>[NOTA:]</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.5 }}>{section.note}</div>
          </div>
        )}
      </div>
    );

    const groupedByMonth: { [month: string]: any[] } = {};
    const noMonthSections: any[] = [];

    filteredSections.forEach(section => {
      if (section.month) {
        if (!groupedByMonth[section.month]) groupedByMonth[section.month] = [];
        groupedByMonth[section.month].push(section);
      } else {
        noMonthSections.push(section);
      }
    });

    const toggleMonth = (month: string) => {
      setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {noMonthSections.map((section, idx) => renderSection(section, idx))}

        {Object.keys(groupedByMonth).map(month => (
          <div key={month} style={{ border: '1px solid var(--glass-border)', borderRadius: '16px', background: 'var(--glass-bg)', overflow: 'hidden' }}>
            <div 
              onClick={() => toggleMonth(month)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', cursor: 'pointer', background: expandedMonths[month] ? 'rgba(14, 165, 233, 0.05)' : 'transparent', transition: 'background 0.2s' }}
            >
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '8px', height: '24px', background: 'var(--primary)', borderRadius: '4px' }}></div>
                {month}
              </h2>
              <div style={{ color: 'var(--primary)', fontWeight: 700 }}>
                {expandedMonths[month] ? 'Ocultar ▲' : 'Ver Detalles ▼'}
              </div>
            </div>
            
            {expandedMonths[month] && (
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '3rem', borderTop: '1px solid var(--glass-border)' }}>
                {groupedByMonth[month].map((section, idx) => renderSection(section, idx))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
`;

const startIndex = content.indexOf('  const renderSectionedView = () => {');
const endIndex = content.indexOf('  // Búsqueda cruzada dentro del tab Cotizador');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newRenderSectionedView + '\n' + content.substring(endIndex);
  fs.writeFileSync(file, content);
  console.log('Successfully patched renderSectionedView!');
} else {
  console.log('Error: Could not find markers.');
}
