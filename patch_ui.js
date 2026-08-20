const fs = require('fs');
const file = 'src/components/PrestacionesDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add States
content = content.replace(
  'const [expandedMonths, setExpandedMonths] = useState<{[key: string]: boolean}>({});',
  'const [expandedMonths, setExpandedMonths] = useState<{[key: string]: boolean}>({});\n  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);\n  const [newMonthTitle, setNewMonthTitle] = useState("");\n  const [newMonthNote, setNewMonthNote] = useState("");'
);

// 2. Add updateHeaderColor function
const fnAdd = `
  const updateHeaderColor = async (headerRowId: number, colKey: string, color: string, type: 'cell' | 'col') => {
    const headerRow = data.find(r => r.id === headerRowId);
    if (!headerRow) return;
    const updatedRowData = { ...headerRow.row_data };
    if (type === 'cell') {
        updatedRowData[\`__cell_color_\${colKey}\`] = color;
    } else {
        updatedRowData[\`__col_color_\${colKey}\`] = color;
    }
    const res = await fetch(\`/api/doc/\${headerRowId}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row_data: updatedRowData })
    });
    if (res.ok) {
        setData(prev => prev.map(r => r.id === headerRowId ? { ...r, row_data: updatedRowData } : r));
    }
  };

  const handleCreateMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonthTitle) return;
    setIsSaving(true);
    const rd = { "__EMPTY": newMonthTitle.toUpperCase(), "meta_part": "MONTH_TITLE", "__EMPTY_1": newMonthNote };
    await handleAddRow('Federacion-PAMI', rd, undefined);
    setIsMonthModalOpen(false);
    setNewMonthTitle('');
    setNewMonthNote('');
    setIsSaving(false);
  };
`;
content = content.replace('const renderSectionedView = () => {', fnAdd + '\n  const renderSectionedView = () => {');

// 3. Fix month parsing and col colors
content = content.replace(
  'let currentMonthId: number | null = null;',
  'let currentMonthId: number | null = null;\n    let currentMonthNote: string = "";'
);
content = content.replace(
  'currentMonth = String(mainVal).trim();\n        currentMonthId = row.id;',
  'currentMonth = String(mainVal).trim();\n        currentMonthId = row.id;\n        currentMonthNote = rd["__EMPTY_1"] && rd["__EMPTY_1"] !== "NBU" ? rd["__EMPTY_1"] : "";'
);
content = content.replace(
  'monthId: currentMonthId',
  'monthId: currentMonthId,\n          monthNote: currentMonthNote'
);
content = content.replace(
  'currentSection.headers.forEach((h: string) => currentSection.labels[h] = rd[h]);',
  'currentSection.headers.forEach((h: string) => currentSection.labels[h] = rd[h]);\n          currentSection.colColors = {};\n          currentSection.headerCellColors = {};\n          currentSection.headers.forEach((h: string) => {\n             if (rd[`__col_color_${h}`]) currentSection.colColors[h] = rd[`__col_color_${h}`];\n             if (rd[`__cell_color_${h}`]) currentSection.headerCellColors[h] = rd[`__cell_color_${h}`];\n          });'
);

// 4. Update the <th> mapping in renderSection
const oldTh = `{(section.headers.length > 0 ? section.headers : columns).map((h: string) => {
                  if (h === 'id' || h === 'sheet_name' || h === 'meta_part' || h.startsWith('__cell_color_') || h === '__row_color' || h === '__SECTION_PART__') return null;
                  return (
                    <th key={h} style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-main)', borderBottom: '2px solid var(--primary)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {editingRow && isExcelSheet && (
                          <input 
                            type="color" 
                            title="Color de columna" 
                            value={editData?.[\\\`__cell_color_\${h}\\\`] || "#ffffff"} 
                            onChange={(e) => setEditData({ ...editData, [\\\`__cell_color_\${h}\\\`]: e.target.value })} 
                            style={{ width: '16px', height: '16px', padding: 0, border: 'none', cursor: 'pointer' }} 
                          />
                        )}
                        {section.labels[h] || h}
                      </div>
                    </th>
                  );
                })}`;

const newTh = `{(section.headers.length > 0 ? section.headers : columns).map((h: string) => {
                  if (h === 'id' || h === 'sheet_name' || h === 'meta_part' || h.startsWith('__cell_color_') || h === '__row_color' || h === '__SECTION_PART__' || h.startsWith('__col_color_')) return null;
                  return (
                    <th key={h} style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-main)', borderBottom: '2px solid var(--primary)', whiteSpace: 'nowrap', backgroundColor: section.headerCellColors?.[h] || 'transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isExcelSheet && (
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <input 
                              type="color" 
                              title="Color del nombre (celda)" 
                              value={section.headerCellColors?.[h] || "#ffffff"} 
                              onChange={(e) => updateHeaderColor(section.structuralIds.header, h, e.target.value, 'cell')} 
                              style={{ width: '14px', height: '14px', padding: 0, border: 'none', cursor: 'pointer' }} 
                            />
                            <input 
                              type="color" 
                              title="Color de TODA la columna" 
                              value={section.colColors?.[h] || "#ffffff"} 
                              onChange={(e) => updateHeaderColor(section.structuralIds.header, h, e.target.value, 'col')} 
                              style={{ width: '14px', height: '14px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '50%' }} 
                            />
                          </div>
                        )}
                        {section.labels[h] || h}
                      </div>
                    </th>
                  );
                })}`;

content = content.replace(oldTh, newTh);

// 5. Update row rendering to apply colColor
const oldTd = `{(section.headers.length > 0 ? section.headers : columns).map((h: string) => {
                      if (h === 'id' || h === 'sheet_name' || h === 'meta_part' || h.startsWith('__cell_color_') || h === '__row_color' || h === '__SECTION_PART__') return null;
                      const cellColor = row.row_data[\`__cell_color_\${h}\`];
                      const isPrice = section.types[h] === 'price';
                      const isDescriptionCol = h === '__EMPTY' || h === '__EMPTY_1' && section.headers.includes('__EMPTY_1');
                      return (
                        <td key={h} style={{ padding: '0.85rem 1rem', border: '1px solid var(--glass-border)', background: cellColor || 'transparent' }}>`;

const newTd = `{(section.headers.length > 0 ? section.headers : columns).map((h: string) => {
                      if (h === 'id' || h === 'sheet_name' || h === 'meta_part' || h.startsWith('__cell_color_') || h === '__row_color' || h === '__SECTION_PART__' || h.startsWith('__col_color_')) return null;
                      const cellColor = row.row_data[\`__cell_color_\${h}\`];
                      const colColor = section.colColors?.[h];
                      const finalBg = cellColor || colColor || 'transparent';
                      const isPrice = section.types[h] === 'price';
                      const isDescriptionCol = h === '__EMPTY' || h === '__EMPTY_1' && section.headers.includes('__EMPTY_1');
                      return (
                        <td key={h} style={{ padding: '0.85rem 1rem', border: '1px solid var(--glass-border)', background: finalBg }}>`;

content = content.replace(oldTd, newTd);

// 6. Update Accordion header to show note
const oldAcc = `<h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '8px', height: '24px', background: 'var(--primary)', borderRadius: '4px' }}></div>
                {month}
              </h2>`;

const newAcc = `<h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '8px', height: '24px', background: 'var(--primary)', borderRadius: '4px' }}></div>
                {month}
                {groupedByMonth[month][0]?.monthNote && (
                   <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '1rem', fontStyle: 'italic' }}>
                     {groupedByMonth[month][0].monthNote}
                   </span>
                )}
              </h2>`;

content = content.replace(oldAcc, newAcc);

// 7. Update Nuevo Mes button
const oldNuevo = `<button 
                  className="btn-secondary" 
                  onClick={() => handleAddRow('Federacion-PAMI', { "__EMPTY": "NUEVO MES", "meta_part": "MONTH_TITLE", "__EMPTY_1": "NBU" }, undefined)} 
                  disabled={isSaving}
                >
                  <Plus size={18} /> Nuevo Mes
                </button>`;
                
const newNuevo = `<button 
                  className="btn-primary" 
                  onClick={() => setIsMonthModalOpen(true)} 
                  disabled={isSaving}
                >
                  <Plus size={18} /> Nuevo Mes
                </button>`;

content = content.replace(oldNuevo, newNuevo);

// 8. Add Month Modal
const modalJSX = `
      {isMonthModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content glass-panel" style={{ background: 'white', padding: '2rem', borderRadius: '24px', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)' }}>Crear Nuevo Mes</h2>
            <form onSubmit={handleCreateMonth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>Nombre del Mes</label>
                <input type="text" className="modern-input" placeholder="Ej: ENERO 2027" value={newMonthTitle} onChange={e => setNewMonthTitle(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>Descripción / Nota (Opcional)</label>
                <input type="text" className="modern-input" placeholder="Ej: Valores actualizados al..." value={newMonthNote} onChange={e => setNewMonthNote(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsMonthModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '0.75rem' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.75rem' }} disabled={isSaving}>Crear Mes</button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

content = content.replace('</ShellLayout>', modalJSX + '\n    </ShellLayout>');

fs.writeFileSync(file, content);
console.log('Successfully patched UI!');
