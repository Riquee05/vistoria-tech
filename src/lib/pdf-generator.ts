/**
 * PDF Generator for VistoriaTech
 * Generates PDF laudos técnicos para inspeções concluídas
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Inspection } from "./supabase";

export interface PDFOptions {
  includePhotos?: boolean;
  photoUrls?: string[];
  companyName?: string;
  companyLogo?: string;
}

export class PDFGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF("p", "mm", "a4");
    this.doc.setFont("helvetica");
  }

  /**
   * Generate a technical report PDF for an inspection
   */
  async generateInspectionReport(
    inspection: Inspection,
    options: PDFOptions = {}
  ): Promise<Blob> {
    const {
      includePhotos = true,
      photoUrls = [],
      companyName = "VistoriaTech",
      companyLogo
    } = options;

    // Header
    this.addHeader(companyName, companyLogo);
    this.addTitle("Relatório Técnico de Inspeção");
    this.addInspectionInfo(inspection);

    // Photos section
    if (includePhotos && photoUrls.length > 0) {
      this.addPhotosSection(photoUrls);
    }

    // Technical findings
    this.addTechnicalFindings(inspection);

    // Conclusion
    this.addConclusion(inspection);

    // Footer
    this.addFooter();

    return this.doc.output("blob");
  }

  private addHeader(companyName: string, logo?: string): void {
    // Company info
    this.doc.setFontSize(20);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(companyName, 105, 20, { align: "center" });

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("Sistema de Inspeção de Notebooks", 105, 28, { align: "center" });
    this.doc.text("Versão 1.0", 105, 34, { align: "center" });

    // Date
    const today = new Date().toLocaleDateString("pt-BR");
    this.doc.text(`Gerado em: ${today}`, 190, 10, { align: "right" });
  }

  private addTitle(title: string): void {
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, 105, 45, { align: "center" });
  }

  private addInspectionInfo(inspection: Inspection): void {
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Informações da Inspeção", 20, 60);

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");

    const lineHeight = 5;
    let y = 70;

    const info = [
      `Número do Ativo: ${inspection.asset_number}`,
      `Número da OS: ${inspection.os_number}`,
      `Inspetor: ${inspection.inspector}`,
      `Data: ${new Date(inspection.date).toLocaleDateString("pt-BR")}`,
      `Status: ${inspection.status === "completed" ? "Concluído" : "Em Andamento"}`
    ];

    info.forEach((text) => {
      this.doc.text(text, 25, y);
      y += lineHeight;
    });
  }

  private addPhotosSection(photoUrls: string[]): void {
    this.doc.addPage();
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Fotos da Inspeção", 105, 20, { align: "center" });

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("Fotos capturadas durante a inspeção técnica", 105, 30, { align: "center" });

    // Add photos to PDF (simplified - in real app, you'd need to fetch and embed)
    const photosPerPage = 4;
    const totalPages = Math.ceil(photoUrls.length / photosPerPage);

    photoUrls.forEach((url, index) => {
      const pageNumber = Math.floor(index / photosPerPage) + 1;
      const photoIndex = index % photosPerPage;

      if (pageNumber > 1) {
        this.doc.addPage();
        this.doc.setFontSize(14);
        this.doc.setFont("helvetica", "bold");
        this.doc.text(`Fotos da Inspeção - Página ${pageNumber}`, 105, 20, { align: "center" });
        this.doc.setFontSize(10);
        this.doc.setFont("helvetica", "normal");
      }

      const row = Math.floor(photoIndex / 2);
      const col = photoIndex % 2;
      const x = 30 + col * 90;
      const y = 40 + row * 80;

      // Draw photo placeholder
      this.doc.rect(x, y, 70, 60);
      this.doc.text(`Foto ${index + 1}`, x + 35, y + 30, { align: "center" });
      this.doc.setFontSize(8);
      this.doc.text(`URL: ${url.substring(0, 30)}...`, x + 35, y + 45, { align: "center" });
    });
  }

  private addTechnicalFindings(inspection: Inspection): void {
    this.doc.addPage();
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Anotações Técnicas", 20, 20);

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");

    let y = 40;

    // Screen status
    if (inspection.screen_status) {
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Status da Tela:", 20, y);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(inspection.screen_status, 60, y);
      y += 10;
    }

    // Case status
    if (inspection.case_status) {
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Estado da Carcaça:", 20, y);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(inspection.case_status, 60, y);
      y += 10;
    }

    // Battery status
    if (inspection.battery_status) {
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Estado da Bateria:", 20, y);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(inspection.battery_status, 60, y);
      y += 10;
    }

    // Motherboard brand
    if (inspection.motherboard_brand) {
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Placa Mãe:", 20, y);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(inspection.motherboard_brand, 60, y);
      y += 10;
    }

    // Components
    if (inspection.components && inspection.components.length > 0) {
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Componentes Detectados:", 20, y);
      this.doc.setFont("helvetica", "normal");
      const componentsText = inspection.components.join(", ");
      this.wrapText(componentsText, 60, y, 100);
      y += 10 + (inspection.components.length * 5);
    }

    // Ports
    if (inspection.ports && inspection.ports.length > 0) {
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Portas Funcionais:", 20, y);
      this.doc.setFont("helvetica", "normal");
      const portsText = inspection.ports.join(", ");
      this.wrapText(portsText, 60, y, 100);
      y += 10 + (inspection.ports.length * 5);
    }

    // Notes
    if (inspection.notes) {
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Observações:", 20, y);
      this.doc.setFont("helvetica", "normal");
      this.wrapText(inspection.notes, 60, y, 100);
    }
  }

  private addConclusion(inspection: Inspection): void {
    this.doc.addPage();
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Conclusão", 20, 20);

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");

    const conclusion = inspection.status === "completed"
      ? "A inspeção foi concluída com sucesso. Todas as etapas foram verificadas e as fotos foram capturadas conforme necessário. O notebook está pronto para análise detalhada."
      : "A inspeção está em andamento. Continue com as etapas restantes para concluir a verificação.";

    this.wrapText(conclusion, 20, 40, 170);

    // Signature area
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Assinatura do Inspetor:", 20, 100);
    this.doc.rect(20, 110, 80, 20);
    this.doc.text(inspection.inspector, 25, 120);

    this.doc.text("Data:", 110, 100);
    this.doc.rect(110, 110, 80, 20);
    this.doc.text(new Date(inspection.date).toLocaleDateString("pt-BR"), 115, 120);
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(
        `Página ${i} de ${pageCount}`,
        105,
        this.doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }
  }

  private wrapText(text: string, x: number, y: number, maxWidth: number): void {
    const words = text.split(" ");
    let line = "";
    let lineHeight = 5;
    let currentY = y;

    for (const word of words) {
      const testLine = line + (line ? " " : "") + word;
      const testWidth = this.doc.getStringUnitWidth(testLine) * this.doc.internal.getFontSize() / this.doc.internal.scaleFactor;

      if (testWidth > maxWidth && line) {
        this.doc.text(line, x, currentY);
        line = word;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }

    this.doc.text(line, x, currentY);
  }

  /**
   * Download PDF as file
   */
  downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function getPDFGenerator(): PDFGenerator {
  return new PDFGenerator();
}