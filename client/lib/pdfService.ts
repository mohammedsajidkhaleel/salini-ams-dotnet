import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PDFOptions {
  filename?: string
  format?: 'a4' | 'letter'
  orientation?: 'portrait' | 'landscape'
  margin?: number
  quality?: number
}

export class PDFService {
  /**
   * Generate PDF from HTML element and open in new window
   */
  static async generatePDFFromElement(
    element: HTMLElement,
    options: PDFOptions = {}
  ): Promise<void> {
    const {
      filename = 'document.pdf',
      format = 'a4',
      orientation = 'portrait',
      margin = 10,
      quality = 1
    } = options

    try {
      // Show loading state
      const originalContent = element.innerHTML
      element.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 200px; font-size: 18px;">Generating PDF...</div>'

      // Wait a bit for the loading state to be visible
      await new Promise(resolve => setTimeout(resolve, 500))

      // Restore original content
      element.innerHTML = originalContent

      // Create a clone of the element to avoid modifying the original
      const clonedElement = element.cloneNode(true) as HTMLElement
      
      // Apply styles to the cloned element for full content capture
      clonedElement.style.position = 'static'
      clonedElement.style.overflow = 'visible'
      clonedElement.style.height = 'auto'
      clonedElement.style.maxHeight = 'none'
      clonedElement.style.transform = 'none'
      clonedElement.style.backgroundColor = '#ffffff'
      
      // Create a temporary container for the cloned element
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'fixed'
      tempContainer.style.left = '-10000px'
      tempContainer.style.top = '-10000px'
      tempContainer.style.width = '800px'
      tempContainer.style.backgroundColor = '#ffffff'
      tempContainer.style.zIndex = '-9999'
      tempContainer.style.visibility = 'hidden'
      tempContainer.appendChild(clonedElement)
      document.body.appendChild(tempContainer)
      
      // Store elements to restore later
      const hiddenUIElements: HTMLElement[] = []

      // Ensure parent containers don't clip the content
      let parent = element.parentElement
      while (parent && parent !== document.body) {
        const parentStyle = parent.style
        const computedStyle = window.getComputedStyle(parent)
        
        // Store original styles
        parentStyles.push({
          element: parent,
          overflow: parentStyle.overflow || computedStyle.overflow,
          maxHeight: parentStyle.maxHeight || computedStyle.maxHeight
        })
        
        if (computedStyle.overflow === 'hidden' || computedStyle.overflow === 'auto') {
          parentStyle.overflow = 'visible'
        }
        if (computedStyle.maxHeight && computedStyle.maxHeight !== 'none') {
          parentStyle.maxHeight = 'none'
        }
        parent = parent.parentElement
      }

      // Temporarily hide common UI elements that might interfere
      const uiElements = document.querySelectorAll('header, nav, .sidebar, .navbar, .header, .navigation, .menu, .toolbar, .footer, .page-footer, .dialog-header, .dialog-footer, .print\\:hidden, [data-radix-scroll-area-viewport]')
      
      uiElements.forEach((el) => {
        const htmlEl = el as HTMLElement
        if (htmlEl.style.display !== 'none' && !element.contains(htmlEl)) {
          htmlEl.style.display = 'none'
          hiddenUIElements.push(htmlEl)
        }
      })

      // Hide any elements that might contain browser artifacts
      const allElements = document.querySelectorAll('*')
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement
        if (htmlEl.textContent && (
          htmlEl.textContent.includes('localhost:3000') ||
          htmlEl.textContent.includes('page') ||
          htmlEl.textContent.includes('1/1') ||
          htmlEl.textContent.includes('2/2') ||
          htmlEl.textContent.includes('3/3')
        ) && !element.contains(htmlEl)) {
          htmlEl.style.display = 'none'
          hiddenUIElements.push(htmlEl)
        }
      })

      // Wait for layout to settle
      await new Promise(resolve => setTimeout(resolve, 200))

      // Get the full content dimensions from the cloned element
      const fullHeight = Math.max(
        clonedElement.scrollHeight,
        clonedElement.offsetHeight,
        clonedElement.clientHeight
      )
      const fullWidth = Math.max(
        clonedElement.scrollWidth,
        clonedElement.offsetWidth,
        clonedElement.clientWidth
      )

      // Get cloned element's position relative to viewport
      const rect = clonedElement.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

      // Debug: Log element dimensions
      console.log('PDF Generation Debug:', {
        element: element,
        fullWidth,
        fullHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
        offsetWidth: element.offsetWidth,
        offsetHeight: element.offsetHeight,
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight
      })

      // Create canvas from cloned HTML element with full dimensions
      const canvas = await html2canvas(clonedElement, {
        scale: quality,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false, // Disable logging for cleaner output
        width: fullWidth,
        height: fullHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: fullWidth,
        windowHeight: fullHeight,
        x: 0,
        y: 0,
        // Ensure we capture from the top of the element
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft,
        // Remove any clipping and browser artifacts
        foreignObjectRendering: true,
        removeContainer: true,
        ignoreElements: (element) => {
          // Ignore elements that might contain browser artifacts
          if (element.textContent) {
            return element.textContent.includes('localhost:3000') ||
                   element.textContent.includes('page') ||
                   element.textContent.includes('1/1') ||
                   element.textContent.includes('2/2') ||
                   element.textContent.includes('3/3')
          }
          return false
        }
      })

      console.log('Canvas created:', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
      })

      // Clean up temporary container
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer)
      }

      // Restore hidden UI elements
      hiddenUIElements.forEach(el => {
        el.style.display = ''
      })

      // Calculate PDF dimensions
      const imgWidth = format === 'a4' ? 210 : 216 // A4: 210mm, Letter: 216mm
      const pageHeight = format === 'a4' ? 297 : 279 // A4: 297mm, Letter: 279mm
      const availablePageHeight = pageHeight - (margin * 2) // Available height per page
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Create PDF with clean settings
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: format,
        compress: true,
        precision: 2
      })

      // Remove default headers and footers
      pdf.setProperties({
        title: title,
        subject: 'Employee Report',
        author: 'IT Asset Management System',
        creator: 'IT Asset Management System'
      })

      // Add image to PDF with proper multi-page handling
      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // Calculate how many pages we need
      const totalPages = Math.ceil(imgHeight / availablePageHeight)
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage()
        }
        
        // Calculate the source position for this page
        const sourceY = page * availablePageHeight
        const sourceHeight = Math.min(availablePageHeight, imgHeight - sourceY)
        
        // Calculate the destination position (always start from top of page)
        const destY = margin
        
        // Add the image portion for this page
        pdf.addImage(
          imgData, 
          'PNG', 
          margin, 
          destY, 
          imgWidth - (margin * 2), 
          sourceHeight,
          undefined,
          'FAST'
        )
      }

      // Create PDF blob and open in new tab
      const pdfBlob = pdf.output('blob')
      this.openPDFInNewTab(pdfBlob, filename)

    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Failed to generate PDF. Please try again.')
    }
  }

  /**
   * Download PDF directly
   */
  static downloadPDF(pdf: jsPDF, filename: string): void {
    pdf.save(filename)
  }

  /**
   * Open popup content in new tab for printing
   */
  static openPopupInNewTab(element: HTMLElement, title: string): void {
    // Clone the element content
    const clonedElement = element.cloneNode(true) as HTMLElement
    
    // Remove any elements that might contain browser artifacts
    this.removeBrowserArtifacts(clonedElement)
    
    // Create a complete HTML document
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            background: white;
            color: black;
            padding: 20px;
            line-height: 1.4;
          }
          
          .print-content {
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
          
          /* Print-specific styles */
          @media print {
            body {
              padding: 0;
            }
            
            .print-content {
              max-width: none;
              margin: 0;
            }
            
            .no-print {
              display: none !important;
            }
          }
          
          /* Optimize for print */
          h1 { font-size: 18px; margin-bottom: 10px; }
          h2 { font-size: 16px; margin-bottom: 8px; }
          h3 { font-size: 14px; margin-bottom: 6px; }
          p { font-size: 12px; margin-bottom: 4px; }
          td, th { font-size: 10px; padding: 2px; }
          .text-sm { font-size: 10px; }
          .text-xs { font-size: 9px; }
          .mb-8 { margin-bottom: 6px; }
          .mb-6 { margin-bottom: 4px; }
          .mb-4 { margin-bottom: 3px; }
          .mb-3 { margin-bottom: 2px; }
          .mb-2 { margin-bottom: 1px; }
          .space-y-4 > * + * { margin-top: 3px; }
          .space-y-3 > * + * { margin-top: 2px; }
          .space-y-2 > * + * { margin-top: 1px; }
          .space-y-1 > * + * { margin-top: 0.5px; }
          .p-4 { padding: 3px; }
          .p-3 { padding: 2px; }
          .py-1 { padding-top: 1px; padding-bottom: 1px; }
          .pb-8 { padding-bottom: 4px; }
          .pb-6 { padding-bottom: 3px; }
          .pb-1 { padding-bottom: 1px; }
          
          /* Grid layouts */
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
          .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
          .gap-6 { gap: 4px; }
          .gap-4 { gap: 3px; }
          .gap-3 { gap: 2px; }
          
          /* Colors */
          .bg-pink-100 { background-color: #fce7f3; }
          .bg-green-100 { background-color: #dcfce7; }
          .bg-purple-100 { background-color: #f3e8ff; }
          .bg-blue-100 { background-color: #dbeafe; }
          
          /* Borders */
          .border { border: 1px solid #d1d5db; }
          .border-b { border-bottom: 1px solid #d1d5db; }
          .border-gray-300 { border-color: #d1d5db; }
          .border-gray-200 { border-color: #e5e7eb; }
          
          /* Text */
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .font-semibold { font-weight: 600; }
          .uppercase { text-transform: uppercase; }
          .italic { font-style: italic; }
          
          /* Spacing */
          .mt-2 { margin-top: 2px; }
          .mt-4 { margin-top: 3px; }
          .mt-6 { margin-top: 4px; }
          
          /* Table styles */
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; }
          
          /* Print button */
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
          }
          
          .print-button:hover {
            background: #2563eb;
          }
          
          @media print {
            .print-button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">🖨️ Print Report</button>
        <div class="print-content">
          ${clonedElement.outerHTML}
        </div>
      </body>
      </html>
    `
    
    // Create blob and open in new tab
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    // Open in new tab
    const newWindow = window.open(url, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes')
    
    if (newWindow) {
      newWindow.focus()
      // Clean up URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 10000)
    } else {
      // Fallback: create download link
      const link = document.createElement('a')
      link.href = url
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
    }
  }

  /**
   * Generate PDF with custom styling for reports
   */
  static async generateReportPDF(
    element: HTMLElement,
    title: string,
    options: PDFOptions = {}
  ): Promise<void> {
    const {
      filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
      format = 'a4',
      orientation = 'portrait',
      margin = 15,
      quality = 1.5
    } = options

    // Create a completely isolated container for PDF generation
    const isolatedContainer = await this.createIsolatedContainer(element)
    
    try {
      // Apply print-specific styles to the isolated container
      const originalStyles = this.applyPrintStyles(isolatedContainer)
      
      // Generate PDF from the isolated container
      await this.generatePDFFromElement(isolatedContainer, {
        filename,
        format,
        orientation,
        margin,
        quality
      })
      
      // Restore original styles
      this.restoreOriginalStyles(isolatedContainer, originalStyles)
    } finally {
      // Clean up the isolated container
      if (isolatedContainer && isolatedContainer.parentNode) {
        isolatedContainer.parentNode.removeChild(isolatedContainer)
      }
    }
  }

  /**
   * Create an isolated container with only the report content
   */
  private static async createIsolatedContainer(element: HTMLElement): Promise<HTMLElement> {
    // Create a new container completely outside the current DOM
    const isolatedContainer = document.createElement('div')
    isolatedContainer.style.position = 'fixed'
    isolatedContainer.style.left = '-10000px'
    isolatedContainer.style.top = '-10000px'
    isolatedContainer.style.width = '800px'
    isolatedContainer.style.height = 'auto'
    isolatedContainer.style.backgroundColor = '#ffffff'
    isolatedContainer.style.zIndex = '-9999'
    isolatedContainer.style.visibility = 'hidden'
    isolatedContainer.style.pointerEvents = 'none'
    
    // Deep clone the element content to avoid any reference issues
    const clonedElement = element.cloneNode(true) as HTMLElement
    
    // Remove any elements that might contain browser artifacts
    this.removeBrowserArtifacts(clonedElement)
    
    // Apply clean styles to the cloned element
    clonedElement.style.position = 'static'
    clonedElement.style.overflow = 'visible'
    clonedElement.style.height = 'auto'
    clonedElement.style.maxHeight = 'none'
    clonedElement.style.transform = 'none'
    clonedElement.style.backgroundColor = '#ffffff'
    
    // Add the cloned content to the isolated container
    isolatedContainer.appendChild(clonedElement)
    
    // Add to document body
    document.body.appendChild(isolatedContainer)
    
    // Wait for layout to settle
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return isolatedContainer
  }

  /**
   * Remove browser artifacts from the cloned element
   */
  private static removeBrowserArtifacts(element: HTMLElement): void {
    const allElements = element.querySelectorAll('*')
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement
      if (htmlEl.textContent && (
        htmlEl.textContent.includes('localhost:3000') ||
        htmlEl.textContent.includes('page') ||
        htmlEl.textContent.includes('1/1') ||
        htmlEl.textContent.includes('2/2') ||
        htmlEl.textContent.includes('3/3')
      )) {
        htmlEl.remove()
      }
    })
  }

  /**
   * Create a clean canvas without browser artifacts
   */
  private static async createCleanCanvas(element: HTMLElement, quality: number): Promise<HTMLCanvasElement> {
    // Store original styles
    const originalElementStyle = element.getAttribute('style') || ''
    
    // Apply styles to ensure full visibility
    element.style.position = 'static'
    element.style.overflow = 'visible'
    element.style.height = 'auto'
    element.style.maxHeight = 'none'
    element.style.transform = 'none'
    element.style.zIndex = '9999'
    element.style.backgroundColor = '#ffffff'

    // Temporarily hide other elements that might interfere
    const elementsToHide = document.querySelectorAll('header, nav, .sidebar, .navbar, .header, .navigation, .menu, .toolbar, .footer, .page-footer')
    const hiddenElements: HTMLElement[] = []
    
    elementsToHide.forEach((el) => {
      const htmlEl = el as HTMLElement
      if (htmlEl.style.display !== 'none' && !element.contains(htmlEl)) {
        htmlEl.style.display = 'none'
        hiddenElements.push(htmlEl)
      }
    })

    // Wait for layout to settle
    await new Promise(resolve => setTimeout(resolve, 200))

    // Get full dimensions
    const fullHeight = Math.max(
      element.scrollHeight,
      element.offsetHeight,
      element.clientHeight
    )
    const fullWidth = Math.max(
      element.scrollWidth,
      element.offsetWidth,
      element.clientWidth
    )

    // Create canvas
    const canvas = await html2canvas(element, {
      scale: quality,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: fullWidth,
      height: fullHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: fullWidth,
      windowHeight: fullHeight,
      x: 0,
      y: 0,
      foreignObjectRendering: true,
      removeContainer: true
    })

    // Restore original element style
    if (originalElementStyle) {
      element.setAttribute('style', originalElementStyle)
    } else {
      element.removeAttribute('style')
    }

    // Restore hidden elements
    hiddenElements.forEach(el => {
      el.style.display = ''
    })

    return canvas
  }

  /**
   * Create a clean PDF without headers/footers
   */
  private static async createCleanPDF(
    canvas: HTMLCanvasElement,
    title: string,
    filename: string,
    format: 'a4' | 'letter',
    orientation: 'portrait' | 'landscape',
    margin: number
  ): Promise<void> {
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format,
      compress: true,
      precision: 2
    })

    // Set clean properties
    pdf.setProperties({
      title: title,
      subject: 'Employee Report',
      author: 'IT Asset Management System',
      creator: 'IT Asset Management System'
    })

    // Calculate dimensions
    const imgWidth = format === 'a4' ? 210 : 216
    const pageHeight = format === 'a4' ? 297 : 279
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png', 1.0)
    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth - (margin * 2), imgHeight)

    // Handle multi-page content
    let heightLeft = imgHeight - (pageHeight - margin * 2)
    while (heightLeft >= 0) {
      pdf.addPage()
      const position = heightLeft - imgHeight + margin
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth - (margin * 2), imgHeight)
      heightLeft -= (pageHeight - margin * 2)
    }

    // Open PDF in new window
    const pdfBlob = pdf.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    
    // Method 1: Try to open in new tab using a temporary link
    const link = document.createElement('a')
    link.href = pdfUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.style.display = 'none'
    
    // Add to DOM, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Method 2: Also try window.open as backup
    setTimeout(() => {
      const newWindow = window.open(pdfUrl, '_blank', 'noopener,noreferrer')
      if (newWindow) {
        newWindow.focus()
      }
    }, 100)
    
    // Clean up URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl)
    }, 10000)
  }

  /**
   * Apply print-specific styles to element
   */
  private static applyPrintStyles(element: HTMLElement): string {
    const originalStyle = element.getAttribute('style') || ''
    
    const printStyles = `
      background: white !important;
      color: black !important;
      font-family: Arial, sans-serif !important;
      font-size: 10px !important;
      line-height: 1.2 !important;
      box-shadow: none !important;
      border: none !important;
      padding: 15px !important;
      margin: 0 !important;
      width: 100% !important;
      max-width: none !important;
      overflow: visible !important;
      position: static !important;
      height: auto !important;
      max-height: none !important;
      min-height: auto !important;
      transform: none !important;
    `

    // Hide unwanted elements that might appear in PDF
    const style = document.createElement('style')
    style.setAttribute('data-pdf-print', 'true')
    style.textContent = `
      @media print {
        .print\\:hidden { display: none !important; }
        .no-print { display: none !important; }
        body * { visibility: hidden; }
        .print-content, .print-content * { visibility: visible; }
        .print-content { position: absolute; left: 0; top: 0; width: 100%; }
        
        /* Optimize font sizes for PDF */
        .print-content h1 { font-size: 14px !important; margin-bottom: 8px !important; }
        .print-content h2 { font-size: 12px !important; margin-bottom: 6px !important; }
        .print-content h3 { font-size: 11px !important; margin-bottom: 4px !important; }
        .print-content p { font-size: 10px !important; margin-bottom: 4px !important; }
        .print-content td, .print-content th { font-size: 9px !important; padding: 2px !important; }
        .print-content .text-sm { font-size: 9px !important; }
        .print-content .text-xs { font-size: 8px !important; }
        .print-content .mb-8 { margin-bottom: 6px !important; }
        .print-content .mb-6 { margin-bottom: 4px !important; }
        .print-content .mb-4 { margin-bottom: 3px !important; }
        .print-content .space-y-4 > * + * { margin-top: 3px !important; }
        .print-content .space-y-2 > * + * { margin-top: 2px !important; }
        .print-content .p-4 { padding: 3px !important; }
        .print-content .py-1 { padding-top: 1px !important; padding-bottom: 1px !important; }
        .print-content .pb-8 { padding-bottom: 4px !important; }
        .print-content .pb-1 { padding-bottom: 1px !important; }
      }
    `
    document.head.appendChild(style)
    
    element.setAttribute('style', printStyles)
    return originalStyle
  }

  /**
   * Restore original styles
   */
  private static restoreOriginalStyles(element: HTMLElement, originalStyle: string): void {
    if (originalStyle) {
      element.setAttribute('style', originalStyle)
    } else {
      element.removeAttribute('style')
    }

    // Remove the temporary print styles
    const printStyles = document.querySelector('style[data-pdf-print]')
    if (printStyles) {
      printStyles.remove()
    }
  }

  /**
   * Generate PDF from multiple elements (for complex layouts)
   */
  static async generateMultiElementPDF(
    elements: HTMLElement[],
    options: PDFOptions = {}
  ): Promise<void> {
    const {
      filename = 'multi-page-document.pdf',
      format = 'a4',
      orientation = 'portrait',
      margin = 10,
      quality = 1
    } = options

    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format
    })

    const imgWidth = format === 'a4' ? 210 : 216
    const pageHeight = format === 'a4' ? 297 : 279

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      
      if (i > 0) {
        pdf.addPage()
      }

      const canvas = await html2canvas(element, {
        scale: quality,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      })

      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const imgData = canvas.toDataURL('image/png')

      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth - (margin * 2), imgHeight)
    }

    // Open PDF in new window
    const pdfBlob = pdf.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    
    // Method 1: Try to open in new tab using a temporary link
    const link = document.createElement('a')
    link.href = pdfUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.style.display = 'none'
    
    // Add to DOM, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Method 2: Also try window.open as backup
    setTimeout(() => {
      const newWindow = window.open(pdfUrl, '_blank', 'noopener,noreferrer')
      if (newWindow) {
        newWindow.focus()
      }
    }, 100)
    
    // Clean up URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl)
    }, 10000)
  }
}
