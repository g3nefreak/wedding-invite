# DataTable

Row actions accept `hidden: true` or `hidden: (row) => boolean`. Hidden actions
are omitted in both dropdown and inline modes. When all actions for a row are
hidden, no action buttons or empty dropdown trigger render.

```tsx
{ label: 'Edit', onClick: onEdit, hidden: (row) => row.status === 'Closed' }
```

Pass the existing `useTableState` or `useTableQuery` result as `table`. Rows,
columns, request status, and controlled selection remain separate props.

```tsx
<DataTable
  table={table}
  rows={query.data?.rows ?? []}
  totalCount={query.data?.totalCount ?? 0}
  columns={columns}
  getRowId={(row) => row.id}
  isLoading={query.isLoading}
  isFetching={query.isFetching}
  error={query.error}
/>
```

Server processing is the default. All supplied rows render in their supplied
order. The component never searches, filters, sorts, or slices that server page.
`totalCount` is required and must be the server's total matching row count.
The page's TanStack Query hook calls a feature service using shared Axios;
DataTable does not fetch. Only columns explicitly declaring `enableSorting: true`
offer sorting. The hook exposes state and handlers for the request parameters.

Server pagination stays under caller control, including empty responses.
Invalidating a query refetches its current parameters; it does not reset the
table page. A mutation that should return to page 1 must update table state
explicitly as part of its success handling.

To process a complete in-memory dataset, pass `clientSide` and omit `totalCount`:

```tsx
const filterRow = useCallback(
  (row: User) => !status || row.status === status,
  [status],
)

<DataTable
  table={table}
  clientSide
  rows={allUsers}
  columns={columns}
  search={search}
  filterRow={filterRow}
  getRowId={(row) => row.id}
/>
```

Client mode applies the custom predicate, case-insensitive text search over
searchable accessor values, column sorting, then pagination. Use
`enableGlobalFilter: false` to exclude a column from search and TanStack column
`sortingFn` for custom sorting. Counts come from the filtered dataset. Search and
predicate changes reset to page 1; memoize the predicate so unrelated renders do
not reset the page. Dataset shrinkage clamps to the last valid page. Limit changes
reset via the existing hook; sorting preserves the page.

Selected IDs remain caller-controlled across both modes. Select-all affects only
eligible rows on the visible page. `search` and `filterRow` have no effect in
server mode; send server search/filter parameters through the query and service.

Audit Logs demonstrates real pagination through
`useAuditLogsQuery` → `AuditLogsService.GET_ALL` → shared Axios →
`GET /v1/audit-logs?page=1&page_size=10`. Its API supplies a `data` array and
`meta.total`; the service maps the table's `limit` to `page_size`. The table shows
actor, role, module, action, HTTP method/status, IP address and the API's
Asia/Manila wall-clock timestamp without converting it to the browser timezone.
Filters support `actor`, `module`, `request_method`, `status_code`, `date_from`
and `date_to`. Dates are validated calendar strings in `YYYY-MM-DD` format, with
the end date on or after the start. Search and sorting controls are disabled
because the endpoint does not document those parameters. Axios base URL and
Bearer token handling follow the auth services. The endpoint is restricted to
RGO by the API. No export/detail UI is implemented here.
`UsersTableExample` remains an unrouted server-mode example with a mock service.

The audit hook directly returns TanStack Query's result and accepts partial
pagination/filter parameters plus an `enabled` boolean, defaulting to true.
The hook sets `placeholderData: keepPreviousData`; native query
behavior determines loading/error data. A failed request for a new page clears
its placeholder rows. The service accepts optional parameters with `GET_ALL()`
and returns the Axios response body.
