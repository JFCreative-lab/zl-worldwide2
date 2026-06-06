const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
    const url = new URL(request.url);
    if (url.pathname !== "/order" || request.method !== "POST") {
      return json({ ok: false, error: "Use POST /order" }, 404);
    }

    try {
      const order = await request.json();
      validateOrder(order);

      const result = {
        ok: true,
        status: env.MODE === "dry_run" ? "dry_run_order_received" : "order_received",
        orderId: order.id,
        fulfillment: null,
        email: null
      };

      if ((env.FULFILLMENT_PROVIDER || "dry_run") === "printful" && env.PRINTFUL_TOKEN) {
        result.fulfillment = await createPrintfulOrder(order, env);
        result.status = env.PRINTFUL_CONFIRM === "true" ? "sent_to_printful" : "printful_draft_created";
      }

      if (env.RESEND_API_KEY && env.OWNER_EMAIL) {
        result.email = await sendOwnerEmail(order, result, env);
      }

      return json(result, 200);
    } catch (error) {
      return json({ ok: false, error: error.message }, 400);
    }
  }
};

function validateOrder(order) {
  if (!order || typeof order !== "object") throw new Error("Missing order");
  if (!order.id) throw new Error("Missing order id");
  if (!order.customer?.email || !order.customer?.name) throw new Error("Missing customer name/email");
  if (!order.customer?.address || !order.customer?.city || !order.customer?.postal || !order.customer?.country) {
    throw new Error("Missing delivery address");
  }
  if (!Array.isArray(order.items) || !order.items.length) throw new Error("Missing order items");
}

async function createPrintfulOrder(order, env) {
  const variantMap = JSON.parse(env.PRINTFUL_VARIANT_MAP || "{}");
  const items = order.items.map(item => {
    const key = `${item.id}:${item.size}`;
    const variantId = variantMap[key];
    if (!variantId) throw new Error(`No Printful variant mapped for ${key}`);
    return {
      sync_variant_id: Number(variantId),
      quantity: Number(item.qty || 1),
      retail_price: String(item.price || "0.00"),
      name: item.name
    };
  });

  const payload = {
    external_id: order.id,
    confirm: env.PRINTFUL_CONFIRM === "true",
    recipient: {
      name: order.customer.name,
      email: order.customer.email,
      address1: order.customer.address,
      city: order.customer.city,
      zip: order.customer.postal,
      country_name: order.customer.country
    },
    items
  };

  const response = await fetch("https://api.printful.com/orders", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.PRINTFUL_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Printful error: ${JSON.stringify(body)}`);
  return body;
}

async function sendOwnerEmail(order, result, env) {
  const text = [
    `New ZL Worldwide order: ${order.id}`,
    `Status: ${result.status}`,
    `Customer: ${order.customer.name} <${order.customer.email}>`,
    `Address: ${order.customer.address}, ${order.customer.postal} ${order.customer.city}, ${order.customer.country}`,
    `Total: EUR ${Number(order.total || 0).toFixed(2)}`,
    "",
    "Items:",
    ...order.items.map(item => `- ${item.name} / ${item.size} / qty ${item.qty}`)
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: [env.OWNER_EMAIL],
      subject: `New ZL Worldwide order ${order.id}`,
      text
    })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Email error: ${JSON.stringify(body)}`);
  return body;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json"
    }
  });
}
