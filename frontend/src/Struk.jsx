import { forwardRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import './Struk.css';

// ============================================
// 🏪 EDIT IDENTITAS TOKO DI SINI, BOS!
// ============================================
const TOKO = {
  nama: 'GAMPANG TOKO',
  alamat: 'Jl. Raya Contoh No. 123, Kota Anda',
  telp: '0812-3456-7890',
};

const rp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');

const Struk = forwardRef(({ transaksi }, ref) => {
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Generate QR setiap kali ada transaksi baru
  useEffect(() => {
    if (!transaksi) return;
    const isiQR = `${TOKO.nama}\n${transaksi.nomorRef}\nTotal: ${rp(transaksi.total)}`;
    QRCode.toDataURL(isiQR, { width: 200, margin: 1 })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [transaksi]);

  if (!transaksi) return null;

  const now = new Date();
  const tanggal = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const jam = now.toLocaleTimeString('id-ID');

  return (
    <div className="struk" ref={ref}>
      <div className="struk-header">
        <h2>{TOKO.nama}</h2>
        <p>{TOKO.alamat}</p>
        <p>Telp: {TOKO.telp}</p>
      </div>

      <div className="struk-line" />

      <div className="struk-meta">
        <div><span>No. Ref</span><span>{transaksi.nomorRef}</span></div>
        <div><span>Tanggal</span><span>{tanggal} {jam}</span></div>
        <div><span>Kasir</span><span>Admin</span></div>
      </div>

      <div className="struk-line dashed" />

      <div className="struk-items">
        {transaksi.items.map((item) => (
          <div className="struk-item" key={item.id}>
            <div className="item-nama">{item.namaBarang}</div>
            <div className="item-detail">
              <span>{item.qty} x {rp(item.hargaJual)}</span>
              <span>{rp(item.total)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="struk-line dashed" />

      <div className="struk-totals">
        <div className="row grand">
          <span>TOTAL</span><span>{rp(transaksi.total)}</span>
        </div>
        <div className="row"><span>TUNAI</span><span>{rp(transaksi.bayar)}</span></div>
        <div className="row"><span>KEMBALIAN</span><span>{rp(transaksi.kembalian)}</span></div>
      </div>

      <div className="struk-line" />

      {/* QR Code (gambar biasa, aman dari bentrok React) */}
      {qrDataUrl && (
        <div className="struk-qr">
          <img src={qrDataUrl} alt="QR Transaksi" />
        </div>
      )}

      <div className="struk-footer">
        <p>Terima kasih telah berbelanja!</p>
        <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
      </div>
    </div>
  );
});

Struk.displayName = 'Struk';
export default Struk;