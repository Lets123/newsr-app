# Finance Backend Contracts (Step 4)

This project is still frontend-first, but these contracts lock in backend behavior so screens can connect without redesign.

## API Endpoints

- `GET /api/v1/invoices?status=open`
- `POST /api/v1/payments`
- `GET /api/v1/payments`
- `POST /api/v1/expenses`
- `GET /api/v1/expenses`
- `POST /api/v1/other-income`
- `GET /api/v1/other-income`
- `GET /api/v1/ledger?from=YYYY-MM-DD&to=YYYY-MM-DD`

## Request/Response Shapes

### Create Payment

Request:

```json
{
  "invoiceId": "INV-2026-0003",
  "amount": 500,
  "method": "cash",
  "note": "Partial collection"
}
```

Response:

```json
{
  "id": "PAY-173211123",
  "invoiceId": "INV-2026-0003",
  "amount": 500,
  "method": "cash",
  "date": "2026-04-27"
}
```

### Create Expense

Request:

```json
{
  "date": "2026-04-27",
  "category": "Transport",
  "paidBy": "Warehouse",
  "amount": 120,
  "note": "Courier and loading"
}
```

### Create Other Income

Request:

```json
{
  "date": "2026-04-27",
  "type": "Commission",
  "source": "Brand Partner",
  "amount": 300,
  "note": ""
}
```

## Business Rules

- Soft delete only (`is_deleted = true`), no hard deletion for accounting records.
- Invoice line `unit_price_snapshot` is immutable after invoice issue.
- Collection amount cannot exceed current invoice due.
- Customer channel is `wholesale` or `retail`; retail is enabled later without schema changes.
- Ledger is computed from base tables (`payments`, `expenses`, `other_income`) and not directly editable.

## Frontend Integration Point

Frontend pages now use `src/data/financeService.js`.  
To move from local storage to backend:

1. Keep the same service function names.
2. Replace service internals with HTTP calls to endpoints above.
3. Keep page components unchanged.

## Runtime Mode Toggle

- Default mode is local storage (`VITE_USE_API=false`).
- To use backend endpoints, create `.env` in project root:

```bash
VITE_USE_API=true
```

- Restart Vite after changing env values.
