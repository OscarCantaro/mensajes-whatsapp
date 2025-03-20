import React, { useState, useEffect } from 'react';

const MessageEditor = () => {
  const [message, setMessage] = useState('');
  const [variables, setVariables] = useState([]);
  const [preview, setPreview] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [excelData, setExcelData] = useState(null);

  useEffect(() => {
    // Initialize from global store if available
    if (typeof window !== 'undefined') {
      if (window.appStore?.messageTemplate) {
        setMessage(window.appStore.messageTemplate);
      }
      if (window.appStore?.excelData) {
        setExcelData(window.appStore.excelData);
        extractVariables(window.appStore.excelData);
      }
    }

    // Listen for changes
    const handleExcelDataChanged = (e) => {
      setExcelData(e.detail);
      extractVariables(e.detail);
    };

    const handleMessageTemplateChanged = (e) => {
      setMessage(e.detail);
      updatePreview(e.detail, excelData);
    };

    window.addEventListener('excelDataChanged', handleExcelDataChanged);
    window.addEventListener('messageTemplateChanged', handleMessageTemplateChanged);

    return () => {
      window.removeEventListener('excelDataChanged', handleExcelDataChanged);
      window.removeEventListener('messageTemplateChanged', handleMessageTemplateChanged);
    };
  }, []);

  useEffect(() => {
    updatePreview(message, excelData);
  }, [message, excelData]);

  const extractVariables = (data) => {
    if (!data || !data.headers) return;
    setVariables(data.headers);

    // Set preview data to first row if available
    if (data.rows && data.rows.length > 0) {
      setPreviewData(data.rows[0]);
    }
  };

  const updatePreview = (msgTemplate, data) => {
    if (!msgTemplate || !data || !data.rows || data.rows.length === 0) {
      setPreview('');
      return;
    }

    let previewMessage = msgTemplate;
    const firstRow = data.rows[0];

    // Replace variable placeholders with actual values
    data.headers.forEach(header => {
      const regex = new RegExp(`{{${header}}}`, 'g');
      previewMessage = previewMessage.replace(regex, firstRow[header] || '');
    });

    setPreview(previewMessage);
  };

  const insertVariable = (variable) => {
    const updatedMessage = message + `{{${variable}}}`;
    setMessage(updatedMessage);
    
    // Update global store
    if (typeof window !== 'undefined' && window.appStore) {
      window.appStore.setMessageTemplate(updatedMessage);
    }
  };

  const handleMessageChange = (e) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    
    // Update global store
    if (typeof window !== 'undefined' && window.appStore) {
      window.appStore.setMessageTemplate(newMessage);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Editar mensaje
        </label>
        <textarea id="message" rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-whatsapp focus:border-whatsapp"
          placeholder="Escribe tu mensaje aquí. Utiliza {{variable}} para insertar datos personalizados."
          value={message}
          onChange={handleMessageChange}>
        </textarea>
      </div>

      {variables.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vista previa del mensaje
            </label>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex items-start mb-2">
                <div className="flex-shrink-0 bg-green-100 rounded-full p-2 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-whatsapp" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-3.536-3.535a.5.5 0 010 .707L9.707 12.88a.5.5 0 01-.707 0L6.343 9.172a.5.5 0 11.707-.707L9.353 11.1l4.404-4.95a.5.5 0 01.707.313z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                  <div className="whitespace-pre-wrap break-words text-gray-800">
                    {preview}
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-gray-400 text-xs">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Esta es una vista previa utilizando los datos de la primera fila.
              </p>
            </div>
          </div>
        )}
    </div>
  );
};




export default MessageEditor;
          <label>
            Variables disponibles
          </label>

          <div className="flex flex-wrap gap-2">
            {variables.map((variable, index) => (
              <button key={index} onClick={() => insertVariable(variable)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-whatsapp"
                >
                {'{{'}{variable}{'}}'}        </button>
            ))}
          </div>

        </div>
      )}

      {preview && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2"></label>
          </div>
        )} 