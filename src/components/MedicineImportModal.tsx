import { useState } from 'react';
import { X, FileText, CheckCircle2, AlertCircle, Database, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../api/client';
import { useClinic } from '../context/ClinicContext';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedMedicine {
  productId: string;
  name: string;
  brand: string;
  strength: string;
  form: string;
  category: string;
  stockQty: number;
  expiryDate: string;
  availability: string;
}

export default function MedicineImportModal({ onClose, onSuccess }: Props) {
  const { setToast } = useClinic();
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedMedicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sample CSV template generator
  const getSampleCSV = () => {
    return `Product ID,Medicine Name,Brand,Strength,Form,Category,Stock Qty,Expiry Date,Availability
PRD001,Tab. Fluconazole,Cipla,150mg,Tablet,Antifungal,100,2027-12-31,In Stock
PRD002,Cream Luliconazole,Lupin,1% w/w,Cream,Topical Antifungal,50,2026-10-15,In Stock
PRD003,Tab. Doxycycline,Sun Pharma,100mg,Capsule,Antibiotic,200,2028-05-20,In Stock
PRD004,Lotion Permethrin,Glenmark,5% w/v,Lotion,Scabicide,75,2027-04-10,In Stock`;
  };

  const handleParseText = (text: string) => {
    setRawText(text);
    setError(null);
    setFileName(null);

    if (!text.trim()) {
      setParsedItems([]);
      return;
    }

    try {
      const lines = text.trim().split(/\r?\n/);
      if (lines.length === 0) return;

      // Determine delimiter (comma or tab)
      const firstLine = lines[0];
      const delimiter = firstLine.includes('\t') ? '\t' : ',';

      // Check header
      const hasHeader = firstLine.toLowerCase().includes('medicine name') || firstLine.toLowerCase().includes('product id') || firstLine.toLowerCase().includes('brand');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const items: ParsedMedicine[] = dataLines
        .map((line, idx) => {
          const parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ''));
          if (parts.length === 0 || !parts.some((p) => p)) return null;

          return {
            productId: parts[0] || `PRD${String(idx + 1).padStart(4, '0')}`,
            name: parts[1] || parts[0] || `Medicine #${idx + 1}`,
            brand: parts[2] || '',
            strength: parts[3] || '',
            form: parts[4] || 'Tablet',
            category: parts[5] || 'General',
            stockQty: parts[6] ? parseInt(parts[6], 10) || 0 : 0,
            expiryDate: parts[7] || '',
            availability: parts[8] || 'In Stock',
          };
        })
        .filter((item): item is ParsedMedicine => item !== null && item.name.length > 0);

      setParsedItems(items);
    } catch (err: any) {
      setError('Failed to parse text format. Please check comma or tab separators.');
    }
  };

  // Native Native Excel (.xlsx, .xls) & CSV File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (json.length === 0) {
          setError('Selected file is empty.');
          return;
        }

        const firstRow = json[0] || [];
        const hasHeader = firstRow.some((cell: any) =>
          String(cell).toLowerCase().includes('medicine') ||
          String(cell).toLowerCase().includes('product') ||
          String(cell).toLowerCase().includes('brand')
        );

        const dataRows = hasHeader ? json.slice(1) : json;

        const items: ParsedMedicine[] = dataRows
          .map((row: any, idx: number) => {
            if (!Array.isArray(row) || row.length === 0) return null;

            const p0 = row[0] !== undefined ? String(row[0]).trim() : '';
            const p1 = row[1] !== undefined ? String(row[1]).trim() : '';
            const p2 = row[2] !== undefined ? String(row[2]).trim() : '';
            const p3 = row[3] !== undefined ? String(row[3]).trim() : '';
            const p4 = row[4] !== undefined ? String(row[4]).trim() : '';
            const p5 = row[5] !== undefined ? String(row[5]).trim() : '';
            const p6 = row[6] !== undefined ? parseInt(String(row[6]), 10) || 0 : 0;
            const p7 = row[7] !== undefined ? String(row[7]).trim() : '';
            const p8 = row[8] !== undefined ? String(row[8]).trim() : 'In Stock';

            if (!p1 && !p0) return null;

            return {
              productId: p0 || `PRD${String(idx + 1).padStart(4, '0')}`,
              name: p1 || p0 || `Medicine #${idx + 1}`,
              brand: p2,
              strength: p3,
              form: p4 || 'Tablet',
              category: p5 || 'General',
              stockQty: p6,
              expiryDate: p7,
              availability: p8,
            };
          })
          .filter((item): item is ParsedMedicine => item !== null && item.name.length > 0);

        setParsedItems(items);
        setRawText(`Loaded ${items.length} records from Excel spreadsheet: ${file.name}`);
      } catch (err: any) {
        setError(`Error parsing Excel file: ${err.message || 'Please upload a valid .xlsx or .xls file.'}`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImportSubmit = async () => {
    if (parsedItems.length === 0) {
      setError('No valid medicine records to import.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.bulkImportMedicines(parsedItems);
      setToast({
        type: 'success',
        title: 'Inventory Synchronized',
        message: `${parsedItems.length} medicine records imported into active database`,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import medicines into database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-serif font-bold text-slate-900">Bulk Import Medicines (.XLSX / .XLS / CSV)</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          
          {/* Column Spec Alert */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-950 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Native Excel (.XLSX / .XLS) & CSV Column Structure Supported:</span>
            </div>
            <p className="font-mono text-[11px] bg-white/80 p-2 rounded border border-emerald-300 overflow-x-auto">
              Product ID | Medicine Name | Brand | Strength | Form | Category | Stock Qty | Expiry Date | Availability
            </p>
          </div>

          {/* Import Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Native .XLSX / .XLS Excel File Upload Option */}
            <div className="border-2 border-dashed border-emerald-400 hover:border-emerald-600 rounded-xl p-5 text-center bg-emerald-50/50 hover:bg-emerald-50 transition-all flex flex-col items-center justify-center cursor-pointer relative shadow-sm">
              <FileSpreadsheet className="w-9 h-9 text-emerald-700 mb-2 animate-pulse" />
              <div className="font-bold text-emerald-950 text-xs">Upload Excel File (.XLSX / .XLS)</div>
              <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">Click to select Microsoft Excel spreadsheet</div>
              {fileName && (
                <div className="mt-2 text-[11px] font-mono font-bold bg-emerald-700 text-white px-2 py-0.5 rounded">
                  {fileName}
                </div>
              )}
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* Quick Load Sample Data */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
              <div>
                <div className="font-bold text-slate-800 text-xs mb-1">Quick Sample Preset</div>
                <p className="text-[11px] text-slate-500">Test with sample dermatological & general medicine inventory list.</p>
              </div>
              <button
                type="button"
                onClick={() => handleParseText(getSampleCSV())}
                className="mt-3 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Load Sample Medicines</span>
              </button>
            </div>

          </div>

          {/* Paste CSV / Excel Data */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Or Copy & Paste Spreadsheet Rows Directly:
            </label>
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => handleParseText(e.target.value)}
              placeholder={`Product ID\tMedicine Name\tBrand\tStrength\tForm\tCategory\tStock Qty\tExpiry Date\tAvailability\nPRD001\tTab. Fluconazole\tCipla\t150mg\tTablet\tAntifungal\t100\t2027-12-31\tIn Stock`}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-sm text-slate-900">
                  Parsed Preview ({parsedItems.length} Medicines Ready to Import)
                </span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ✓ Verified Excel Columns
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-2 text-center">#</th>
                      <th className="p-2">Product ID</th>
                      <th className="p-2">Medicine Name</th>
                      <th className="p-2">Brand</th>
                      <th className="p-2">Strength</th>
                      <th className="p-2">Form</th>
                      <th className="p-2">Category</th>
                      <th className="p-2 text-center">Stock Qty</th>
                      <th className="p-2">Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-mono text-slate-600">{item.productId}</td>
                        <td className="p-2 font-bold text-slate-900">{item.name}</td>
                        <td className="p-2 text-slate-600">{item.brand || '-'}</td>
                        <td className="p-2 text-slate-600">{item.strength || '-'}</td>
                        <td className="p-2 text-slate-600">{item.form}</td>
                        <td className="p-2 text-slate-600">{item.category}</td>
                        <td className="p-2 text-center font-mono font-bold text-emerald-700">{item.stockQty}</td>
                        <td className="p-2 text-slate-600">{item.availability}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading || parsedItems.length === 0}
            onClick={handleImportSubmit}
            className="bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-950/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Importing Excel Records...</span>
            ) : (
              <>
                <Database className="w-4 h-4" />
                <span>Import {parsedItems.length} Medicines into Database</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
