import { useState, useEffect } from 'react'
import axios from 'axios'
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Admin.css'
import Login from './Login';

const API_URL = 'https://projectgampangtoko-production-4798.up.railway.app/api'
// Set token default untuk semua request axios
const token = localStorage.getItem('adminToken');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
function Admin() {
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState({ totalPages: 1, total: 0 })
    const [products, setProducts] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [formData, setFormData] = useState({
    kodeBarang: '',
    namaBarang: '',
    barcode: '',
    hargaJual: '',
    hpp: '',
    stok: ''
  })

    useEffect(() => {
    loadProducts()
  }, [currentPage, searchTerm]) // Reload saat halaman atau search berubah

    const loadProducts = async () => {
    try {
      // Kirim parameter page, limit, dan search ke backend
      const response = await axios.get(`${API_URL}/barang?page=${currentPage}&limit=50&search=${searchTerm}`)
      if (response.data.success) {
        setProducts(response.data.data)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error loading products:', error)
      alert('Gagal memuat data produk')
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingProduct) {
        // Update produk
        await axios.put(`${API_URL}/barang/${editingProduct.id}`, formData)
        alert('✅ Produk berhasil diupdate!')
      } else {
        // Tambah produk baru
        await axios.post(`${API_URL}/barang`, formData)
        alert('✅ Produk berhasil ditambahkan!')
      }
      
      setShowForm(false)
      setEditingProduct(null)
      setFormData({
        kodeBarang: '',
        namaBarang: '',
        barcode: '',
        hargaJual: '',
        hpp: '',
        stok: ''
      })
      loadProducts()
    } catch (error) {
      console.error(error)
      alert('❌ Gagal menyimpan produk')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      kodeBarang: product.kodeBarang,
      namaBarang: product.namaBarang,
      barcode: product.barcode || '',
      hargaJual: product.hargaJual.toString(),
      hpp: product.hpp.toString(),
      stok: product.stok.toString()
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return
    
    try {
      await axios.delete(`${API_URL}/barang/${id}`)
      alert('✅ Produk berhasil dihapus!')
      loadProducts()
    } catch (error) {
      console.error(error)
      alert('❌ Gagal menghapus produk')
    }
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingProduct(null)
    setFormData({
      kodeBarang: '',
      namaBarang: '',
      barcode: '',
      hargaJual: '',
      hpp: '',
      stok: ''
    })
  }
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
  return !!localStorage.getItem('adminToken');
   });
  if (!isLoggedIn) {
  return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
   }
  return (
    <div className="admin-container">
      <header className="admin-header">
        <Link to="/" className="back-link">
          <ArrowLeft size={20} />
          Kembali ke POS
        </Link>
        <h1> Manajemen Produk</h1>
        <button 
        onClick={() => {
        localStorage.removeItem('adminToken');
        setIsLoggedIn(false);
         }}
        style={{
         padding: '8px 16px', background: '#dc3545', color: 'white',
         border: 'none', borderRadius: '6px', cursor: 'pointer'
         }}
          >
        Logout
        </button>
      </header>

      <div className="admin-content">
                <div className="admin-toolbar">
          <input 
            type="text" 
            placeholder="Cari nama/kode/barcode barang..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1) // Reset ke halaman 1 saat mencari
            }}
            className="search-input-admin"
          />
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={20} />
            Tambah Produk
          </button>
        </div>

        {showForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Kode Barang</label>
                  <input
                    type="text"
                    name="kodeBarang"
                    value={formData.kodeBarang}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Nama Barang</label>
                  <input
                    type="text"
                    name="namaBarang"
                    value={formData.namaBarang}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Barcode</label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Harga Jual (Rp)</label>
                    <input
                      type="number"
                      name="hargaJual"
                      value={formData.hargaJual}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>HPP (Rp)</label>
                    <input
                      type="number"
                      name="hpp"
                      value={formData.hpp}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Stok</label>
                  <input
                    type="number"
                    name="stok"
                    value={formData.stok}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-success">
                    <Save size={16} />
                    {editingProduct ? 'Update' : 'Simpan'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={cancelForm}>
                    <X size={16} />
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Barang</th>
                <th>Barcode</th>
                <th>Harga Jual</th>
                <th>HPP</th>
                <th>Stok</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.kodeBarang}</td>
                  <td>{product.namaBarang}</td>
                  <td>{product.barcode || '-'}</td>
                  <td>Rp {parseInt(product.hargaJual).toLocaleString()}</td>
                  <td>Rp {parseInt(product.hpp).toLocaleString()}</td>
                  <td>
                    <span className={`stock-badge ${product.stok < 10 ? 'low' : ''}`}>
                      {product.stok}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-edit" 
                        onClick={() => handleEdit(product)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(product.id)}
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
                {/* Pagination Controls */}
        <div className="pagination-controls">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="btn-page"
          >
            ← Sebelumnya
          </button>
          <span className="page-info">
            Halaman {currentPage} dari {pagination.totalPages} (Total: {pagination.total} barang)
          </span>
          <button 
            disabled={currentPage === pagination.totalPages} 
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="btn-page"
          >
            Selanjutnya →
          </button>
        </div>
      </div>
    </div>
  )
}

export default Admin
