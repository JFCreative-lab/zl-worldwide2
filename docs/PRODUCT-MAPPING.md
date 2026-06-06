# Product Mapping for Automatic Print/Ship

Automatic print and ship only works after every storefront product/size is mapped to a real print-on-demand variant.

For Printful:

1. Create your products in Printful.
2. For every product and size, copy the `sync_variant_id`.
3. Add a JSON map as the `PRINTFUL_VARIANT_MAP` environment variable in Cloudflare Workers.

Example:

```json
{
  "hoodie-black:XS": "123456789",
  "hoodie-black:S": "123456790",
  "hoodie-white:M": "123456799",
  "cap-black:One Size": "123456800"
}
```

The key format is:

```text
storefront-product-id:size
```

Important:

- Keep `PRINTFUL_CONFIRM=false` while testing. This creates draft orders instead of charging/printing.
- Switch `PRINTFUL_CONFIRM=true` only when payment is confirmed automatically and your Printful billing method is active.
- Printful/Printify accounts can be free, but every product and shipment still has production and shipping cost.
