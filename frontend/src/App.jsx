import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { ShoppingCart, Package, Search, Trash2, Plus } from 'lucide-react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Admin from './Admin'
import Struk from './Struk'
import './Struk.css'
import './App.css'

const API_URL = 'https://projectgampangtoko-production.up.railway.app'

function App() {
  const [cart, setCart] = useState([])
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [barcode, setBarcode] = useState('')
  const [showStruk, setShowStruk] = useState(false)
  const [lastTransaksi, setLastTransaksi] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const strukRef = useRef()

  // Logika Pencarian Cerdas (Server-Side)
  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        let url = `${API_URL}/barang?limit=50`;
        
        // Jika user mengetik minimal 2 huruf, cari ke server
        if (searchTerm.trim().length >= 2) {
          url += `&search=${encodeURIComponent(searchTerm)}`;
        }

        const res = await axios.get(url);
        
        if (!isCancelled && res.data.success) {
          setProducts(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    // Tunggu 400ms setelah user berhenti mengetik (Debounce)
    const timer = setTimeout(fetchData, 400);

    // Bersihkan timer jika user masih mengetik
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm]);

    const addToCart = (product) => {
    const harga = parseFloat(product.hargaJual) || 0; // Paksa jadi angka
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      setCart(cart.map(item => {
        if (item.id === product.id) {
          const newQty = item.qty + 1;
          return { 
            ...item, 
            qty: newQty, 
            total: newQty * harga // Perkalian angka
          };
        }
        return item;
      }));
    } else {
      setCart([...cart, { 
        ...product, 
        qty: 1, 
        total: harga 
      }]);
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

    const updateQty = (productId, newQty) => {
    if (newQty < 1) return;
    
    const item = cart.find(p => p.id === productId);
    if (!item) return;
    
    const harga = parseFloat(item.hargaJual) || 0; // Paksa jadi angka
    
    setCart(cart.map(p =>
      p.id === productId
        ? { ...p, qty: newQty, total: newQty * harga }
        : p
    ));
  }

    const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

  const handleBarcodeSubmit = (e) => {
    e.preventDefault()
    if (!barcode.trim()) return;
    
    // Cari barcode langsung dari server jika tidak ada di layar
    const product = products.find(p => p.barcode === barcode)
    if (product) {
      addToCart(product)
      setBarcode('')
    } else {
      // Jika tidak ketemu di 50 barang yang tampil, cari ke server
      axios.get(`${API_URL}/barang?search=${barcode}&limit=1`)
        .then(res => {
          if (res.data.success && res.data.data.length > 0) {
            addToCart(res.data.data[0])
            setBarcode('')
          } else {
            alert('Produk dengan barcode tersebut tidak ditemukan!')
          }
        })
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Keranjang kosong!')
      return
    }

    const payment = prompt(`Total: Rp ${cartTotal.toLocaleString()}\nMasukkan jumlah bayar:`)
    if (!payment) return

    const paymentAmount = parseFloat(payment)
    if (paymentAmount < cartTotal) {
      alert('Uang tidak cukup!')
      return
    }

    const change = paymentAmount - cartTotal
    const nomorRef = `TRX-${Date.now()}`

    try {
      const transaksiData = {
        idCabang: 1,
        idLokasi: 1,
        idKasir: 1,
        nomorRef: nomorRef,
        total: cartTotal,
        bayar: paymentAmount,
        kembalian: change,
        status: 1,
        items: cart
      }

      const response = await axios.post(`${API_URL}/penjualan`, transaksiData)
      
      if (response.data.success) {
        setLastTransaksi({
          nomorRef: nomorRef,
          total: cartTotal,
          bayar: paymentAmount,
          kembalian: change,
          items: cart
        })
        setShowStruk(true)
        setCart([])
      } else {
        alert('❌ Gagal: ' + response.data.message)
      }
    } catch (error) {
      alert(' Gagal menyimpan transaksi.')
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
            <input
              type="text"
              placeholder="Scan barcode..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              autoFocus
            />
            <button type="submit"><Plus size={20} /></button>
          </form>

          <div className="products-grid">
            {isLoading ? (
              <p style={{ padding: '20px', color: '#888', textAlign: 'center', width: '100%' }}>
                🔍 Mencari di database...
              </p>
            ) : products.length === 0 ? (
              <p style={{ padding: '20px', color: '#888', textAlign: 'center', width: '100%' }}>
                Produk tidak ditemukan. Coba kata kunci lain.
              </p>
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
                <div className="item-total">
                  Rp {item.total.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="total">
              <span>Total:</span>
              <span className="total-amount">Rp {cartTotal.toLocaleString()}</span>
            </div>
            <button className="checkout-btn" onClick={handleCheckout}>
              💳 Bayar
            </button>
          </div>
        </div>
      </div>

      {/* Modal Struk */}
      {showStruk && lastTransaksi && (
        <div className="modal-struk">
          <div className="modal-struk-content">
            <Struk ref={strukRef} transaksi={lastTransaksi} />
            
            <div className="modal-struk-actions">
              <button className="btn-print" onClick={() => window.print()}>
                🖨️ Cetak Struk
              </button>
              <button className="btn-close" onClick={() => setShowStruk(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
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