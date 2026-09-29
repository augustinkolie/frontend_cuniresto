'use client'

import type { CorporateInvoice } from './types'

const money = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n).replace(/ | /g, ' ')} GNF`
const date = (d: string) => new Date(d).toLocaleDateString('fr-FR', { timeZone: 'Africa/Conakry' })

/** Génère la facture PDF d'une entreprise (chargé à la demande, n'alourdit pas les pages). */
export async function downloadInvoice(invoice: CorporateInvoice): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF()

  doc.setFillColor(20, 17, 15)
  doc.rect(0, 0, 210, 34, 'F')
  doc.setTextColor(247, 241, 232)
  doc.setFontSize(20)
  doc.text('Maison Braise', 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(242, 165, 65)
  doc.text('Facture entreprise', 14, 26)

  doc.setTextColor(20, 17, 15)
  doc.setFontSize(12)
  doc.text(`Facture ${invoice.number}`, 14, 48)
  doc.setFontSize(10)
  doc.text(`Émise le ${date(invoice.createdAt)} — échéance le ${date(invoice.dueDate)}`, 14, 55)
  doc.text(`Période : du ${date(invoice.periodStart)} au ${date(invoice.periodEnd)}`, 14, 61)

  doc.text('Facturé à :', 130, 48)
  doc.text(invoice.company.name, 130, 55)
  if (invoice.company.street) doc.text(invoice.company.street, 130, 61)
  if (invoice.company.city) doc.text(invoice.company.city, 130, 67)

  autoTable(doc, {
    startY: 76,
    head: [['Désignation', 'Qté', 'Prix unitaire', 'Total']],
    body: invoice.lines.map((l) => [l.description, String(l.quantity), money(l.unitPrice), money(l.total)]),
    headStyles: { fillColor: [240, 106, 63], textColor: [20, 17, 15] },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
  })

  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  const rows: Array<[string, string]> = [
    ['Sous-total HT', money(invoice.subtotal)],
    ['TVA 18 %', money(invoice.tax)],
    ['Total TTC', money(invoice.total)],
  ]
  rows.forEach(([label, value], i) => {
    if (i === 2) doc.setFont('helvetica', 'bold')
    doc.text(label, 130, y + i * 7)
    doc.text(value, 196, y + i * 7, { align: 'right' })
  })

  doc.save(`${invoice.number}.pdf`)
}
