/* MODO CARRERA · prueba de actualización
   1) Con la versión ANTERIOR (carpeta "srv" apuntando a la base) se crea una carrera y se juegan partidos.
   2) Se cambia "srv" a la versión NUEVA en la MISMA dirección (mismo almacenamiento del navegador).
   3) Se recarga y se comprueba: misma carrera, mismos datos, copia automática "Antes de actualizar" y respaldo nuevo.
   Uso: node tests/actualizacion.mjs <url> <ruta-srv> <dir-base> <dir-nueva>                                   */
import { chromium } from 'playwright';
import { rmSync, symlinkSync } from 'node:fs';
const [URL, SRV, BASE, NUEVA] = process.argv.slice(2);
const link = to => { rmSync(SRV, { force: true }); symlinkSync(to, SRV); };
const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
await ctx.route(u => !u.href.startsWith(new globalThis.URL(URL).origin), r => r.abort());
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
page.on('dialog', d => d.accept());

link(BASE);
await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1500);
const antes = await page.evaluate(() => {
  go('newcareer'); const c = document.getElementById('country'); c.value = 'Argentina'; fillClubs();
  document.getElementById('clubChoice').value = 'River Plate'; createCareer();
  for (let i = 0; i < 6; i++) { openMatch(); mcSimEnd(); match.finished = true; }
  save();
  return { title: document.title, id: career.id, round: career.round, points: career.points, gf: career.gf, ga: career.ga, squad: career.players.map(p => p.name).join('|'), budget: career.budget, transfers: (career.transferHistory || []).length };
});
// cerrar service worker/caché de la versión anterior no aplica (la base no tiene SW)
link(NUEVA);
await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(2000);
const despues = await page.evaluate(async () => {
  const snaps = window.MCStore ? await MCStore.listSnapshots() : [];
  const resp = window.MCRespaldo ? await MCRespaldo.ready : null;
  return { title: document.title, id: career && career.id, round: career && career.round, points: career && career.points, gf: career && career.gf, ga: career && career.ga,
    squad: career && career.players.map(p => p.name).join('|'), budget: career && career.budget, transfers: career && (career.transferHistory || []).length,
    snapshot: snaps.map(s => s.reason).filter(r => /Antes de actualizar/.test(r)), respaldo: resp, motor: window.mcMotorDe ? mcMotorDe(career) : 'v1' };
});
// seguir jugando con la versión nueva
const sigue = await page.evaluate(() => { const r0 = career.round; openMatch(); mcSimEnd(); match.finished = true; save(); return career.round > r0 || career.round === r0; });
await browser.close();
const mismos = ['id', 'round', 'points', 'gf', 'ga', 'squad', 'budget', 'transfers'].every(k => antes[k] === despues[k]);
const ok = mismos && despues.motor === 'v1' && despues.snapshot.length > 0 && despues.respaldo === 'copiada' && sigue && errors.length === 0;
console.log('ACTUALIZACIÓN', ok ? 'OK' : 'FALLÓ');
console.log(' antes  ', antes.title, JSON.stringify({ ...antes, squad: antes.squad.split('|').length + ' jugadores' }));
console.log(' después', despues.title, JSON.stringify({ ...despues, squad: (despues.squad || '').split('|').length + ' jugadores' }));
console.log(' datos idénticos:', mismos, '· copia automática:', despues.snapshot, '· respaldo:', despues.respaldo, '· errores:', errors);
process.exit(ok ? 0 : 1);
