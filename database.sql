BEGIN;

DROP TABLE IF EXISTS transaction CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
DROP TABLE IF EXISTS userrs CASCADE;

-- USER
CREATE TABLE users (
    id_user VARCHAR(30) PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);


-- JENIS MEMBER
CREATE TABLE jenis_member (
    id_jenis VARCHAR(10) PRIMARY KEY,
    nama_jenis VARCHAR(30) NOT NULL,
    harga DECIMAL(12,2) NOT NULL CHECK (harga >= 0),
    durasi_hari INTEGER NOT NULL CHECK (durasi_hari > 0)
);

-- member
CREATE TABLE member (
    id_member VARCHAR(10) PRIMARY KEY,
    id_user VARCHAR(30) NOT NULL UNIQUE,
    jenis_kelamin VARCHAR(10),
    no_hp VARCHAR(20),
    alamat VARCHAR(255),
    kota VARCHAR(100),

    CONSTRAINT fk_member_users
        FOREIGN KEY (id_user)
        REFERENCES users(id_user)
);

ALTER TABLE member
ALTER COLUMN kota SET NOT NULL,
ALTER COLUMN alamat SET NOT NULL,
ALTER COLUMN no_hp SET NOT NULL,
ALTER COLUMN jenis_kelamin SET NOT NULL;

ALTER TABLE member
ALTER COLUMN id_user TYPE VARCHAR(20);

-- admin
CREATE TABLE admin (
    id_admin VARCHAR(10) PRIMARY KEY,
    id_user VARCHAR(30) NOT NULL UNIQUE,

    CONSTRAINT fk_admin_users
        FOREIGN KEY (id_user)
        REFERENCES users(id_user)
);

-- cs
CREATE TABLE cs (
    id_cs VARCHAR(10) PRIMARY KEY,
    id_user VARCHAR(30) NOT NULL UNIQUE,

    CONSTRAINT fk_cs_users
        FOREIGN KEY (id_user)
        REFERENCES users(id_user)
);

-- owner
CREATE TABLE owner (
    id_owner VARCHAR(30) PRIMARY KEY,
    id_user VARCHAR(30) NOT NULL UNIQUE,

    CONSTRAINT fk_owner_users
        FOREIGN KEY (id_user)
        REFERENCES users(id_user)
);

-- transaksi
CREATE TABLE transaksi (
    id_transaksi VARCHAR(15) PRIMARY KEY,
    id_member VARCHAR(10) NOT NULL,
    id_jenis VARCHAR(10) NOT NULL,
    id_admin VARCHAR(10) NOT NULL,
    tgl_transaksi DATE NOT NULL,
    jenis_transaksi VARCHAR(30) NOT NULL,
    metode_bayar VARCHAR(20) NOT NULL,
    status_bayar VARCHAR(20) NOT NULL,
    jumlah_bayar DECIMAL(12,2) NOT NULL CHECK (jumlah_bayar >= 0),
    tgl_mulai DATE,
    tgl_berakhir DATE,

    CONSTRAINT fk_transaksi_member
        FOREIGN KEY (id_member)
        REFERENCES member(id_member),

    CONSTRAINT fk_transaksi_jenis
        FOREIGN KEY (id_jenis)
        REFERENCES jenis_member(id_jenis),

    CONSTRAINT fk_transaksi_admin
        FOREIGN KEY (id_admin)
        REFERENCES admin(id_admin)
);

ALTER TABLE transaksi
ALTER COLUMN tgl_mulai SET NOT NULL,
ALTER COLUMN tgl_berakhir SET NOT NULL;

-- KARTU_MEMBER
CREATE TABLE kartu_member (
    id_kartu VARCHAR(10) PRIMARY KEY,
    id_admin VARCHAR(10) NOT NULL,
    id_member VARCHAR(10) NOT NULL,
    status_kartu VARCHAR(20) NOT NULL,

    CONSTRAINT fk_kartu_admin
        FOREIGN KEY (id_admin)
        REFERENCES admin(id_admin),

    CONSTRAINT fk_kartu_member
        FOREIGN KEY (id_member)
        REFERENCES member(id_member)
);


-- CHECK_IN
CREATE TABLE check_in (
    id_checkin VARCHAR(10) PRIMARY KEY,
    id_member VARCHAR(10) NOT NULL,
    tgl_checkin DATE NOT NULL,
    jam_checkin TIME NOT NULL,

    CONSTRAINT fk_checkin_member
        FOREIGN KEY (id_member)
        REFERENCES member(id_member)
);


-- NOTIFIKASI
CREATE TABLE notifikasi (
    id_notifikasi VARCHAR(25) PRIMARY KEY,
    id_member VARCHAR(10) NOT NULL,
    id_transaksi VARCHAR(15) NOT NULL,
    jenis_notifikasi VARCHAR(100) NOT NULL,

    CONSTRAINT fk_notifikasi_member
        FOREIGN KEY (id_member)
        REFERENCES member(id_member),

    CONSTRAINT fk_notifikasi_transaksi
        FOREIGN KEY (id_transaksi)
        REFERENCES transaksi(id_transaksi)
);


-- JADWAL_PIKET
CREATE TABLE jadwal_piket (
    id_jadwal VARCHAR(10) PRIMARY KEY,
    id_admin VARCHAR(10) NOT NULL,
    id_cs VARCHAR(10) NOT NULL,
    tgl_piket DATE NOT NULL,
    jam_mulai TIME NOT NULL,

    CONSTRAINT fk_jadwal_admin
        FOREIGN KEY (id_admin)
        REFERENCES admin(id_admin),

    CONSTRAINT fk_jadwal_cs
        FOREIGN KEY (id_cs)
        REFERENCES cs(id_cs)
);


-- LAPORAN_FASILITAS
CREATE TABLE laporan_fasilitas (
    id_laporan VARCHAR(10) PRIMARY KEY,
    id_cs VARCHAR(10) NOT NULL,
    nama_fasilitas VARCHAR(100) NOT NULL,
    tgl_laporan DATE NOT NULL,
    status_laporan VARCHAR(30) NOT NULL,

    CONSTRAINT fk_laporan_cs
        FOREIGN KEY (id_cs)
        REFERENCES cs(id_cs)
);

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT
    table_name,
    quote_ident(table_name) AS nama_tabel
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT
    table_name,
    LENGTH(table_name) AS panjang_nama,
    table_type,
    ENCODE(CONVERT_TO(table_name, 'UTF8'), 'hex') AS kode_nama
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT * FROM userrs;

DROP TABLE userrs;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT * FROM users;

INSERT INTO users
(id_user, nama, username, password)
VALUES
('U-0001', 'Citra Piliang', 'citra_p', 'Citra26'),
('U-0002', 'Siti Kurniawan', 'siti_k', 'Siti26'),
('U-0003', 'Gilang Maulana', 'gilang_m', 'Gilang26'),
('U-0004', 'Putri Tanjung', 'putri_t', 'Putri26'),
('U-0005', 'Arif Wijaya', 'arif_w', 'Arif26'),
('U-0006', 'Rina Marlina', 'rina_m', 'Rina26'),
('U-0007', 'Dedi Saputra', 'dedi_s', 'Dedi26'),
('U-0008', 'Sari Melati', 'sari_m', 'Sari26'),
('U-0009', 'Nadia Putri', 'nadia_p', 'Nad26'),
('U-0010', 'Rafi Hidayat', 'rafi_h', 'Rafi26'),
('U-0011', 'Mega Lestari', 'mega_l', 'Mega26'),
('U-0012', 'Musri Maharani', 'musri_m', 'musri_26');

INSERT INTO jenis_member
(id_jenis, nama_jenis, harga, durasi_hari)
VALUES
('JM01', 'Umum', 150000, 30),
('JM02', 'Pelajar', 100000, 30);

INSERT INTO member
(id_member, id_user, jenis_kelamin, no_hp, alamat, kota)
VALUES
('PIAI-0001', 'U-0001', 'Perempuan',
 '085346578713', 'Jl. Andalas No. 9', 'Padang'),

('PIAI-0002', 'U-0002', 'Perempuan',
 '082166889373', 'Jl. Rasuna Said No. 56', 'Padang'),

('PIAI-0003', 'U-0003', 'Laki-laki',
 '087877520471', 'Jl. Sudirman No. 52', 'Padang'),

('PIAI-0004', 'U-0004', 'Perempuan',
 '085349361832', 'Jl. Rasuna Said No. 106', 'Padang'),

('PIAI-0005', 'U-0005', 'Laki-laki',
 '082108240084', 'Jl. Ujung Gurun No. 82', 'Padang');

INSERT INTO admin
(id_admin, id_user)
VALUES
('USR02', 'U-0006'),
('USR03', 'U-0007'),
('USR04', 'U-0008');

INSERT INTO cs
(id_cs, id_user)
VALUES
('CS-0001', 'U-0009'),
('CS-0002', 'U-0010'),
('CS-0003', 'U-0011');

INSERT INTO owner
(id_owner, id_user)
VALUES
('OW-0001', 'U-0012');

INSERT INTO transaksi (
    id_transaksi, id_member, id_jenis, id_admin,
    tgl_transaksi, jenis_transaksi, metode_bayar,
    status_bayar, jumlah_bayar, tgl_mulai, tgl_berakhir
)
VALUES
('TRX-0001', 'PIAI-0001', 'JM01', 'USR03', DATE '2026-01-10', 'Pendaftaran', 'Tunai', 'Lunas', 150000, DATE '2026-01-10', DATE '2026-02-09'),
('TRX-0002', 'PIAI-0002', 'JM02', 'USR04', DATE '2026-01-12', 'Pendaftaran', 'QRIS', 'Lunas', 100000, DATE '2026-01-12', DATE '2026-02-11'),
('TRX-0003', 'PIAI-0003', 'JM01', 'USR04', DATE '2026-01-23', 'Pendaftaran', 'QRIS', 'Lunas', 150000, DATE '2026-01-23', DATE '2026-02-22'),
('TRX-0004', 'PIAI-0004', 'JM02', 'USR03', DATE '2026-01-23', 'Pendaftaran', 'QRIS', 'Lunas', 100000, DATE '2026-01-23', DATE '2026-02-22'),
('TRX-0005', 'PIAI-0005', 'JM01', 'USR02', DATE '2026-01-31', 'Pendaftaran', 'QRIS', 'Lunas', 150000, DATE '2026-01-31', DATE '2026-03-02');

INSERT INTO kartu_member
(id_kartu, id_admin, id_member, status_kartu)
VALUES
('KM-0001', 'USR03', 'PIAI-0001', 'Aktif'),
('KM-0002', 'USR04', 'PIAI-0002', 'Aktif'),
('KM-0003', 'USR04', 'PIAI-0003', 'Aktif'),
('KM-0004', 'USR03', 'PIAI-0004', 'Aktif'),
('KM-0005', 'USR02', 'PIAI-0005', 'Aktif');

INSERT INTO check_in
(id_checkin, id_member, tgl_checkin, jam_checkin)
VALUES
('CI-0001', 'PIAI-0002', DATE '2026-01-20', TIME '18:15'),
('CI-0002', 'PIAI-0004', DATE '2026-01-25', TIME '06:00'),
('CI-0003', 'PIAI-0004', DATE '2026-01-27', TIME '17:45'),
('CI-0004', 'PIAI-0003', DATE '2026-01-28', TIME '19:10'),
('CI-0005', 'PIAI-0001', DATE '2026-01-29', TIME '20:15'),
('CI-0006', 'PIAI-0002', DATE '2026-02-03', TIME '20:15'),
('CI-0007', 'PIAI-0005', DATE '2026-02-09', TIME '17:15'),
('CI-0008', 'PIAI-0005', DATE '2026-02-11', TIME '18:45'),
('CI-0009', 'PIAI-0004', DATE '2026-02-12', TIME '09:30'),
('CI-0010', 'PIAI-0004', DATE '2026-02-15', TIME '12:30');

INSERT INTO notifikasi
(id_notifikasi, id_member, id_transaksi, jenis_notifikasi)
VALUES
('NT-0001', 'PIAI-0001', 'TRX-0001', 'Konfirmasi Pembayaran'),
('NT-0002', 'PIAI-0002', 'TRX-0002', 'Konfirmasi Pembayaran'),
('NT-0003', 'PIAI-0003', 'TRX-0003', 'Konfirmasi Pembayaran'),
('NT-0004', 'PIAI-0004', 'TRX-0004', 'Konfirmasi Pembayaran'),
('NT-0005', 'PIAI-0005', 'TRX-0005', 'Konfirmasi Pembayaran'),
('NT-0006', 'PIAI-0001', 'TRX-0001', 'Pengingat Masa Berlaku'),
('NT-0007', 'PIAI-0002', 'TRX-0002', 'Pengingat Masa Berlaku');

INSERT INTO jadwal_piket
(id_jadwal, id_admin, id_cs, tgl_piket, jam_mulai)
VALUES
('JP-0001', 'USR03', 'CS-0001', DATE '2026-01-10', TIME '08:00'),
('JP-0002', 'USR04', 'CS-0002', DATE '2026-01-12', TIME '08:00'),
('JP-0003', 'USR04', 'CS-0003', DATE '2026-01-23', TIME '08:00'),
('JP-0004', 'USR03', 'CS-0001', DATE '2026-01-23', TIME '14:00'),
('JP-0005', 'USR02', 'CS-0002', DATE '2026-01-31', TIME '08:00');

INSERT INTO laporan_fasilitas
(id_laporan, id_cs, nama_fasilitas, tgl_laporan, status_laporan)
VALUES
('1', 'CS-0001', 'Treadmill', DATE '2026-01-10', 'Rusak'),
('2', 'CS-0002', 'Dumbbell Rack', DATE '2026-01-12', 'Baik'),
('3', 'CS-0003', 'AC Ruang Latihan', DATE '2026-01-15', 'Dalam Perbaikan');

SELECT 'users' AS tabel, COUNT(*) AS jumlah_data FROM users
UNION ALL SELECT 'jenis_member', COUNT(*) FROM jenis_member
UNION ALL SELECT 'member', COUNT(*) FROM member
UNION ALL SELECT 'admin', COUNT(*) FROM admin
UNION ALL SELECT 'cs', COUNT(*) FROM cs
UNION ALL SELECT 'owner', COUNT(*) FROM owner
UNION ALL SELECT 'transaksi', COUNT(*) FROM transaksi
UNION ALL SELECT 'kartu_member', COUNT(*) FROM kartu_member
UNION ALL SELECT 'check_in', COUNT(*) FROM check_in
UNION ALL SELECT 'notifikasi', COUNT(*) FROM notifikasi
UNION ALL SELECT 'jadwal_piket', COUNT(*) FROM jadwal_piket
UNION ALL SELECT 'laporan_fasilitas', COUNT(*) FROM laporan_fasilitas;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;


SELECT
    t.table_name,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.table_constraints tc
            WHERE tc.table_schema = 'public'
              AND tc.table_name = t.table_name
              AND tc.constraint_type = 'PRIMARY KEY'
        )
        THEN 'Ada PK'
        ELSE 'Tidak Ada PK'
    END AS status_primary_key
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

SELECT
    current_database() AS nama_database,
    current_schema() AS nama_schema,
    current_user AS pengguna,
    inet_server_port() AS port;

SELECT current_database();

SELECT current_database(), current_schema();

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'transaksi'
  AND column_name IN ('tgl_mulai', 'tgl_berakhir');

COMMIT;