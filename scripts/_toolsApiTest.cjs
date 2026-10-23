// Exercises /api/admin/tools CRUD on the local admin dev server.
const BASE = 'http://localhost:3009';
const COOKIE = 'admin_session=' + encodeURIComponent(JSON.stringify({
  id: 'qa-script', email: 'yurekhsolutions@gmail.com', role: 'owner',
}));

async function call(method, path, body, withCookie = true) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(withCookie ? { cookie: COOKIE } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = text.slice(0, 160); }
  return { status: res.status, body: parsed };
}

(async () => {
  console.log('1) GET without session (expect 401) ->', JSON.stringify(await call('GET', '/api/admin/tools', null, false)));

  const list = await call('GET', '/api/admin/tools');
  console.log('2) GET list ->', list.status, '| tools:', Array.isArray(list.body.tools) ? list.body.tools.length : list.body,
    '| total:', list.body.total, '| active:', list.body.active);

  const created = await call('POST', '/api/admin/tools', {
    name: 'QA Temp Tool', description: 'temp row', category: 'ai', creditCost: 4,
  });
  console.log('3) POST create ->', created.status, '| slug:', created.body.slug);

  const dup = await call('POST', '/api/admin/tools', { name: 'QA Temp Tool' });
  console.log('4) POST duplicate slug (expect 409) ->', dup.status, dup.body.error || '');

  if (created.body.id) {
    const patched = await call('PATCH', `/api/admin/tools/${created.body.id}`, {
      name: 'QA Temp Tool Renamed', creditCost: 7, isActive: false,
    });
    console.log('5) PATCH update ->', patched.status, '| name:', patched.body.name,
      '| cost:', patched.body.creditCost, '| active:', patched.body.isActive);

    const badCost = await call('PATCH', `/api/admin/tools/${created.body.id}`, { creditCost: -3 });
    console.log('6) PATCH invalid cost (expect 400) ->', badCost.status, badCost.body.error || '');

    const del = await call('DELETE', `/api/admin/tools/${created.body.id}`);
    console.log('7) DELETE ->', del.status, JSON.stringify(del.body));

    const gone = await call('PATCH', `/api/admin/tools/${created.body.id}`, { name: 'x' });
    console.log('8) PATCH deleted row (expect 404) ->', gone.status, gone.body.error || '');
  }

  const filtered = await call('GET', '/api/admin/tools?status=active&category=finance');
  console.log('9) GET filter active+finance ->', filtered.status, '| rows:', Array.isArray(filtered.body.tools) ? filtered.body.tools.length : '?');
})();
