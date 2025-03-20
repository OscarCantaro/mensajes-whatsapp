import React, { useState, useEffect } from 'react';

const WhatsAppSender = () => {
  const [excelData, setExcelData] = useState(null);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [error, setError] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('52'); // Default prefix for Mexico
  const [delay, setDelay] = useState(2); // Default delay in seconds
  const [validationResults, setValidationResults] = useState([]);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    // Initialize from global store if available
    if (typeof window !== 'undefined') {
      if (window.appStore?.excelData) {
        setExcelData(window.appStore.excelData);
      }
      if (window.appStore?.messageTemplate) {
        setMessageTemplate(window.appStore.messageTemplate);
      }
      if (window.appStore?.selectedColumn) {
        setSelectedColumn(window.appStore.selectedColumn);
      }
    }

    // Listen for changes
    const handleExcelDataChanged = (e) => {
      setExcelData(e.detail);
    };

    const handleMessageTemplateChanged = (e) => {
      setMessageTemplate(e.detail);
    };

    const handleSelectedColumnChanged = (e) => {
      setSelectedColumn(e.detail);
    };

    window.addEventListener('excelDataChanged', handleExcelDataChanged);
    window.addEventListener('messageTemplateChanged', handleMessageTemplateChanged);
    window.addEventListener('selectedColumnChanged', handleSelectedColumnChanged);

    return () => {
      window.removeEventListener('excelDataChanged', handleExcelDataChanged);
      window.removeEventListener('messageTemplateChanged', handleMessageTemplateChanged);
      window.removeEventListener('selectedColumnChanged', handleSelectedColumnChanged);
    };
  }, []);

  const validateData = () => {
    if (!excelData || !excelData.rows || excelData.rows.length === 0) {
      setError('No hay datos para enviar. Por favor, cargue un archivo Excel.');
      return false;
    }

    if (!messageTemplate) {
      setError('No hay mensaje para enviar. Por favor, escriba un mensaje.');
      return false;
    }

    if (!selectedColumn) {
      setError('No ha seleccionado la columna que contiene los números de teléfono.');
      return false;
    }

    // Validate phone numbers
    const results = excelData.rows.map((row, index) => {
      const phoneNumber = row[selectedColumn];
      if (!phoneNumber) {
        return {
          index,
          row,
          valid: false,
          reason: 'Número de teléfono vacío'
        };
      }

      // Basic validation - this could be enhanced
      const cleanNumber = phoneNumber.toString().replace(/\D/g, '');
      
      if (cleanNumber.length < 8 || cleanNumber.length > 15) {
        return {
          index,
          row,
          valid: false,
          reason: `Longitud inválida (${cleanNumber.length} dígitos)`
        };
      }

      return {
        index,
        row,
        valid: true,
        cleanNumber
      };
    });

    setValidationResults(results);
    const invalidCount = results.filter(r => !r.valid).length;
    
    if (invalidCount > 0) {
      setShowValidation(true);
      setError(`Se encontraron ${invalidCount} números de teléfono inválidos. Revise la validación antes de enviar.`);
      return false;
    }

    return true;
  };

  const handleSendMessages = async () => {
    setError('');
    
    if (!validateData()) {
      return;
    }
    
    const validNumbers = validationResults.filter(r => r.valid);
    
    if (validNumbers.length === 0) {
      setError('No hay números válidos para enviar mensajes.');
      return;
    }

    setSending(true);
    setProgress(0);
    setSentCount(0);

    try {
      // Track progress
      const total = validNumbers.length;
      
      for (let i = 0; i < validNumbers.length; i++) {
        const result = validNumbers[i];
        const { row, cleanNumber } = result;
        
        // Prepare the message with personalized variables
        let personalizedMessage = messageTemplate;
        
        // Replace variables with actual values
        excelData.headers.forEach(header => {
          const regex = new RegExp(`{{${header}}}`, 'g');
          personalizedMessage = personalizedMessage.replace(regex, row[header] || '');
        });
        
        // URI encode the message
        const encodedMessage = encodeURIComponent(personalizedMessage);
        
        // Create the WhatsApp URL
        const whatsappUrl = `https://wa.me/${phonePrefix}${cleanNumber}?text=${encodedMessage}`;
        
        // Open the WhatsApp URL in a new tab
        window.open(whatsappUrl, '_blank');
        
        // Update progress
        setSentCount(prev => prev + 1);
        setProgress(((i + 1) / total) * 100);
        
        // Delay to prevent rate limiting and give the user time to send each message
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
      }
      
      // Complete
      setSending(false);
    } catch (err) {
      setError(`Error al enviar mensajes: ${err.message}`);
      setSending(false);
    }
  };

  const countValidPhones = () => {
    if (!validationResults.length) return 0;
    return validationResults.filter(r => r.valid).length;
  };

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prefijo de país
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
              +
            </span>
            <input
              type="text"
              value={phonePrefix}
              onChange={(e) => setPhonePrefix(e.target.value.replace(/\D/g, ''))}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-whatsapp focus:border-whatsapp sm:text-sm"
              placeholder="52"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Por ejemplo: 52 para México, 1 para Estados Unidos.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Retraso entre mensajes (segundos)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={delay}
            onChange={(e) => setDelay(parseInt(e.target.value) || 2)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-whatsapp focus:border-whatsapp sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Un retraso mayor previene bloqueos por envío masivo.
          </p>
        </div>
      </div>

      {/* Status Section */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Estado del envío</h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-md border border-gray-200">
            <div className="text-sm text-gray-500">Total contactos</div>
            <div className="text-xl font-semibold">{excelData?.rows?.length || 0}</div>
          </div>
          
          <div className="bg-white p-3 rounded-md border border-gray-200">
            <div className="text-sm text-gray-500">Contactos válidos</div>
            <div className="text-xl font-semibold">{countValidPhones()}</div>
          </div>
          
          <div className="bg-white p-3 rounded-md border border-gray-200">
            <div className="text-sm text-gray-500">Mensajes enviados</div>
            <div className="text-xl font-semibold">{sentCount}</div>
          </div>
        </div>

        {sending && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-whatsapp h-2 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Validation Results */}
      {showValidation && validationResults.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-700">Validación de números</h3>
            <button 
              onClick={() => setShowValidation(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Ocultar
            </button>
          </div>
          
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fila
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {validationResults
                  .filter(r => !r.valid)
                  .map((result) => (
                    <tr key={result.index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {result.index + 1}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {result.row[selectedColumn]}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {result.reason}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          onClick={validateData}
          disabled={sending}
          className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-whatsapp bg-white border-whatsapp hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp"
        >
          Validar números
        </button>
        
        <button
          onClick={handleSendMessages}
          disabled={sending}
          className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-whatsapp hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp"
        >
          {sending ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            </>
          ) : (
            'Enviar Mensajes'
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100 text-sm text-yellow-700">
        <h4 className="font-medium mb-2">Instrucciones</h4>
        <ol className="list-decimal list-inside space-y-1 pl-2">
          <li>Asegúrese de haber seleccionado la columna que contiene los números de teléfono.</li>
          <li>Verifique que los números de teléfono tengan el formato correcto (sin el prefijo del país).</li>
          <li>Al hacer clic en "Enviar Mensajes", se abrirán ventanas de WhatsApp Web para cada contacto.</li>
          <li>Deberá presionar manualmente el botón de enviar en cada ventana de WhatsApp.</li>
          <li>Se recomienda estar conectado a WhatsApp Web antes de iniciar el envío.</li>
        </ol>
      </div>
    </div>
  );
};

export default WhatsAppSender;