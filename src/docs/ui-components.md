# HCMS UI components

Shared building blocks in `src/presentation/components/ui/`. Use them instead of
styling buttons, cards, badges, and fields by hand, so every screen looks and
behaves the same.

```js
import { Button, Card, PageHeader, TextField, StatusBadge, useToast } from "@/presentation/components/ui";
```

**See them live:** run `npm run dev` and open `/dev/ui` (development only, not
included in production builds). `tests/browser/ui-components.spec.js` checks
their behaviour.

| Component | Use it for | Notes |
|---|---|---|
| `PageHeader` | The title of every routed page | Renders the page's only `<h1>`; optional eyebrow, description, actions. |
| `Card` | Any content block | `title`, `description`, `actions`; `as="article"` for list items; `tone="danger"`. |
| `Button`, `ButtonLink` | Every action and action-styled link | `variant`: primary, secondary, danger, danger-outline, ghost. `size`: sm, md, lg. `loading` + `loadingText`. Hover, focus, and disabled are built in. Never stretches in a grid. |
| `Badge`, `StatusBadge` | Statuses and tags | `StatusBadge status="IN_PROGRESS" labelPrefix="…statuses"` translates and colours by `STATUS_TONES`. Never stretches or wraps. |
| `TextField`, `SelectField`, `TextareaField`, `Field` | Form controls | Label, hint, and error are linked by id (screen readers, click-to-focus). `required` adds the star; `optionalLabel` adds "(optional)". |
| `Alert` | A message tied to a place: form error, load failure, note | `tone`: error, warning, info, success. |
| `useToast()` | "It worked" / "it failed" after an action | `toast.success(msg)` closes after 6 s; `toast.error(msg)` stays. Do not add inline success banners. |
| `LoadingState`, `EmptyState`, `ErrorState` | The three non-data states of a list or page | `ErrorState onRetry={…}`. |
| `ConfirmAction` | Irreversible actions (deactivate, resolve, cancel) | Asks in place before calling `onConfirm`. |
| `DescriptionList` | Read-only label/value data | Skips empty values, so no lone "—". `wide` spans the full row. |
| `Tabs`, `TabLinks` | Splitting a long page / linking sibling routes | Keyboard: arrows (follow reading direction), Home, End. |
| `SelectableCard` | Choosing an item from a list (patient, plan) | `selected`, `title`, `meta`, `aside`. |

Utilities:

- `useFormatDate()` → `date(value)`, `dateTime(value)`. One format for the
  whole app, following the interface language (`5 Nov 2026, 14:07` /
  `5 نوفمبر 2026، 2:07 م`).
  Date-only strings (`2026-11-05`) never shift a day.
- `cx(...classes)` joins class names.

Rules:

1. New screens use these components. Only add a new one when no existing
   component fits, and add it to the gallery and its spec.
2. Colours come from the theme tokens (`primary`, `danger`, `success`,
   `warning`, `surface`, `background`, `border`, `text-*`), never hex values.
3. Feedback after an action goes through `useToast()`; inline `Alert` is for
   messages that belong to a specific place on the page.
