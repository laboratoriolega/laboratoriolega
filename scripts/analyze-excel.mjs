import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const filePath = path.join(process.cwd(), 'public', 'Listado de Prestaciones OK.xlsx');

async function analyzeExcel() {
  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    return;
  }

  const workbook = XLSX.readFile(filePath, { cellFormula: true });
  const sheetNames = workbook.SheetNames;

  console.log("Sheet Names:", sheetNames);

  const analysis = sheetNames.map(name => {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Find formulas
    const formulas = [];
    Object.keys(sheet).forEach(ref => {
      if (ref[0] === '!') return;
      const cell = sheet[ref];
      if (cell.f) {
        formulas.push({ ref, formula: cell.f, value: cell.v });
      }
    });

    return {
      name,
      rowCount: data.length,
      headers: data[0] || [],
      sample: data.slice(1, 4),
      formulaCount: formulas.length,
      sampleFormulas: formulas.slice(0, 5)
    };
  });

  console.log(JSON.stringify(analysis, null, 2));
}

analyzeExcel();
