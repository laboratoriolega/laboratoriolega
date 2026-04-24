export interface GridData {
  rows: any[]; 
  columns: string[]; 
}

export function evaluateGrid(grid: GridData): any[] {
  const { rows, columns } = grid;
  
  const cache = new Map<string, number>();
  const inProgress = new Set<string>();

  const getCellValue = (colIdx: number, rowIdx: number): number => {
    if (rowIdx < 0 || rowIdx >= rows.length || colIdx < 0 || colIdx >= columns.length) {
      return 0;
    }
    const cacheKey = `${colIdx},${rowIdx}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey)!;
    if (inProgress.has(cacheKey)) return 0; // Circular reference protection
    
    inProgress.add(cacheKey);
    const row = rows[rowIdx];
    const colKey = columns[colIdx];
    const rawVal = row.row_data ? row.row_data[colKey] : row[colKey];
    
    let result = 0;
    if (typeof rawVal === 'string' && rawVal.startsWith('=')) {
       const res = evaluateFormula(rawVal, getCellValue);
       result = typeof res === 'number' ? res : 0;
    } else {
       result = parseNumberValue(rawVal);
    }
    
    cache.set(cacheKey, result);
    inProgress.delete(cacheKey);
    return result;
  };

  const evaluatedRows = rows.map((row, rowIdx) => {
    // We only process structured data rows, or any row. 
    // In our app, row_data contains the editable fields.
    const newRowData = { ...(row.row_data || row) };
    const rawRowData = { ...(row.row_data || row) };
    let hasFormulas = false;
    
    columns.forEach((colKey, colIdx) => {
      const rawVal = newRowData[colKey];
      if (typeof rawVal === 'string' && rawVal.startsWith('=')) {
        hasFormulas = true;
        newRowData[colKey] = getCellValue(colIdx, rowIdx);
      }
    });
    
    return {
       ...row,
       row_data: newRowData,
       _raw_formulas: hasFormulas ? rawRowData : undefined
    };
  });

  return evaluatedRows;
}

export function evaluateFormula(formula: string, getCellValue: (colIdx: number, rowIdx: number) => number): any {
  if (!formula || typeof formula !== 'string' || !formula.startsWith('=')) {
    return formula;
  }

  try {
    let expression = formula.substring(1).toUpperCase();

    // Reemplazar decimales españoles en literales: 0,9 -> 0.9
    expression = expression.replace(/(\d),(\d)/g, '$1.$2');

    // Quitar absolutos
    expression = expression.replace(/\$/g, '');

    // Expandir rangos SUMA(A1:A5)
    expression = expression.replace(/(SUMA|SUM)\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/g, (match, fn, startColStr, startRowStr, endColStr, endRowStr) => {
      const startCol = colToIndex(startColStr);
      const startRow = parseInt(startRowStr, 10);
      const endCol = colToIndex(endColStr);
      const endRow = parseInt(endRowStr, 10);

      const cells = [];
      for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
        for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
          cells.push(`${indexToCol(c)}${r}`);
        }
      }
      return `(${cells.join('+')})`;
    });

    // SUMA(x) -> (x)
    expression = expression.replace(/(SUMA|SUM)\(([^)]+)\)/g, '($2)');

    // Reemplazar celdas A1 -> getCellValue
    let hasUnresolved = false;
    expression = expression.replace(/[A-Z]+\d+/g, (match) => {
      const colStr = match.match(/[A-Z]+/)![0];
      const rowStr = match.match(/\d+/)![0];
      const colIdx = colToIndex(colStr);
      const rowIdx = parseInt(rowStr, 10) - 1; // 0-based

      const val = getCellValue(colIdx, rowIdx);
      if (val === null || isNaN(val)) {
        hasUnresolved = true;
        return "0";
      }
      return val < 0 ? `(${val})` : String(val);
    });

    if (hasUnresolved) {
      return "#ERROR";
    }

    // Permitir solo math segura
    if (!/^[0-9.+\-*/() ]+$/.test(expression)) {
      return "#ERROR";
    }

    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${expression}`)();
    
    if (!isFinite(result)) return "#DIV/0!";
    return result;
  } catch (error) {
    console.error("Formula error:", formula, error);
    return "#ERROR";
  }
}

export function parseNumberValue(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let s = String(val).trim();
  if (s === '') return 0;
  
  let isPercent = false;
  if (s.endsWith('%')) {
    isPercent = true;
    s = s.slice(0, -1).trim();
  }
  
  s = s.replace(/\$/g, '').trim();
  if (/^-?\d+(\.\d+)?$/.test(s)) {
     const n = parseFloat(s);
     return isPercent ? n / 100 : n;
  }
  
  s = s.replace(/\./g, '').replace(/,/g, '.');
  const num = parseFloat(s);
  if (isNaN(num)) return 0;
  return isPercent ? num / 100 : num;
}

export function colToIndex(colStr: string): number {
  let index = 0;
  for (let i = 0; i < colStr.length; i++) {
    index = index * 26 + (colStr.charCodeAt(i) - 64);
  }
  return index - 1;
}

export function indexToCol(index: number): string {
  let colStr = '';
  let n = index + 1;
  while (n > 0) {
    let r = (n - 1) % 26;
    colStr = String.fromCharCode(65 + r) + colStr;
    n = Math.floor((n - 1) / 26);
  }
  return colStr;
}
