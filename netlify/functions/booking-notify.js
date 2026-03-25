// Netlify Function — fires on booking form submission
// Sends WhatsApp Business API message to Jason
// ENV VARS needed in Netlify dashboard:
//   WHATSAPP_TOKEN       = your Meta WhatsApp Business API token
//   WHATSAPP_PHONE_ID    = your WhatsApp Business phone number ID
//   JASON_WHATSAPP       = Jason's phone in E.164 format e.g. 34631462061

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { nombre, telefono, email, servicio, fecha, mensaje } = data;

  const token    = process.env.WHATSAPP_TOKEN;
  const phoneId  = process.env.WHATSAPP_PHONE_ID;
  const jasonNum = process.env.JASON_WHATSAPP;

  if (!token || !phoneId || !jasonNum) {
    console.error('Missing WhatsApp env vars');
    return { statusCode: 500, body: 'WhatsApp not configured' };
  }

  // Build message text
  const text = `🗓️ *Nueva Reserva — Jeins.Studio®*\n\n` +
    `👤 *Nombre:* ${nombre}\n` +
    `📞 *Teléfono:* ${telefono}\n` +
    `📧 *Email:* ${email}\n` +
    `✨ *Servicio:* ${servicio}\n` +
    `📅 *Fecha preferida:* ${fecha}\n` +
    (mensaje ? `💬 *Mensaje:* ${mensaje}\n` : '') +
    `\n_Enviado desde jeinsstudio.com_`;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: jasonNum,
          type: 'text',
          text: { body: text },
        }),
      }
    );

    const result = await res.json();

    if (!res.ok) {
      console.error('WhatsApp API error:', result);
      return { statusCode: 502, body: JSON.stringify(result) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, whatsapp: result }),
    };
  } catch (err) {
    console.error('Fetch error:', err);
    return { statusCode: 500, body: err.message };
  }
};
