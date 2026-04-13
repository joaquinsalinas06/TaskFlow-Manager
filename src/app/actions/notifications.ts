'use server';

import nodemailer from 'nodemailer';

interface ReminderEmailPayload {
  to: string;
  taskTitle: string;
  dueDate: string;       // "YYYY-MM-DD"
  taskId: string;
  language?: 'en' | 'es';
  priorityName?: string;
  groupName?: string;
  taskTypeName?: string;
}

const TRANSLATIONS = {
  en: {
    heroIcon: '⏰',
    heroTitle: 'Task Reminder',
    heroSubtitle: 'Your deadline is approaching',
    bodyLabel: 'Due Task',
    dueDateLabel: 'Due Date',
    priorityLabel: 'Priority',
    groupLabel: 'Group',
    typeLabel: 'Type',
    bodyText: "Don't forget to complete this task before it's due. Open your TaskFlow dashboard to mark it as done or adjust the deadline.",
    btnText: 'Open Dashboard →',
    footerText: 'This reminder was sent by <strong style="color:#6366f1">TaskFlow Manager</strong>.<br>You can manage your notification preferences in the app settings.',
    subjectPrefix: '⏰ Reminder:',
    subjectSuffix: 'is due',
  },
  es: {
    heroIcon: '⏰',
    heroTitle: 'Recordatorio de Tarea',
    heroSubtitle: 'Tu fecha límite se acerca',
    bodyLabel: 'Tarea Pendiente',
    dueDateLabel: 'Fecha de Entrega',
    priorityLabel: 'Prioridad',
    groupLabel: 'Grupo',
    typeLabel: 'Tipo',
    bodyText: "No olvides completar esta tarea antes de que venza. Abre tu panel de TaskFlow para marcarla como lista o ajustar la fecha límite.",
    btnText: 'Abrir Dashboard →',
    footerText: 'Este recordatorio fue enviado por <strong style="color:#6366f1">TaskFlow Manager</strong>.<br>Puedes gestionar tus preferencias de notificaciones en la configuración de la app.',
    subjectPrefix: '⏰ Recordatorio:',
    subjectSuffix: 'vence el',
  }
};

function buildEmailHtml(payload: ReminderEmailPayload): string {
  const { taskTitle, dueDate, priorityName, groupName, taskTypeName, language = 'en' } = payload;
  const t = TRANSLATIONS[language];

  const formattedDate = new Date(`${dueDate}T12:00:00Z`).toLocaleDateString(
    language === 'es' ? 'es-ES' : 'en-US',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  const metaParts: string[] = [];
  if (priorityName) metaParts.push(`${t.priorityLabel}: <strong>${priorityName}</strong>`);
  if (groupName) metaParts.push(`${t.groupLabel}: <strong>${groupName}</strong>`);
  if (taskTypeName) metaParts.push(`${t.typeLabel}: <strong>${taskTypeName}</strong>`);
  const metaHtml = metaParts.length > 0
    ? `<p style="color:#888;font-size:14px;margin:0 0 16px">${metaParts.join(' &nbsp;·&nbsp; ')}</p>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f17;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f17;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 36px;text-align:center">
            <div style="font-size:28px;margin-bottom:8px">${t.heroIcon}</div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.3px">${t.heroTitle}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px">${t.heroSubtitle}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 36px">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.08em;color:#6366f1;text-transform:uppercase">${t.bodyLabel}</p>
            <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f1f1f5;line-height:1.3">${taskTitle}</h2>
            ${metaHtml}
            <div style="background:#0f0f17;border-radius:10px;padding:16px 20px;margin-bottom:24px;border-left:3px solid #6366f1">
              <p style="margin:0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">${t.dueDateLabel}</p>
              <p style="margin:6px 0 0;font-size:17px;font-weight:700;color:#f1f1f5">${formattedDate}</p>
            </div>
            <p style="margin:0 0 24px;font-size:14px;color:#aaa;line-height:1.6">
              ${t.bodyText}
            </p>
            <div style="text-align:center">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'}/dashboard"
                 style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.02em">
                ${t.btnText}
              </a>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
            <p style="margin:0;font-size:12px;color:#555">
              ${t.footerText}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Create a reusable transporter. Lazily initialized.
let _transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // STARTTLS
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return _transporter;
}

export async function sendTaskReminderEmail(
  payload: ReminderEmailPayload
): Promise<{ success: boolean; error?: string }> {
  const { to, taskTitle, dueDate, taskTypeName, language = 'en' } = payload;
  const t = TRANSLATIONS[language];

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('[notifications] GMAIL_USER or GMAIL_APP_PASSWORD not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"TaskFlow Manager" <${process.env.GMAIL_USER}>`,
      to,
      subject: `${t.subjectPrefix} ${taskTypeName ? `[${taskTypeName}] ` : ''}"${taskTitle}" ${t.subjectSuffix} ${dueDate}`,
      html: buildEmailHtml(payload),
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[notifications] Failed to send email:', message);
    return { success: false, error: message };
  }
}
