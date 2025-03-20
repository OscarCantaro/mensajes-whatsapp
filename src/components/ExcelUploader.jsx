import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

// Create a global store to share data between components
if (typeof window !== 'undefined' && !window.appStore) {
  window.appStore = {
    excelData: null,
    messageTemplate: '',
    selectedColumn: '',
    setExcelData: (data) => {
      window.appStore.excelData = data;
      window.dispatchEvent(new CustomEvent('excelDataChanged', { detail: data }));
    },
    setMessageTemplate: (template) => {
      window.appStore.messageTemplate = template;
      window.dispatchEvent(new CustomEvent('messageTemplateChanged', { detail: template }));
    },
    setSelectedColumn: (column) => {
      window.appStore.selectedColumn = column;
      window.dispatchEvent(new CustomEvent('selectedColumnChanged', { detail: column }));
    }
  };
}

const ExcelUploader = () => {
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      setError('Por favor, seleccione un archivo Excel válido (.xlsx, .xls) o CSV');
      return;
    }

    setFileName(file.name);
    setIsUploading(true);
    setError('');

    try {
      const data = await readExcelFile(file);
      window.appStore.setExcelData(data);
      setIsUploading(false);
    } catch (err) {
      setError('Error al procesar el archivo: ' + err.message);
      setIsUploading(false);
    }
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Process the data
          if (jsonData.length < 2) {
            throw new Error('El archivo no contiene suficientes datos');
          }
          
          // Extract headers (first row)
          const headers = jsonData[0];
          
          // Create array of objects with the data
          const rows = jsonData.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });
          
          resolve({ headers, rows });
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = (err) => {
        reject(err);
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      fileInputRef.current.files = e.dataTransfer.files;
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="space-y-4">
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-whatsapp transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          accept=".xlsx,.xls,.csv"
          className="hidden" 
        />
        
        <div className="flex flex-col items-center justify-center space-y-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          <div className="text-gray-700">
            {fileName ? (
              <span className="font-medium">{fileName}</span>
            ) : (
              <>
                <span className="font-medium">Haga clic para cargar</span> o arrastre y suelte
                <p className="text-xs text-gray-500 mt-1">XLSX, XLS, CSV</p>
              </>
            )}
          </div>
        </div>
      </div>

      {isUploading && (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-whatsapp"></div>
          <span className="ml-2 text-gray-600">Procesando archivo...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
    </div>
  );
};

export default ExcelUploader;