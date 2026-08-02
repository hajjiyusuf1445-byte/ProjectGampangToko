const firebird = require('node-firebird');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ==========================================
// KONFIGURASI DATABASE FIREBIRD LAMA
// ==========================================
const firebirdOptions = {
  host: 'localhost',
  port: 3050,
  database: 'C:\\Program Files (x86)\\Gampang Toko SE\\Database\\GAMPANGMINIMARKETS.FDB', // ⚠️ GANTI PATH INI!
  user: 'SYSDBA',
  password: 'masterkey',
  lowercase: true 
};

// Helper: Connect
function connectFirebird(options) {
  return new Promise((resolve, reject) => {
    firebird.attach(options, (err, db) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

// Helper: Query
function queryFirebird(db, sql) {
  return new Promise((resolve, reject) => {
    db.query(sql, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// ==========================================
// FUNGSI UTAMA MIGRASI
// ==========================================
async function migrateData() {
  console.log('🚀 Memulai migrasi data dari Firebird ke PostgreSQL...\n');
  let db;

  try {
    // 1. Connect
    console.log('📡 Menghubungkan ke database Firebird...');
    db = await connectFirebird(firebirdOptions);
    console.log('✅ Terhubung ke Firebird!\n');

    // 2. Ambil semua barang (PAKAI ALIAS KOLOM EKSPILISIT agar tidak undefined)
    console.log('📦 [1/4] Membaca data BARANG dari Firebird...');
    const barangRows = await queryFirebird(db, 
      'SELECT ID_BARANG AS id_barang, KODE_BARANG AS kode_barang, NAMA_BARANG AS nama_barang, BARKOD1 AS barkod1, BARKOD2 AS barkod2, HARGAJUAL1 AS hargajual1, HPP AS hpp FROM BARANG'
    );
    console.log(`   Ditemukan ${barangRows.length} barang di database lama.\n`);

    // 3. Migrasi BARANG dengan handling duplikat yang lebih pintar
    console.log('💾 [2/4] Menyimpan barang ke PostgreSQL...');
    const idMapping = {}; // Mapping: ID lama -> ID baru
    let berhasil = 0;
    let gagal = 0;
    const kodeSudahDipakai = new Set();

    for (const row of barangRows) {
      try {
        // Ambil ID dengan fallback ke berbagai kemungkinan nama kolom
        const rawId = row.id_barang || row.ID_BARANG || row['id_barang'] || row['ID_BARANG'];
        
        if (!rawId) {
          gagal++;
          continue; // Skip baris yang benar-benar rusak
        }
        
        const idLama = parseInt(rawId);
        
        // Tentukan kode barang
        let kodeBarang = (row.kode_barang || row.KODE_BARANG || '').toString().trim();
        
        // Jika kosong atau sudah dipakai, generate dari ID
        if (!kodeBarang || kodeSudahDipakai.has(kodeBarang)) {
          kodeBarang = `OLD-${String(idLama).padStart(6, '0')}`;
        }
        
        // Jika masih duplikat (sangat jarang), tambah suffix
        if (kodeSudahDipakai.has(kodeBarang)) {
          kodeBarang = `${kodeBarang}-${idLama}`;
        }
        
        kodeSudahDipakai.add(kodeBarang);

        // Simpan ke PostgreSQL
        const barangBaru = await prisma.barang.create({
          data: {
            kodeBarang: kodeBarang,
            namaBarang: (row.nama_barang || row.NAMA_BARANG || `Barang ${idLama}`).toString().trim(),
            barcode: (row.barkod1 || row.BARKOD1 || row.barkod2 || row.BARKOD2 || null)?.toString().trim(),
            hargaJual: parseFloat(row.hargajual1 || row.HARGAJUAL1 || 0),
            hpp: parseFloat(row.hpp || row.HPP || 0),
            stok: 0,
            status: 1
          }
        });

        // Simpan mapping ID lama -> ID baru
        idMapping[idLama] = barangBaru.id;
        berhasil++;

        // Progress setiap 1000 barang
        if (berhasil % 1000 === 0) {
          console.log(`   ... sudah ${berhasil} barang`);
        }

      } catch (error) {
        gagal++;
        if (gagal <= 5) {
          console.log(`   ⚠️  Gagal barang: ${error.message}`);
        }
      }
    }
    console.log(`✅ Berhasil: ${berhasil} barang | Gagal: ${gagal} barang\n`);

    // 4. Update Stok dari STOKAKHIR (PAKAI ALIAS)
    console.log('📊 [3/4] Menghitung dan update STOK...');
    const stokRows = await queryFirebird(db, 
      'SELECT ID_BARANG AS id_barang, SUM(QTY) AS total_qty FROM STOKAKHIR GROUP BY ID_BARANG'
    );
    
    let berhasilStok = 0;
    let stokTanpaMapping = 0;

    for (const row of stokRows) {
      const idLama = parseInt(row.id_barang || row.ID_BARANG);
      const idBaru = idMapping[idLama];
      
      if (idBaru) {
        try {
          await prisma.barang.update({
            where: { id: idBaru },
            data: { stok: parseFloat(row.total_qty || row.TOTAL_QTY || 0) }
          });
          berhasilStok++;
        } catch (error) {
          // Skip
        }
      } else {
        stokTanpaMapping++;
      }
    }
    console.log(`✅ Stok diupdate: ${berhasilStok} barang`);
    if (stokTanpaMapping > 0) {
      console.log(`   ⚠️  ${stokTanpaMapping} stok tidak punya mapping (barang tidak berhasil dimigrasi)`);
    }
    console.log('');

    // 5. Hitung Pelanggan
    console.log('👥 [4/4] Mengecek data PELANGGAN...');
    try {
      const pelangganRows = await queryFirebird(db, 'SELECT COUNT(*) AS total FROM PELANGGAN');
      const totalPelanggan = pelangganRows[0] ? (pelangganRows[0].total || 0) : 0;
      console.log(`ℹ️  Ditemukan ${totalPelanggan} pelanggan di database lama.`);
      console.log('   (Migrasi detail pelanggan bisa ditambahkan nanti)\n');
    } catch (error) {
      console.log('⚠️  Gagal membaca tabel pelanggan (skip).\n');
    }

    // 6. Ringkasan
    console.log('==========================================');
    console.log('🎉 MIGRASI DATA SELESAI!');
    console.log('==========================================');
    console.log(`📦 Barang: ${berhasil} berhasil dipindahkan`);
    console.log(`📊 Stok: ${berhasilStok} barang diupdate stoknya`);
    console.log('==========================================');
    console.log('Silakan buka Prisma Studio atau Halaman Admin');
    console.log('untuk melihat data yang sudah masuk.');

  } catch (error) {
    console.error('❌ TERJADI ERROR:', error.message);
  } finally {
    if (db) {
      db.detach();
      console.log('\n📴 Koneksi ke Firebird ditutup.');
    }
    await prisma.$disconnect();
    console.log('📴 Koneksi ke PostgreSQL ditutup.');
  }
}

// Jalankan
migrateData();