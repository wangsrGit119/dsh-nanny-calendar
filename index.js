/**
 * dsh-nanny-calendar — Host half.
 *
 * The whole feature lives in the browser: `client.js` registers a sidebar row
 * (`sidebar.panellist`) plus its `main` page and keeps the records in
 * localStorage. Nothing on the Host side is needed, so `apply` is empty on
 * purpose — the bundle patch still has to insert a row, and a row needs a
 * plugin to instantiate.
 */
export function apply() {}
