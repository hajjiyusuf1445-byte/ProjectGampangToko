require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { authenticate, login } = require('./auth');
const { PrismaClient } = require('@prisma/client');
const app = express();
const prisma = new PrismaClient(); // Inisialisasi koneksi ke database

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Endpoint Health Check (Tes koneksi server)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Gampang Toko API is running',
    timestamp: new Date().toISOString()
  });
});

// 2. Endpoint: Melihat Daftar Barang (dengan Pagination & Search)
app.get('/api/barang', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Default 50 barang per halaman
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Filter pencarian (by nama, kode, atau barcode)
    const whereClause = search ? {
      OR: [
        { namaBarang: { contains: search, mode: 'insensitive' } },
        { kodeBarang: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    // Ambil data dan hitung total secara bersamaan agar cepat
    const [daftarBarang, totalData] = await Promise.all([
      prisma.barang.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy: { namaBarang: 'asc' }
      }),
      prisma.barang.count({ where: whereClause })
    ]);

    res.json({ 
      success: true, 
      data: daftarBarang,
      pagination: {
        total: totalData,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalData / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Endpoint: Menambah Barang Baru (POST)
app.post('/api/barang',authenticate, async (req, res) => {
  try {
    const { kodeBarang, namaBarang, barcode, hargaJual, hpp, stok } = req.body;
    
    const barangBaru = await prisma.barang.create({
      data: {
        kodeBarang,
        namaBarang,
        barcode,
        hargaJual: parseFloat(hargaJual),
        hpp: parseFloat(hpp),
        stok: parseFloat(stok)
      }
    });

    res.json({ 
      success: true, 
      message: 'Barang berhasil ditambahkan!', 
      data: barangBaru 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// 5. Endpoint: Update Barang (PUT)
app.put('/api/barang/:id',authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { kodeBarang, namaBarang, barcode, hargaJual, hpp, stok } = req.body;
    
    const updatedBarang = await prisma.barang.update({
      where: { id: parseInt(id) },
      data: {
        kodeBarang,
        namaBarang,
        barcode,
        hargaJual: parseFloat(hargaJual),
        hpp: parseFloat(hpp),
        stok: parseFloat(stok)
      }
    });

    res.json({ 
      success: true, 
      message: 'Barang berhasil diupdate!', 
      data: updatedBarang 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Endpoint: Delete Barang (DELETE)
app.delete('/api/barang/:id',authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.barang.delete({
      where: { id: parseInt(id) }
    });

    res.json({ 
      success: true, 
      message: 'Barang berhasil dihapus!' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// 7. Endpoint: Menyimpan Transaksi Penjualan (POST)
app.post('/api/penjualan', async (req, res) => {
  try {
    const { idCabang, idLokasi, idKasir, nomorRef, total, bayar, kembalian, status, items } = req.body;
    
    // Simpan data utama transaksi
    const transaksiBaru = await prisma.penjualan.create({
      data: {
        idCabang: parseInt(idCabang),
        idLokasi: parseInt(idLokasi),
        idKasir: parseInt(idKasir),
        nomorRef,
        total: parseFloat(total),
        bayar: parseFloat(bayar),
        kembalian: parseFloat(kembalian),
        status: parseInt(status),
        // Simpan detail barang yang dibeli sekaligus
        detail: {
          create: items.map((item, index) => ({
            itemNo: index + 1,
            idBarang: item.id,
            qty: item.qty,
            hargaJual: item.hargaJual,
            total: item.total
          }))
        }
      },
      include: { detail: true } // Kembalikan data termasuk detailnya
    });

    // Kurangi stok barang (Opsional tapi penting untuk POS)
    for (const item of items) {
      await prisma.barang.update({
        where: { id: item.id },
        data: { stok: { decrement: item.qty } }
      });
    }

    res.json({ 
      success: true, 
      message: 'Transaksi berhasil disimpan!', 
      data: transaksiBaru 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API ready at http://localhost:${PORT}/api/health`);
});