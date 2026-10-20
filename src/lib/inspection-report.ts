import { supabase } from './supabase';

export type ReportStep = {
  id: string;
  step_id?: string;
  name: string;
  status: string;
  additional_software?: string | null;
};

export type ReportPhoto = { step_id: string; file_path: string; file_name: string };
export type ReportInspection = {
  id: string;
  asset_number: string;
  os_number: string;
  status: string;
  created_at: string;
  completed_at?: string | null;
};

const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g,
  char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
const date = (value?: string | null) => value ? new Date(value).toLocaleString('pt-BR') : '—';
const status = (value: string) => ({ completed: 'Concluída', in_progress: 'Em andamento', pending: 'Pendente', archived: 'Arquivada' }[value] || value);

const dataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('Não foi possível preparar uma foto.'));
  reader.readAsDataURL(blob);
});

export async function buildInspectionReportHtml(
  inspection: ReportInspection,
  steps: ReportStep[],
  photos: ReportPhoto[],
  software: string,
) {
  const sections: string[] = [];
  for (const [index, step] of steps.entries()) {
    const images: string[] = [];
    for (const photo of photos.filter(photo => photo.step_id === (step.step_id || step.id))) {
      const { data, error } = await supabase.storage.from('inspection-photos').download(photo.file_path);
      if (error || !data) throw new Error(`Não foi possível carregar a foto ${photo.file_name}. Tente novamente.`);
      images.push(`<figure><img src="${escape(await dataUrl(data))}" alt="${escape(photo.file_name)}"><figcaption>${escape(photo.file_name)}</figcaption></figure>`);
    }
    sections.push(`<section class="step"><div class="step-heading"><span class="number">${index + 1}</span><h2>${escape(step.name)}</h2><span class="badge">${escape(status(step.status))}</span></div>${step.id === 'config' && software ? `<div class="notes"><strong>Software adicional</strong><p>${escape(software)}</p></div>` : ''}<div class="photos">${images.join('') || '<p class="muted">Nenhuma foto registrada nesta etapa.</p>'}</div></section>`);
  }

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ativo ${escape(inspection.asset_number)} - OS ${escape(inspection.os_number)}</title><style>
    *{box-sizing:border-box}body{margin:0;background:#eef2f6;color:#172437;font:14px Arial,sans-serif}main{max-width:900px;margin:24px auto;background:white;padding:40px}header{border-top:8px solid #0f766e;padding-top:24px;border-bottom:1px solid #dbe3eb;padding-bottom:24px}.brand{font-size:14px;font-weight:bold;letter-spacing:2px;color:#0f766e}h1{font-size:32px;margin:14px 0 8px}.subtitle,.muted{color:#64748b}.summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:24px 0}.summary div{background:#f1f5f9;border:1px solid #e2e8f0;padding:16px;border-radius:8px}.summary small{display:block;color:#64748b;margin-bottom:8px}.summary strong{font-size:19px;overflow-wrap:anywhere}.step{margin-top:30px}.step-heading{display:flex;align-items:center;gap:12px;border-bottom:2px solid #e2e8f0;padding-bottom:12px;break-after:avoid}.number{background:#0f766e;color:white;border-radius:6px;padding:8px 12px}h2{font-size:19px;margin:0;flex:1}.badge{font-size:11px;border:1px solid #cbd5e1;padding:6px;border-radius:20px}.photos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px}figure{margin:0;border:1px solid #dbe3eb;border-radius:8px;overflow:hidden;break-inside:avoid}img{display:block;width:100%;height:230px;object-fit:contain;background:#f8fafc}figcaption{font-size:10px;padding:10px;color:#64748b;overflow-wrap:anywhere}.notes{background:#f0fdfa;border-left:3px solid #0f766e;padding:14px;margin-top:16px}.notes p{white-space:pre-wrap;margin-bottom:0}footer{margin-top:32px;border-top:1px solid #dbe3eb;padding-top:16px;color:#64748b;font-size:10px;overflow-wrap:anywhere}@page{size:A4;margin:14mm}@media print{body{background:white}main{margin:0;padding:0;max-width:none}.summary div,.number,header{-webkit-print-color-adjust:exact;print-color-adjust:exact}img{height:64mm}figure{break-inside:avoid}.notes{break-inside:avoid}}@media screen and (max-width:600px){main{margin:0;padding:22px}.photos{grid-template-columns:1fr}h1{font-size:26px}}
    </style></head><body><main><header><div class="brand">VISTORIATECH / RELATÓRIO TÉCNICO</div><h1>Vistoria do equipamento</h1><div class="subtitle">Registro das etapas e evidências fotográficas</div></header><div class="summary"><div><small>ATIVO</small><strong>${escape(inspection.asset_number)}</strong></div><div><small>ORDEM DE SERVIÇO</small><strong>${escape(inspection.os_number)}</strong></div><div><small>SITUAÇÃO</small><strong>${escape(status(inspection.status))}</strong></div><div><small>FOTOS / ETAPAS CONCLUÍDAS</small><strong>${photos.length} / ${steps.filter(step => step.status === 'completed').length} de ${steps.length}</strong></div></div><p class="muted">Abertura: ${escape(date(inspection.created_at))}<br>Conclusão: ${escape(date(inspection.completed_at))}</p>${sections.join('')}<footer>Gerado em ${escape(date(new Date().toISOString()))} · Vistoria ${escape(inspection.id)}<br>O relatório reflete as informações disponíveis no momento da geração.</footer></main></body></html>`;
}

export async function openInspectionReport(
  inspection: ReportInspection,
  steps: ReportStep[],
  photos: ReportPhoto[],
  software: string,
) {
  // Open synchronously from the tap so mobile browsers can allow this window.
  const report = window.open('', '_blank');
  if (!report) throw new Error('Permita abrir uma nova aba para gerar o relatório.');
  report.opener = null;
  report.document.title = 'Preparando relatório';
  report.document.body.textContent = 'Preparando relatório e fotos. Aguarde…';
  try {
    const html = await buildInspectionReportHtml(inspection, steps, photos, software);
    if (report.closed) return;
    report.document.open();
    report.document.write(html.replace('<body>', '<body><div class="toolbar"><button id="print" disabled>Carregando fotos…</button><p>Na impressão, escolha <strong>Salvar como PDF</strong>. No iPhone, use as opções de compartilhar da prévia.</p></div>').replace('</head>', '<style>.toolbar{max-width:900px;margin:20px auto;padding:0 16px;display:flex;gap:16px;align-items:center}button{background:#0f766e;color:white;border:0;border-radius:8px;padding:14px 22px;font-weight:bold;cursor:pointer}.toolbar p{font-size:13px}@media print{.toolbar{display:none}}</style></head>'));
    report.document.close();
    await Promise.all(Array.from(report.document.images).map(image => image.decode()));
    const button = report.document.getElementById('print') as HTMLButtonElement;
    button.disabled = false;
    button.textContent = 'Salvar / imprimir PDF';
    button.onclick = () => report.print();
  } catch (error) {
    if (!report.closed) report.close();
    throw error;
  }
}
