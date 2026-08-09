import { useState, useEffect, useRef } from 'react'
import { ShoppingCart, Package, Search, Trash2, Plus } from 'lucide-react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Admin from './Admin'
import Struk from './Struk'
import './Struk.css'
import './App.css'
import api from './api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [cart, setCart] = useState([])
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [barcode, setBarcode] = useState('')
  const [showStruk, setShowStruk] = useState(false)
  const [lastTransaksi, setLastTransaksi] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const strukRef = useRef()
  const [isSearching, setIsSearching] = useState(false);

  // Logika Pencarian Cerdas (Server-Side)
  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = { limit: 50 };
        if (searchTerm.trim().length >= 2) {
          params.search = searchTerm;
        }
        
        const res = await api.get('/barang', { params });
        
        if (!isCancelled) {
          // Fallback format response (kalau backend return {data: []} atau langsung [])
          const dataBarang = res.data.data || res.data;
          setProducts(Array.isArray(dataBarang) ? dataBarang : []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchData, 400);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const addToCart = (product) => {
    const harga = parseFloat(product.hargaJual) || 0;
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      setCart(cart.map(item => {
        if (item.id === product.id) {
          const newQty = item.qty + 1;
          return { ...item, qty: newQty, total: newQty * harga };
        }
        return item;
      }));
    } else {
      setCart([...cart, { ...product, qty: 1, total: harga }]);
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const updateQty = (productId, newQty) => {
    if (newQty < 1) return;
    const item = cart.find(p => p.id === productId);
    if (!item) return;
    const harga = parseFloat(item.hargaJual) || 0;
    
    setCart(cart.map(p =>
      p.id === productId ? { ...p, qty: newQty, total: newQty * harga } : p
    ));
  }

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

  // 🎯 FUNGSI SUBMIT BARCODE (Sudah dibungkus dengan benar)
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault(); // Cegah reload halaman
    
    const code = barcode.trim();
    if (!code) return;

    // Cari di daftar products yang sedang tampil di layar
    const product = products.find((p) => 
      p.barcode === code || p.namaBarang?.toLowerCase() === code.toLowerCase()
    );

    if (product) {
      addToCart(product);
      setBarcode('');
      toast.success(`${product.namaBarang} masuk keranjang!`);
    } else {
      setIsSearching(true);
      try {
        const res = await api.get('/barang', {
          params: { search: code, limit: 1 }
        });
        
        const foundProduct = res.data.data?.[0] || res.data?.[0];

        if (foundProduct) {
          addToCart(foundProduct);
          setBarcode('');
          toast.success(`${foundProduct.namaBarang} masuk keranjang!`);
        } else {
          toast.error('Barcode tidak ditemukan di database!');
          setBarcode('');
        }
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghubungi server!');
        setBarcode('');
      } finally {
        setIsSearching(false);
      }
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.warning('Keranjang kosong!')
      return
    }

    const payment = prompt(`Total: Rp ${cartTotal.toLocaleString()}\nMasukkan jumlah bayar:`)
    if (!payment) return

    const paymentAmount = parseFloat(payment)
    if (paymentAmount < cartTotal) {
      toast.error('Uang tidak cukup!')
      return
    }
    const printStruk = () => {
    const strukEl = strukRef.current;
    if (!strukEl) {
    toast.error('Struk belum siap!');
    return;
  }

  // Buat iframe tersembunyi
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Struk</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; padding:3mm; font-family:'Courier New',Courier,monospace; font-size:12px; color:#000; }
  .struk { width:100%; box-shadow:none; padding:0; margin:0; min-height:0; }
  .struk-header { text-align:center; }
  .struk-header h2 { margin:0; font-size:16px; letter-spacing:1px; }
  .struk-header p { margin:2px 0; font-size:11px; }
  .struk-line { border-top:1px solid #000; margin:6px 0; }
  .struk-line.dashed { border-top-style:dashed; }
  .struk-meta div, .struk-totals .row, .struk-item .item-detail { display:flex; justify-content:space-between; gap:8px; }
  .struk-item { margin-bottom:4px; }
  .item-nama { font-weight:bold; }
  .item-detail { font-size:11px; }
  .struk-totals .row.grand { font-weight:bold; font-size:13px; }
  .struk-qr { display:flex; justify-content:center; margin-top:8px; }
  .struk-qr img { width:72px; height:72px; }
  .struk-footer { text-align:center; font-size:11px; margin-top:8px; }
  .struk-footer p { margin:2px 0; }
  @page { margin: 0; }
</style>
</head>
<body>
${strukEl.outerHTML}
</body>
</html>`);
  doc.close();

  // Print hanya isi iframe (struk saja)
  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 500);
  }, 250);
};

    const change = paymentAmount - cartTotal
    const nomorRef = `TRX-${Date.now()}`

    try {
      const transaksiData = {
        idCabang: 1, idLokasi: 1, idKasir: 1,
        nomorRef: nomorRef, total: cartTotal,
        bayar: paymentAmount, kembalian: change,
        status: 1, items: cart
      }

      const response = await api.post('/penjualan', transaksiData)
      const isSuccess = response.data.success || response.data.id; 
      
      if (isSuccess) {
        setLastTransaksi({
          nomorRef: nomorRef, total: cartTotal,
          bayar: paymentAmount, kembalian: change, items: cart
        })
        setShowStruk(true)
        setCart([])
        toast.success('Transaksi berhasil!')
      } else {
        toast.error('❌ Gagal: ' + (response.data.message || 'Unknown error'))
      }
    } catch (error) {
      toast.error('Gagal menyimpan transaksi.')
      console.error(error)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🛒 Gampang Toko POS</h1>
        <Link to="/admin" className="admin-link">📋 Manajemen Produk</Link>
      </header>

      <div className="main-content">
        <div className="products-section">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Cari barang (ketik minimal 2 huruf)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <form onSubmit={handleBarcodeSubmit} className="barcode-form">
            <div style={{ position: 'relative', marginBottom: '1rem', flex: 1 }}>
              <input 
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan barcode atau ketik nama barang..."
                disabled={isSearching}
                style={{ 
                  width: '100%', padding: '10px', 
                  paddingRight: isSearching ? '40px' : '10px', fontSize: '16px' 
                }}
              />
              {isSearching && (
                <span style={{ 
                  position: 'absolute', right: '15px', top: '50%', 
                  transform: 'translateY(-50%)', fontSize: '20px'
                }}>
                  ⏳
                </span>
              )}
            </div>
            <button type="submit"><Plus size={20} /></button>
          </form>

          <div className="products-grid">
            {isLoading ? (
              <p style={{ padding: '20px', color: '#888', textAlign: 'center', width: '100%' }}>🔍 Mencari di database...</p>
            ) : products.length === 0 ? (
              <p style={{ padding: '20px', color: '#888', textAlign: 'center', width: '100%' }}>Produk tidak ditemukan.</p>
            ) : (
              products.map(product => (
                <div key={product.id} className="product-card" onClick={() => addToCart(product)}>
                  <Package size={32} />
                  <h3>{product.namaBarang}</h3>
                  <p className="price">Rp {product.hargaJual.toLocaleString()}</p>
                  <p className="stock">Stok: {product.stok}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="cart-section">
          <h2><ShoppingCart size={24} /> Keranjang</h2>
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <h4>{item.namaBarang}</h4>
                  <p>Rp {item.hargaJual.toLocaleString()}</p>
                </div>
                <div className="item-controls">
                  <button onClick={() => updateQty(item.id, item.qty - 1)}>-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                  <button className="delete-btn" onClick={() => removeFromCart(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="item-total">Rp {item.total.toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="total">
              <span>Total:</span>
              <span className="total-amount">Rp {cartTotal.toLocaleString()}</span>
            </div>
            <button className="checkout-btn" onClick={handleCheckout}>💳 Bayar</button>
          </div>
        </div>
      </div>

      {showStruk && lastTransaksi && (
        <div className="modal-struk">
          <div className="modal-struk-content">
            <Struk ref={strukRef} transaksi={lastTransaksi} />
            <div className="modal-struk-actions">
              <button className="btn-print" onClick={printStruk}>🖨️ Cetak Struk</button>
              <button className="btn-close" onClick={() => setShowStruk(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifikasi */}
      <ToastContainer 
        position="top-right" autoClose={3000} hideProgressBar={false}
        newestOnTop closeOnClick pauseOnHover theme="light"
      />
    </div>
  )
}

function Root() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  )
}

export default Root