# Subscription payment module

The application collects subscription payments manually through bKash Send Money. Application admins submit a transaction ID for verification; a superadmin approves or rejects the request. Subscription coverage begins only when a payment is approved. This module is separate from the existing organization fuel-billing `payments` and `invoices` tables.

## Packages and start date

| Package | Code | Price | Coverage |
| --- | --- | ---: | ---: |
| Monthly | `monthly` | BDT 2,000 | 1 month |
| 6 Months | `six_months` | BDT 11,000 | 6 months |
| Yearly | `yearly` | BDT 20,000 | 12 months |

The first payable month is **September 2026**. The application does not require or accept a subscription payment before September 1, 2026. Package definitions and this start date are maintained in `app/Services/SubscriptionService.php`.

## Earliest unpaid month

The backend begins at September 2026 and walks forward through contiguous **approved** coverage for the paying admin. The first month outside that coverage is the next unpaid month. Pending and rejected payments do not advance it. Paying admins cannot submit a start month, end month, amount, payment method, or user ID; the backend derives those values from the authenticated user and selected package.

| Approved coverage | Next unpaid month | A new 6 Months payment covers |
| --- | --- | --- |
| None | September 2026 | September 2026 – February 2027 |
| September 2026 | October 2026 | October 2026 – March 2027 |
| September 2026 – February 2027 | March 2027 | March 2027 – August 2027 |

An admin who returns in December 2026 without any approved payment still starts in September 2026. Coverage is calculated by calendar months: September 1–30 for Monthly, September 2026–February 2027 for 6 Months, and September 2026–August 2027 for Yearly.

The navbar shows **Payment Due** when the current calendar month is at or after the next unpaid month. It stays hidden before September 2026 and while the current month is covered. Future months are not marked overdue.

## Admin payment workflow

1. Open **Payments** to see status, current coverage, covered-until date, next unpaid month, pending request, and history.
2. Choose **Pay Now** and select a package. The displayed coverage is a preview calculated by the backend.
3. In bKash, select **Send Money**, send the exact amount to the personal number **01751763310**, and copy the transaction ID (TrxID).
4. Enter the TrxID and submit. The request becomes **Pending** and gives no coverage yet.
5. After superadmin approval, download the invoice and money receipt from payment history. A rejected request may be replaced with a new request for the same unpaid month using a different TrxID.

Payment history is paginated at 10 requests per page. Each row groups its coverage dates and offers approved invoice and receipt downloads from the Documents menu.

Only one pending request is allowed for each paying admin at a time. Transaction IDs are unique across all subscription payments, including rejected records, so a previously submitted TrxID cannot be reused. The payment reference shown in history is `SP-` followed by the zero-padded database ID.

## Superadmin review workflow

The `superadmin` role is the only role allowed to review subscription payments. Superadmins open **Subscription Payments** to filter by status, customer name, or submission date, then view a payment and approve or reject it. A rejection can include a reason.

Approval runs in a database transaction. It locks the paying admin and payment rows, confirms the payment remains pending, and checks that its coverage still starts at the earliest unpaid month. It then records the approver and approval time and assigns one invoice number and one receipt number. Repeating approval of an already approved payment returns the existing record without changing its numbers or approval time. Rejection records the rejecting superadmin, time, and optional reason; it creates no coverage. Approved records cannot be rejected later.

## Records and documents

Migration `database/migrations/2026_10_10_000000_create_subscription_payments_table.php` creates `subscription_payments`. Migration `database/migrations/2026_10_10_000001_add_superadmin_role_to_users_table.php` adds the `superadmin` user role. Each payment row stores the paying admin user ID, package code and name, duration, amount, payment method, TrxID, coverage dates, status, submission time, approval or rejection audit fields, and document numbers. There is no separate subscription or plan table; approved payment rows are the coverage ledger, and packages are fixed backend definitions.

Approved payments have downloadable PDFs generated with the application's existing WeasyPrint library and `resources/views/subscription-document-pdf.blade.php`:

- Invoice: `INV-<approval year>-<payment ID padded to six digits>`. It shows customer, package, coverage, amount, bKash method and TrxID, invoice date, and Paid status.
- Money receipt: `MR-<approval year>-<payment ID padded to six digits>`. It shows customer, package, coverage, amount, method and TrxID, submission date as payment date, approving superadmin, and receipt date.

The numbers are saved on approval; the PDFs are rendered on download. No duplicate document rows or files are created by repeat requests. A PDF is unavailable until approval.

The invoice and money receipt use the Texon blue and cyan document design from the supplied September 2026 invoice sample. The shared header and footer artwork is stored in `public/subscription-documents/`; the content shows the actual approved package, coverage, amount, bKash TrxID, and document number. An approved subscription invoice shows the full amount paid and a zero due balance. The separate receipt records the payment date. The "Invoice to" and "Received from" blocks always show Head of Filling Station, CSD Filling Station, and csdfillingstation@gmail.com, and the receipt displays Texon Software Solutions as its approver. The actual approving superadmin is still recorded in the payment audit fields. The sample's bank account details are not used because subscription payments are made by bKash.

## Access and routes

Subscription ownership is **per admin account**. Organizations belonging to that admin share the account's subscription status; subscriptions are not billed separately for each organization. Authenticated active `admin` accounts can see and submit only their own payments and download only their own approved documents. Ordinary `user` accounts have no subscription access. The `is_superadmin` middleware protects review routes; superadmins can view all requests and download approved documents. Superadmins retain access to existing application admin features through `is_admin`, but cannot submit a subscription payment for themselves.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/subscription-payments` | Admin | Dashboard and history |
| GET | `/subscription-payments/pay` | Admin | Package selection and instructions |
| POST | `/subscription-payments` | Admin | Submit TrxID and package code |
| GET | `/subscription-payments/{subscriptionPayment}/invoice` | Owner admin or superadmin | Download approved invoice |
| GET | `/subscription-payments/{subscriptionPayment}/receipt` | Owner admin or superadmin | Download approved receipt |
| GET | `/admin/subscription-payments` | Superadmin | Filter and list requests |
| GET | `/admin/subscription-payments/{subscriptionPayment}` | Superadmin | View request |
| POST | `/admin/subscription-payments/{subscriptionPayment}/approve` | Superadmin | Approve request |
| POST | `/admin/subscription-payments/{subscriptionPayment}/reject` | Superadmin | Reject request |

The only admin submission fields are `plan_code` and `transaction_id`. A rejection request may include `rejection_reason`.

## Setup and verification

Apply both feature migrations and build frontend assets in each deployment environment:

```bash
php artisan migrate --path=database/migrations/2026_10_10_000000_create_subscription_payments_table.php --force
php artisan migrate --path=database/migrations/2026_10_10_000001_add_superadmin_role_to_users_table.php --force
npm run build
```

A superadmin account is required to review payments. Once one exists, that account can create additional superadmins in the Users page. Ordinary admins cannot create, edit, or delete superadmin accounts.

WeasyPrint must be installed and reachable at `WEASYPRINT_BINARY` (the project default is `/opt/homebrew/bin/weasyprint`). `WEASYPRINT_TIMEOUT` can override its default timeout. The same setup serves the application's existing PDF reports.

Run the feature tests with:

```bash
php artisan test tests/Feature/SubscriptionPaymentTest.php
```

The tests cover the September 2026 boundary, month-based package coverage, overdue months, request tampering, pending and rejected states, resubmission, duplicate TrxIDs, role boundaries, access control, navbar status, repeat approval with a stale payment instance, and both PDF downloads. Concurrent approval is guarded by database row locks and idempotent state checks; the SQLite test suite does not run simultaneous database processes.
