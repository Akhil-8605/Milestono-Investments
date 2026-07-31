import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export interface InvoiceDetails {
  email: string
  orderId: string
  paymentId: string
  amount: number
  date: string
  description: string
}

export async function generateAndDownloadInvoice(details: InvoiceDetails) {
  // Create a hidden container
  const container = document.createElement('div')
  
  // Important: It must be temporarily visible in the DOM for html2canvas to render it properly.
  // We position it off-screen so the user never sees it.
  container.style.position = 'absolute'
  container.style.top = '-9999px'
  container.style.left = '-9999px'
  container.style.width = '800px'
  container.style.backgroundColor = '#ffffff' // Ensure white background for PDF
  
  // HTML Template for a modern, aesthetically pleasing invoice
  container.innerHTML = `
    <div style="padding: 48px; font-family: system-ui, -apple-system, sans-serif; color: #0f172a; width: 800px; box-sizing: border-box;">
      
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; border-bottom: 2px solid #f1f5f9; padding-bottom: 32px;">
        <div>
          <h1 style="font-size: 32px; font-weight: 800; margin: 0; color: #0ea5e9; letter-spacing: -0.5px;">Milestono</h1>
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: 600; margin-top: 4px;">Investments</p>
        </div>
        <div style="text-align: right;">
          <h2 style="font-size: 42px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -1px;">INVOICE</h2>
          <p style="font-size: 14px; color: #64748b; margin-top: 8px;">Date: <span style="color: #0f172a; font-weight: 600;">${details.date}</span></p>
        </div>
      </div>

      <!-- Billed To & Details -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 48px;">
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; width: 45%;">
          <p style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; margin: 0 0 8px 0; letter-spacing: 1px;">Billed To</p>
          <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0; word-break: break-all;">${details.email}</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; width: 45%;">
          <p style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; margin: 0 0 8px 0; letter-spacing: 1px;">Payment Details</p>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 14px; color: #64748b;">Order ID:</span>
            <span style="font-size: 14px; font-family: monospace; color: #0f172a; font-weight: 600;">${details.orderId}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-size: 14px; color: #64748b;">Txn ID:</span>
            <span style="font-size: 14px; font-family: monospace; color: #0f172a; font-weight: 600;">${details.paymentId}</span>
          </div>
        </div>
      </div>

      <!-- Table Header -->
      <div style="display: flex; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="flex: 3; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Description</div>
        <div style="flex: 1; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; text-align: right;">Amount</div>
      </div>

      <!-- Table Body -->
      <div style="display: flex; padding: 16px 0; border-bottom: 1px solid #f1f5f9;">
        <div style="flex: 3; font-size: 16px; color: #0f172a; font-weight: 500;">
          ${details.description}
          <div style="font-size: 13px; color: #64748b; margin-top: 4px;">One-time premium account activation fee.</div>
        </div>
        <div style="flex: 1; font-size: 16px; color: #0f172a; font-weight: 600; text-align: right;">
          ₹${details.amount.toLocaleString('en-IN')}
        </div>
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-top: 32px;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #64748b;">
            <span>Subtotal</span>
            <span>₹${details.amount.toLocaleString('en-IN')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #64748b;">
            <span>Tax (18% GST incl.)</span>
            <span>₹0</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 16px 0; margin-top: 8px; border-top: 2px solid #0f172a; font-size: 20px; font-weight: 800; color: #0f172a;">
            <span>Total Paid</span>
            <span>₹${details.amount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top: 64px; padding-top: 32px; border-top: 2px dashed #e2e8f0; text-align: center;">
        <p style="font-size: 14px; font-weight: 600; color: #0ea5e9; margin: 0 0 8px 0;">Thank you for partnering with Milestono Investments.</p>
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">This is a computer-generated invoice and does not require a physical signature.</p>
      </div>

    </div>
  `

  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    let invoiceUrl: string | null = null

    // Upload invoice image to ImageKit in /invoices/
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (blob) {
        const file = new File([blob], `invoice_${details.orderId}.png`, { type: 'image/png' })
        const formData = new FormData()
        formData.append('image', file)
        formData.append('folder', '/invoices/')

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const uploadJson = await uploadRes.json()
        if (uploadJson.success && uploadJson.url) {
          invoiceUrl = uploadJson.url
        }
      }
    } catch (uploadErr) {
      console.error('Failed to upload invoice image to ImageKit:', uploadErr)
    }

    const imgData = canvas.toDataURL('image/png')
    
    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    
    const fileName = `Milestono_Invoice_${details.orderId}.pdf`
    pdf.save(fileName)

    return invoiceUrl
  } catch (err) {
    console.error('Failed to generate PDF invoice', err)
    return null
  } finally {
    // Cleanup
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }
}
