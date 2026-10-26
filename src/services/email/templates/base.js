const STATUS_COLORS = {
  down: '#dc2626',
  recovered: '#16a34a',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Shared email chrome: header band, title, body slots and footer.
 * Inline styles only — email clients strip external CSS.
 */
export default function baseLayout({ status, statusLabel, title, intro, rows = [], note = '', footer }) {
  const accent = STATUS_COLORS[status] ?? '#2563eb';

  const rowsHtml = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;width:42%;">${escapeHtml(label)}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111827;font-weight:600;">${escapeHtml(value)}</td>
      </tr>`,
    )
    .join('');

  const noteHtml = note
    ? `<div style="margin-top:20px;padding:12px 16px;background:#fef2f2;border-left:4px solid ${accent};border-radius:0 6px 6px 0;font-size:13px;color:#7f1d1d;">${escapeHtml(note)}</div>`
    : '';

  return {
    subject: title,
    text: [
      title,
      intro,
      ...rows.map(([label, value]) => `${label}: ${value}`),
      note,
      footer,
    ]
      .filter(Boolean)
      .join('\n'),
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:${accent};padding:18px 28px;">
              <span style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#ffffff;opacity:0.9;">Heartbeat Monitor</span>
              <div style="font-size:20px;font-weight:700;color:#ffffff;margin-top:2px;">${escapeHtml(statusLabel)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 8px;font-size:20px;line-height:1.4;color:#111827;">${escapeHtml(title)}</h1>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4b5563;">${escapeHtml(intro)}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;border-collapse:collapse;">
                ${rowsHtml}
              </table>
              ${noteHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">${escapeHtml(footer)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}
