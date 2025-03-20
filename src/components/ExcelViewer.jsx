import React, { useState, useEffect } from 'react';

const ExcelViewer = () => {
  const [excelData, setExcelData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('');
  const rowsPerPage = 10;

  useEffect(() => {
    // Initialize from global store if available
    if (typeof window !== 'undefined' && window.appStore?.excelData) {
      setExcelData(window.appStore.excelData);
      setSelectedColumn(window.appStore.selectedColumn || '');
    }

    // Listen for changes
    const handleExcelDataChanged = (e) => {
      setExcelData(e.detail);
      // Reset pagination when data changes
      setCurrentPage(1);
    };

    const handleSelectedColumnChanged = (e) => {
      setSelectedColumn(e.detail);
    };

    window.addEventListener('excelDataChanged', handleExcelDataChanged);
    window.addEventListener('selectedColumnChanged', handleSelectedColumnChanged);

    return () => {
      window.removeEventListener('excelDataChanged', handleExcelDataChanged);
      window.removeEventListener('selectedColumnChanged', handleSelectedColumnChanged);
    };
  }, []);

  const handleSelectColumn = (column) => {
    const newSelectedColumn = column === selectedColumn ? '' : column;
    setSelectedColumn(newSelectedColumn);
    
    // Update global store
    if (typeof window !== 'undefined' && window.appStore) {
      window.appStore.setSelectedColumn(newSelectedColumn);
    }
  };

  // Filter the data based on search term
  const filteredData = excelData?.rows ? excelData.rows.filter(row => {
    if (!searchTerm) return true;
    
    return Object.values(row).some(value => 
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) : [];

  // Paginate the data
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  if (!excelData || !excelData.headers || !excelData.rows || excelData.rows.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-2">Cargue un archivo Excel para visualizar los datos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar en los datos..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-whatsapp focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-gray-600 text-sm whitespace-nowrap">
            Mostrando {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredData.length)} de {filteredData.length} registros
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              {excelData.headers.map((header, index) => (
                <th 
                  key={index} 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSelectColumn(header)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{header}</span>
                    {selectedColumn === header && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-whatsapp" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {excelData.headers.map((header, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2 border-b border-gray-200 text-sm">
                    {row[header] !== undefined ? row[header].toString() : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <nav className="flex items-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-l-md border border-gray-300 bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &lt;
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Calculate the page numbers to show
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 border border-gray-300 ${
                    currentPage === pageNum ? 'bg-whatsapp text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-r-md border border-gray-300 bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &gt;
            </button>
          </nav>
        </div>
      )}

      {selectedColumn && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">
            <span className="font-medium">Columna seleccionada:</span> {selectedColumn}
          </p>
          <p className="text-sm text-green-700 mt-1">
            Esta columna será utilizada para los números de WhatsApp en el envío de mensajes.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExcelViewer;