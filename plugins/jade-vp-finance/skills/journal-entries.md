# Journal Entry Skill

## Activation

Auto-fires when the user provides transaction data, bank exports, or
asks to record financial transactions.

## Double-entry bookkeeping format

Every transaction: Debit = Credit

```
Date       | Account              | Debit   | Credit
-----------|----------------------|---------|--------
2026-03-01 | Expenses:SaaS        | 299.00  |
           | Liabilities:CC       |         | 299.00
```

## Chart of accounts (starter)

- `Assets:Cash`
- `Assets:AR`
- `Liabilities:AP`
- `Liabilities:CC`
- `Revenue:SaaS`
- `Expenses:Payroll`
- `Expenses:SaaS`
- `Expenses:Marketing`
- `Expenses:Infrastructure`

## Output format

```yaml
journal_entry:
  date: "YYYY-MM-DD"
  description: "..."
  lines:
    - account: "Expenses:SaaS"
      debit: 299.00
    - account: "Liabilities:CC"
      credit: 299.00
```
