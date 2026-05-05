'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type Konva from 'konva'

interface ExportButtonProps {
  stageRef: React.RefObject<Konva.Stage | null>
  tacticName: string
}

export function ExportButton({ stageRef, tacticName }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExportPNG = () => {
    if (!stageRef.current) return
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 })
    const link = document.createElement('a')
    link.download = `${tacticName}.png`
    link.href = uri
    link.click()
  }

  const handleExportPDF = async () => {
    if (!stageRef.current) return
    setExporting(true)
    const { jsPDF } = await import('jspdf')
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 })
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    pdf.addImage(uri, 'PNG', 10, 10, 277, 177)
    pdf.setFontSize(10)
    pdf.setTextColor(150)
    pdf.text(tacticName, 14, 195)
    pdf.save(`${tacticName}.pdf`)
    setExporting(false)
  }

  return (
    <div className="flex gap-1">
      <Button size="sm" variant="outline" className="h-8 text-xs border-zinc-700" onClick={handleExportPNG}>
        <Download size={13} className="mr-1" /> PNG
      </Button>
      <Button size="sm" variant="outline" className="h-8 text-xs border-zinc-700" onClick={handleExportPDF} disabled={exporting}>
        <Download size={13} className="mr-1" /> PDF
      </Button>
    </div>
  )
}
