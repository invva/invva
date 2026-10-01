# Invva

> Simplifying inventory management

**Simple. Fast. Free to self-host.** Open source (MIT).

Invva is an inventory management app for small retail shops, online sellers and small manufacturers. Track products,
stock movements, warehouses and suppliers without the complexity.

> **Status: early development (v0.1).** It works end to end, but the database schema is not in this repo yet
> (see [Database setup](#database-setup)), so self-hosting currently needs manual Supabase work. Expect breaking changes.

## Features

- Products with SKU, barcode field, category, unit price, reorder point and supplier
- Stock movements (in, out, adjustment) per warehouse
- Multiple warehouses and a supplier directory
- Dashboard with stock value, low-stock alerts and recent activity, filterable by warehouse
- Reports with CSV export (inventory summary, movements, low stock)
- Audit log of changes
- Passwordless sign-in with a 6-digit email code
- Responsive layout for phone, tablet and desktop

Not built yet: barcode scanning, real-time updates, roles and permissions.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript
- [Material UI](https://mui.com) 9 and Tailwind CSS 4
- [Supabase](https://supabase.com) (Postgres, Auth) via `@supabase/ssr`

## Getting started

### Prerequisites

- Node.js 22.13 or newer
- A free [Supabase](https://supabase.com) project

### Run locally

```bash
git clone https://github.com/invva/invva.git
cd invva
npm install
cp .env.example .env.local   # then fill in your Supabase URL and anon key
npm run dev
```

Open <http://localhost:3000>. Sign in at `/login`.

### Environment variables

| Variable                        | Where to find it                                     |
| ------------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase dashboard -> Project Settings -> API        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard -> Project Settings -> API (anon) |

Both are public by design: security comes from Row Level Security in your database, not from hiding these keys.
Do not add the `service_role` key.

### Authentication setup

Sign-in uses Supabase email OTP:

1. Supabase dashboard -> Authentication -> Email Templates -> **Magic Link**. Make sure the template contains
   `{{ .Token }}` so users receive the 6-digit code (the default template sends a link instead).
2. To make your instance **invite-only**: Authentication -> Sign In / Providers -> turn **off** "Allow new users to
   sign up", then add people under Authentication -> Users -> **Invite user**.

### Database setup

The app expects these tables in the `public` schema. **The SQL for them (tables, triggers and Row Level Security
policies) is not published yet**; it is tracked in
[#26](https://github.com/invva/invva/issues/26) and [#27](https://github.com/invva/invva/issues/27).

| Table             | Columns the app uses                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `warehouses`      | id, name, code, street_address, city, state, zip_code, contact_person, contact_email, contact_phone, is_active, is_default, notes, created_at                            |
| `suppliers`       | id, name, contact_person, email, phone, address, city, state, postal_code, country, website, tax_id, payment_terms, notes, is_active, created_by, created_at, updated_at |
| `products`        | id, name, sku, barcode, description, unit_of_measure, category, unit_price, reorder_point, current_stock, warehouse_id, supplier_id, custom_fields, user_id, created_at  |
| `stock_movements` | id, product_id, warehouse_id, movement_type (`IN` / `OUT` / `ADJUSTMENT`), quantity, reference_number, notes, movement_date, user_id, created_at                         |
| `audit_logs`      | id, table_name, record_id, action (`INSERT` / `UPDATE` / `DELETE`), user_id, user_email, old_data, new_data, changed_fields, created_at                                  |

Two things the app **reads but never writes**, so your database must provide them:

- `products.current_stock` must be kept up to date from `stock_movements` (for example with a trigger).
- `audit_logs` must be filled by database triggers on the other tables.

Enable Row Level Security on every table. The browser talks to Supabase directly, so RLS is the only access control.

## Scripts

| Command         | What it does                     |
| --------------- | -------------------------------- |
| `npm run dev`   | Start the dev server (Turbopack) |
| `npm run build` | Production build                 |
| `npm run start` | Serve the production build       |
| `npm run lint`  | Run ESLint                       |

## Roadmap

- Publish the database schema and migrations so setup is one command
- Server-side authentication and stricter access control
- Support for databases other than Supabase, through Prisma
- Tests and CI

## Contributing

Issues and pull requests are welcome. Please open an issue before starting large changes. Work is tracked on the
[project board](https://github.com/orgs/invva/projects/1).

## Contact

- Email: admin@invva.io
- Website: https://invva.io (coming soon)

## License

[MIT](LICENSE)
