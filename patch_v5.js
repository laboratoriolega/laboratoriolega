const fs = require('fs');
let content = fs.readFileSync('src/components/PrestacionesDashboard.tsx', 'utf8');

// 1. Add getColumnLetter helper
if (!content.includes('const getColumnLetter')) {
  const insertIndex = content.indexOf('const updateHeaderColor');
  if (insertIndex > -1) {
    const helper = `
  const getColumnLetter = (idx: number) => {
    let temp, letter = '';
    let col = idx + 1;
    while (col > 0) {
      temp = (col - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      col = (col - temp - 1) / 26;
    }
    return letter;
  };

`;
    content = content.slice(0, insertIndex) + helper + content.slice(insertIndex);
  }
}

// 2. Add Row Number Header
const oldTheadRow = `<tr style={{ background: 'var(--glass-bg)', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                {(section.headers.length > 0 ? section.headers : columns).map((h: string) => {`;
const newTheadRow = `<tr style={{ background: 'var(--glass-bg)', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <th style={{ width: '40px', background: 'var(--glass-border)', position: 'sticky', left: 0, zIndex: 12, textAlign: 'center', color: 'var(--text-muted)' }}>#</th>
                {(section.headers.length > 0 ? section.headers : columns).map((h: string) => {`;
if (content.includes(oldTheadRow)) {
  content = content.replace(oldTheadRow, newTheadRow);
}

// 3. Add Column Letters & Fix TH
const oldThMap = `return (
                    <th key={h} style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-main)', borderBottom: '2px solid var(--primary)', whiteSpace: 'nowrap', backgroundColor: section.headerCellColors?.[h] || 'transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>`;
const newThMap = `
                  const validCols = (section.headers.length > 0 ? section.headers : columns).filter((c: string) => !(c === 'id' || c === 'sheet_name' || c === 'meta_part' || c.startsWith('__cell_color_') || c === '__row_color' || c === '__SECTION_PART__' || c.startsWith('__col_color_')));
                  const colIdx = validCols.indexOf(h);
                  return (
                    <th key={h} style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-main)', borderBottom: '2px solid var(--primary)', whiteSpace: 'nowrap', backgroundColor: section.headerCellColors?.[h] || 'transparent' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textAlign: 'center', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', padding: '2px 4px', width: 'fit-content', minWidth: '24px' }}>
                        {getColumnLetter(colIdx)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>`;
if (content.includes(oldThMap)) {
  content = content.replace(oldThMap, newThMap);
}

// 4. Add Row Number Body
const oldTrBody = `<tr 
                    key={row.id} 
                    draggable={editingRow === null}
                    onDragStart={(e) => handleDragStart(e, row.id)}
                    onDragOver={(e) => handleDragOver(e, row.id)}
                    onDrop={(e) => handleDrop(e, row.id)}
                    className={\`table-row-hover \${dragOverRowId === row.id ? 'drag-over' : ''}\`} 
                    style={{ borderBottom: '1px solid var(--glass-border)', backgroundColor: row.row_data.__row_color || (i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)') }}
                  >
                    {(section.headers.length > 0 ? section.headers : columns).map((h: string) => {`;

const newTrBody = `<tr 
                    key={row.id} 
                    draggable={editingRow === null}
                    onDragStart={(e) => handleDragStart(e, row.id)}
                    onDragOver={(e) => handleDragOver(e, row.id)}
                    onDrop={(e) => handleDrop(e, row.id)}
                    className={\`table-row-hover \${dragOverRowId === row.id ? 'drag-over' : ''}\`} 
                    style={{ borderBottom: '1px solid var(--glass-border)', backgroundColor: row.row_data.__row_color || (i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)') }}
                  >
                    <td style={{ width: '40px', background: 'var(--glass-border)', position: 'sticky', left: 0, zIndex: 5, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>
                      {i + 1}
                    </td>
                    {(section.headers.length > 0 ? section.headers : columns).map((h: string) => {`;
if (content.includes(oldTrBody)) {
  content = content.replace(oldTrBody, newTrBody);
}

// 5. Add Formula Preview & Fix Input Container
const oldInput = `<div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                              {isExcelSheet && <input type="color" title="Color de celda" value={editData[\`__cell_color_\${h}\`] || "#ffffff"} onChange={(e) => setEditData({ ...editData, [\`__cell_color_\${h}\`]: e.target.value })} style={{ width: '20px', height: '20px', padding: 0, border: 'none' }} />}
                              <input className="input-inline" value={editData[h] || ""} onChange={e => handleValueChange(h, e.target.value)} style={{ minWidth: isPrice ? '120px' : 'auto' }} />
                            </div>`;
                            
const newInput = `<div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                {isExcelSheet && <input type="color" title="Color de celda" value={editData[\`__cell_color_\${h}\`] || "#ffffff"} onChange={(e) => setEditData({ ...editData, [\`__cell_color_\${h}\`]: e.target.value })} style={{ width: '20px', height: '20px', padding: 0, border: 'none' }} />}
                                <input className="input-inline" value={editData[h] || ""} onChange={e => handleValueChange(h, e.target.value)} style={{ minWidth: isPrice ? '120px' : 'auto' }} />
                              </div>
                              {String(editData[h]).startsWith('=') && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '2px', fontWeight: 600 }}>
                                   = {formatWithTypes(row.row_data[h], section.types[h] || 'text')}
                                </div>
                              )}
                            </div>`;

if (content.includes(oldInput)) {
  content = content.replace(oldInput, newInput);
}

fs.writeFileSync('src/components/PrestacionesDashboard.tsx', content);
console.log('Patch complete.');
