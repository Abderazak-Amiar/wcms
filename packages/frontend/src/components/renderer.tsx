import { ipcRenderer } from 'electron';
import { useEffect, useState } from 'react';

// Define the Invoice type
interface Invoice {
  id: number;
  htmlContent: string;
}

function InvoicePrinter() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: 1, htmlContent: '<h2>Invoice #1</h2><p>Total: $100</p>' },
    { id: 2, htmlContent: '<h2>Invoice #2</h2><p>Total: $200</p>' },
  ]);

  // Handle Print Button Click
  const handlePrint = () => {
    ipcRenderer.send('print-invoices', invoices);
  };

  // Prepare invoice content for printing
  useEffect(() => {
    ipcRenderer.on('prepare-print', (_event, invoice: Invoice) => {
      const invoiceContainer = document.getElementById('invoice-container');
      if (invoiceContainer) {
        invoiceContainer.innerHTML = invoice.htmlContent;
      }
    });

    return () => {
      ipcRenderer.removeAllListeners('prepare-print');
    };
  }, []);

  return (
    <div>
      <h1>Invoice Printer</h1>
      <button onClick={handlePrint}>Print Invoices</button>
      <div id="invoice-container" style={{ display: 'none' }}></div>
    </div>
  );
}

export default InvoicePrinter;
