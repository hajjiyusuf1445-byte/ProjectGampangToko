import { forwardRef } from 'react'

// forwardRef dibutuhkan agar kita bisa print komponen ini dari luar
const Struk = forwardRef(({ transaksi }, ref) => {
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID').format(angka)
  }

  const tanggal = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  return (
    <div ref={ref} className="struk-container">
      <div className="struk-header">
        <h2>GAMPANG TOKO</h2>
        <p>Jl. Contoh Alamat No. 123</p>
        <p>Telp: 0812-3456-7890</p>
        <div className="divider">================================</div>
      </div>

      <div className="struk-info">
        <p>No: {transaksi.nomorRef}</p>
        <p>Tgl: {tanggal}</p>
        <p>Kasir: Admin</p>
      </div>

      <div className="divider">--------------------------------</div>

      <div className="struk-items">
        {transaksi.items.map((item, index) => (
          <div key={index} className="struk-item">
            <div className="item-name">{item.namaBarang}</div>
            <div className="item-detail">
              <span>{item.qty} x {formatRupiah(item.hargaJual)}</span>
              <span>{formatRupiah(item.total)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="divider">--------------------------------</div>

      <div className="struk-total">
        <div className="total-row">
          <span>Total</span>
          <span>Rp {formatRupiah(transaksi.total)}</span>
        </div>
        <div className="total-row">
          <span>Tunai</span>
          <span>Rp {formatRupiah(transaksi.bayar)}</span>
        </div>
        <div className="total-row">
          <span>Kembali</span>
          <span>Rp {formatRupiah(transaksi.kembalian)}</span>
        </div>
      </div>

      <div className="divider">================================</div>
      
      <div className="struk-footer">
        <p>Terima Kasih</p>
        <p>Selamat Belanja Kembali</p>
      </div>
    </div>
  )
})

export default Struk