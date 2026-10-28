import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import GameWorld from './GameWorld.jsx';
import Lighting from './environment/Lighting.jsx';
import { CATALOG } from './shopping.js';
import './Kopdes3D.css';

const rupiah = value => `Rp${value.toLocaleString('id-ID')}`;
const shoppingStages = ['SHOPPING_ACTIVE', 'READY_FOR_CHECKOUT'];
const feedbackText = {
  OUT_OF_STOCK: 'Stok produk habis.', BUDGET_EXCEEDED: 'Uang tidak cukup. Kurangi isi keranjang.',
  SHOPPING_LIST_INCOMPLETE: 'Daftar belanja belum lengkap.', TIME_EXPIRED: 'Waktu misi habis. Ulangi misi.',
  CASHIER_OUT_OF_RANGE: 'Dekati kasir untuk membayar.', PRODUCT_OUT_OF_RANGE: 'Dekati rak produk yang sesuai.',
};

function ShoppingDialog({ mode, objective, onAction, onRetry, returnFocus, error }) {
  const dialog = useRef(null);
  useLayoutEffect(() => {
    if (!mode) return;
    const element = dialog.current;
    const previous = document.activeElement;
    const fallback = returnFocus.current;
    if (!element.open) element.showModal();
    element.querySelector('[data-initial-focus]')?.focus();
    return () => {
      element.close();
      const target = previous?.isConnected && previous !== document.body && !element.contains(previous) ? previous : fallback;
      target?.focus();
    };
  }, [mode, returnFocus]);
  const receipt = objective?.receipt;
  const score = objective?.score;
  function dismiss() {
    if (mode === 'receipt') onAction({ type: 'CLOSE_RECEIPT' });
    else if (mode === 'greeting') onAction({ type: 'CLOSE_DIALOG' });
  }
  return <dialog className="kopdes-dialog" ref={dialog} aria-labelledby="kopdes-dialog-title"
    onCancel={event => { event.preventDefault(); dismiss(); }}>
    {mode === 'greeting' && <>
      <h2 id="kopdes-dialog-title">Kasir KOPDES</h2>
      <p>Selamat datang! Periksa belanjaan sebelum membayar.</p>
      {objective.stage !== 'READY_FOR_CHECKOUT' && <p role="status">Barang belum lengkap. Kembali belanja sesuai daftar.</p>}
      <ul className="kopdes-receipt-items">{CATALOG.filter(item => objective.basket[item.id] > 0).map(item => <li key={item.id}>
        <span>{item.name} × {objective.basket[item.id]}</span><b>{rupiah(item.price * objective.basket[item.id])}</b>
      </li>)}</ul>
      <dl className="kopdes-totals"><div><dt>Total</dt><dd>{rupiah(objective.basketTotal)}</dd></div>
        <div><dt>Uang tersedia</dt><dd>{rupiah(objective.budget)}</dd></div>
        <div><dt>Sisa setelah bayar</dt><dd>{rupiah(objective.budget - objective.basketTotal)}</dd></div></dl>
      <p>Pembayaran simulasi, bukan pembayaran sungguhan.</p>
      <div className="kopdes-actions">
        <button type="button" data-initial-focus onClick={dismiss}>Kembali belanja</button>
        <button type="button" disabled={objective.stage !== 'READY_FOR_CHECKOUT' || objective.basketTotal > objective.budget}
          onClick={() => onAction({ type: 'CHECKOUT' })}>Konfirmasi bayar {rupiah(objective.basketTotal)}</button>
      </div>
    </>}
    {mode === 'receipt' && receipt && <>
      <h2 id="kopdes-dialog-title" tabIndex={-1} data-initial-focus>Struk belanja · LUNAS</h2>
      <p>{receipt.kopdesName} · {receipt.missionName}</p>
      <p className="kopdes-transaction">Transaksi {receipt.transactionId}<br />{receipt.timestamp}</p>
      <ul className="kopdes-receipt-items">{receipt.items.map(item => <li key={item.productId}>
        <span>{item.name} × {item.quantity}<small>{rupiah(item.price)} per unit</small></span><b>{rupiah(item.subtotal)}</b>
      </li>)}</ul>
      <dl className="kopdes-totals"><div><dt>Total dibayar</dt><dd>{rupiah(receipt.total)}</dd></div>
        <div><dt>Uang awal</dt><dd>{rupiah(receipt.initialBudget)}</dd></div>
        <div><dt>Kembalian</dt><dd>{rupiah(receipt.change)}</dd></div></dl>
      <button type="button" onClick={dismiss}>Lihat hasil misi</button>
    </>}
    {mode === 'result' && score && <>
      <h2 id="kopdes-dialog-title" tabIndex={-1} data-initial-focus>Misi selesai!</h2>
      <p>Level {objective.levelId} · {objective.missionName} · Selesai dalam {Math.floor(objective.elapsedSeconds)} detik simulasi</p>
      <p className="kopdes-result-score">{score.score}/100 · {score.stars} bintang</p>
      <dl className="kopdes-totals"><div><dt>Pertarungan</dt><dd>{score.combat}/30</dd></div>
        <div><dt>Akurasi belanja</dt><dd>{score.accuracy}/40</dd></div>
        <div><dt>Anggaran</dt><dd>{score.budget}/20</dd></div>
        <div><dt>Waktu</dt><dd>{score.time}/10</dd></div>
        <div><dt>EXP sesi ini</dt><dd>{score.exp}</dd></div></dl>
      <p>Hasil sesi ini belum disimpan. Ulangi misi untuk bermain dari awal.</p>
      <div className="kopdes-actions"><button type="button" onClick={onRetry}>Ulangi misi</button><a href="/games">Kembali ke game</a></div>
    </>}
    {error && <p role="alert">{error}</p>}
  </dialog>;
}

export default function Kopdes3D() {
  const stage = useRef(null);
  const actionRef = useRef(null);
  const controlButton = useRef(null);
  const [locked, setLocked] = useState(false);
  const [combat, setCombat] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [controlError, setControlError] = useState('');
  const [actionError, setActionError] = useState('');
  const objective = combat?.objective;
  const shopping = shoppingStages.includes(objective?.stage);
  const failed = objective?.stage === 'MISSION_FAILED';
  const mode = objective?.stage === 'MISSION_COMPLETE' ? 'result' : objective?.stage === 'CHECKOUT_COMPLETE' ? 'receipt' : objective?.dialogState ? 'greeting' : null;
  const selected = CATALOG.find(item => item.id === objective?.prompt);
  const editable = shopping && !locked && !mode && combat?.playerHP > 0;

  useEffect(() => {
    if (attempt > 0) controlButton.current?.focus();
  }, [attempt]);

  useEffect(() => {
    function failed() { setControlError('Pointer lock ditolak. Aktifkan kontrol lagi melalui tombol di atas.'); }
    document.addEventListener('pointerlockerror', failed);
    return () => document.removeEventListener('pointerlockerror', failed);
  }, []);

  async function toggleControls() {
    const canvas = stage.current?.querySelector('canvas');
    if (!canvas || mode || failed || combat?.playerHP === 0) return;
    if (document.pointerLockElement === canvas) { document.exitPointerLock(); return; }
    try {
      if (!canvas.requestPointerLock) throw new Error('Pointer lock unavailable');
      setControlError('');
      setActionError('');
      canvas.focus();
      await canvas.requestPointerLock();
    } catch {
      setControlError('Kontrol mouse tidak tersedia. Izinkan pointer lock lalu coba lagi di browser desktop.');
    }
  }
  function dispatch(action) {
    const result = actionRef.current?.(action);
    setActionError(result?.ok ? '' : feedbackText[result?.reason] ?? 'Aksi ditolak. Periksa stok, anggaran, dan daftar. Dekati rak atau kasir yang sesuai.');
  }
  function retry() {
    document.exitPointerLock?.();
    actionRef.current = null;
    setLocked(false);
    setCombat(null);
    setControlError('');
    setActionError('');
    setAttempt(value => value + 1);
    controlButton.current?.focus();
  }
  function canAdd(item) {
    return editable && objective.prompt === item.id && objective.stockById?.[item.id] > 0 && objective.basketTotal + item.price <= objective.budget;
  }

  return <main className="kopdes">
    <header className="kopdes-top"><a href="/games">Kembali ke game</a><h1>KOPDES <b>3D</b></h1><span>LEVEL 01 · BELANJA PERTAMA</span></header>
    <section className="kopdes-controls" aria-label="Kontrol Owi">
      <button ref={controlButton} type="button" disabled={Boolean(mode) || failed || combat?.playerHP === 0} onClick={toggleControls}>{locked ? 'Lepas kontrol' : 'Aktifkan kontrol'}</button>
      <p role="status">{locked ? 'Kontrol aktif' : 'Kontrol dijeda'} · WASD gerak · Shift sprint · {shopping ? 'E ambil produk / bicara kasir · Esc ubah keranjang' : 'Klik/J serang · Q senjata · 1/Space dash'} · Mouse kamera · Esc jeda</p>
      {controlError && <p role="alert">{controlError}</p>}
    </section>
    <div className="kopdes-play">
      <div className="kopdes-stage" ref={stage}>
        <Suspense fallback={<p role="status">Memuat dunia 3D dan fisika...</p>}>
          <Canvas shadows="percentage" camera={{ position: [0, 3, 5], fov: 60, near: 0.1 }} dpr={[1, 1.5]} onCreated={({ gl }) => {
            gl.domElement.tabIndex = 0;
            gl.domElement.setAttribute('aria-label', 'Dunia KOPDES 3D. Aktifkan tombol kontrol untuk bergerak.');
          }} fallback={<p role="alert">Browser ini tidak mendukung WebGL.</p>}>
            <Lighting />
            <Physics key={attempt} paused timeStep={1 / 60} gravity={[0, -20, 0]} updatePriority={-50}>
              <GameWorld onLockChange={setLocked} onCombatChange={setCombat} actionRef={actionRef} />
            </Physics>
          </Canvas>
        </Suspense>
        {combat && <section className="kopdes-hud" aria-label="Status misi">
          <label>Owi <meter min="0" max="100" value={combat.playerHP} /> {combat.playerHP}/100</label>
          {!combat.cleared && <label>Penjaga <meter min="0" max="50" value={combat.enemyHP} /> {combat.enemyHP}/50</label>}
          {!shopping && <span>Senjata: {combat.stance === 'tray' ? 'Ompreng MBG' : 'Tinju'}{combat.pendingStance ? ' (diantrekan)' : ''} · Combo {combat.combo} · Dash: {combat.dashCooldown ? `${(combat.dashCooldown / 60).toFixed(1)} s` : 'siap'}</span>}
          <p role="status">{combat.playerHP === 0 ? 'Owi tumbang. Ulangi misi.' : objective?.label}</p>
          {objective && <>
            <span>Penjaga tersisa: {objective.remaining} · Gerbang: {objective.gate}</span>
            {objective.notification && <strong role="status">Gerbang KOPDES terbuka!</strong>}
            {selected && <strong>Tekan E · {selected.name} · {rupiah(selected.price)} · Stok {objective.stockById?.[selected.id] ?? 0}</strong>}
            {objective.cashierPrompt && <strong>Tekan E · Bicara dengan kasir</strong>}
          </>}
          <button type="button" onClick={retry}>Ulangi misi</button>
        </section>}
      </div>
      {objective && <aside className="kopdes-shopping" aria-label="Daftar dan keranjang belanja">
        <h2>Daftar belanja</h2>
        <p>Anggaran awal <b>{rupiah(objective.initialBudget)}</b> · Waktu {Math.floor(objective.elapsedSeconds ?? 0)} detik</p>
        <ul className="kopdes-list">{objective.shoppingList.map(item => <li key={item.productId}>
          <span>{item.complete ? '✓ Lengkap' : `Kurang ${Math.max(0, item.required - item.have)}`} · {item.name} <b>{item.have}/{item.required}</b></span>
          <small>{rupiah(item.price)} per unit · kebutuhan {rupiah(item.subtotal)}</small>
        </li>)}</ul>
        <h2>Keranjang</h2>
        {shopping && <p>{locked ? 'Tekan Esc untuk mengubah jumlah. Tambah hanya di dekat rak produk.' : 'Tambah di dekat rak produk; kurangi atau hapus dari keranjang.'}</p>}
        {!Object.values(objective.basket).some(quantity => quantity > 0) && <p>Keranjang kosong.</p>}
        <ul className="kopdes-list">{CATALOG.filter(item => objective.basket[item.id] > 0).map(item => <li key={item.id}>
          <span>{item.name} × {objective.basket[item.id]} · <b>{rupiah(item.price * objective.basket[item.id])}</b></span>
          <div className="kopdes-quantity">
            <button type="button" disabled={!editable} aria-label={`Kurangi ${item.name}`} onClick={() => dispatch({ type: 'REMOVE_ITEM', productId: item.id, quantity: 1 })}>−</button>
            <span aria-label={`Jumlah ${item.name}`}>{objective.basket[item.id]}</span>
            <button type="button" disabled={!canAdd(item)} aria-label={`Tambah ${item.name}`} onClick={() => dispatch({ type: 'ADD_ITEM', productId: item.id, quantity: 1 })}>+</button>
            <button type="button" disabled={!editable} aria-label={`Hapus ${item.name}`} onClick={() => dispatch({ type: 'REMOVE_ITEM', productId: item.id, quantity: objective.basket[item.id] })}>Hapus</button>
          </div>
        </li>)}</ul>
        {selected && shopping && <section className="kopdes-shelf" aria-label="Produk di dekat Owi">
          <h3>{selected.name}</h3><p>{rupiah(selected.price)} · Stok {objective.stockById?.[selected.id] ?? 0}</p>
          <button type="button" disabled={!canAdd(selected)} onClick={() => dispatch({ type: 'ADD_ITEM', productId: selected.id, quantity: 1 })}>Tambah 1 ke keranjang</button>
        </section>}
        <dl className="kopdes-totals"><div><dt>Total keranjang</dt><dd>{rupiah(objective.basketTotal)}</dd></div>
          <div><dt>Uang tersedia</dt><dd>{rupiah(objective.budget)}</dd></div>
          {shopping && <div><dt>Sisa setelah bayar</dt><dd>{rupiah(objective.budget - objective.basketTotal)}</dd></div>}</dl>
        {!mode && (actionError || objective.feedback) && <p role="alert">{actionError || feedbackText[objective.feedback] || 'Aksi ditolak. Periksa keranjang lalu coba lagi.'}</p>}
      </aside>}
    </div>
    <ShoppingDialog key={attempt} mode={mode} objective={objective} onAction={dispatch} onRetry={retry} returnFocus={controlButton} error={actionError} />
    <footer className="kopdes-bottom">Lawan, Belanja, Bangun Desa <span>Blockout placeholder · bukan aset final</span></footer>
  </main>;
}
