-- =====================================================================
-- APLIKASI PARKIR - DATABASE SCRIPT
-- Tugas UKK RPL | MySQL / MariaDB (XAMPP)
-- Import file ini pada phpMyAdmin saat database `parkir` belum ada.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `parkir`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `parkir`;

SET FOREIGN_KEY_CHECKS = 0;
DROP VIEW IF EXISTS `v_rekap_transaksi`;
DROP PROCEDURE IF EXISTS `sp_parkir_keluar`;
DROP TABLE IF EXISTS `tb_log_aktivitas`;
DROP TABLE IF EXISTS `tb_transaksi`;
DROP TABLE IF EXISTS `tb_area_parkir`;
DROP TABLE IF EXISTS `tb_tarif`;
DROP TABLE IF EXISTS `tb_kendaraan`;
DROP TABLE IF EXISTS `tb_user`;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. TABEL INDUK: USER
-- ---------------------------------------------------------------------
CREATE TABLE `tb_user` (
  `id_user` INT(11) NOT NULL AUTO_INCREMENT,
  `nama_lengkap` VARCHAR(50) NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(100) NOT NULL,
  `role` ENUM('admin','petugas','owner') NOT NULL DEFAULT 'petugas',
  `status_aktif` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `uq_user_username` (`username`),
  KEY `idx_user_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. TABEL TARIF
-- ---------------------------------------------------------------------
CREATE TABLE `tb_tarif` (
  `id_tarif` INT(11) NOT NULL AUTO_INCREMENT,
  `jenis_kendaraan` ENUM('motor','mobil','lainnya') NOT NULL,
  `tarif_per_jam` DECIMAL(10,0) NOT NULL,
  PRIMARY KEY (`id_tarif`),
  UNIQUE KEY `uq_tarif_jenis` (`jenis_kendaraan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. TABEL AREA PARKIR
-- ---------------------------------------------------------------------
CREATE TABLE `tb_area_parkir` (
  `id_area` INT(11) NOT NULL AUTO_INCREMENT,
  `nama_area` VARCHAR(50) NOT NULL,
  `kapasitas` INT(5) NOT NULL,
  `terisi` INT(5) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_area`),
  KEY `idx_area_nama` (`nama_area`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. TABEL KENDARAAN
-- ---------------------------------------------------------------------
CREATE TABLE `tb_kendaraan` (
  `id_kendaraan` INT(11) NOT NULL AUTO_INCREMENT,
  `plat_nomor` VARCHAR(15) NOT NULL,
  `jenis_kendaraan` VARCHAR(20) NOT NULL,
  `warna` VARCHAR(20) NOT NULL,
  `pemilik` VARCHAR(100) NOT NULL,
  `id_user` INT(11) NOT NULL,
  PRIMARY KEY (`id_kendaraan`),
  UNIQUE KEY `uq_kendaraan_plat` (`plat_nomor`),
  KEY `idx_kendaraan_user` (`id_user`),
  CONSTRAINT `fk_kendaraan_user` FOREIGN KEY (`id_user`)
    REFERENCES `tb_user` (`id_user`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. TABEL TRANSAKSI
-- ---------------------------------------------------------------------
CREATE TABLE `tb_transaksi` (
  `id_parkir` INT(11) NOT NULL AUTO_INCREMENT,
  `id_kendaraan` INT(11) NOT NULL,
  `waktu_masuk` DATETIME NOT NULL,
  `waktu_keluar` DATETIME NULL DEFAULT NULL,
  `id_tarif` INT(11) NOT NULL,
  `durasi_jam` INT(5) NULL DEFAULT NULL,
  `biaya_total` DECIMAL(10,0) NULL DEFAULT NULL,
  `status` ENUM('masuk','keluar') NOT NULL DEFAULT 'masuk',
  `id_user` INT(11) NOT NULL,
  `id_area` INT(11) NOT NULL,
  PRIMARY KEY (`id_parkir`),
  KEY `idx_transaksi_kendaraan` (`id_kendaraan`),
  KEY `idx_transaksi_tarif` (`id_tarif`),
  KEY `idx_transaksi_user` (`id_user`),
  KEY `idx_transaksi_area` (`id_area`),
  KEY `idx_transaksi_status` (`status`),
  KEY `idx_transaksi_waktu` (`waktu_masuk`),
  CONSTRAINT `fk_transaksi_kendaraan` FOREIGN KEY (`id_kendaraan`)
    REFERENCES `tb_kendaraan` (`id_kendaraan`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_transaksi_tarif` FOREIGN KEY (`id_tarif`)
    REFERENCES `tb_tarif` (`id_tarif`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_transaksi_user` FOREIGN KEY (`id_user`)
    REFERENCES `tb_user` (`id_user`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_transaksi_area` FOREIGN KEY (`id_area`)
    REFERENCES `tb_area_parkir` (`id_area`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. TABEL LOG AKTIVITAS
-- ---------------------------------------------------------------------
CREATE TABLE `tb_log_aktivitas` (
  `id_log` INT(11) NOT NULL AUTO_INCREMENT,
  `id_user` INT(11) NOT NULL,
  `aktivitas` VARCHAR(100) NOT NULL,
  `waktu_aktivitas` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_log`),
  KEY `idx_log_user` (`id_user`),
  KEY `idx_log_waktu` (`waktu_aktivitas`),
  CONSTRAINT `fk_log_user` FOREIGN KEY (`id_user`)
    REFERENCES `tb_user` (`id_user`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. DATA CONTOH
-- Password bcrypt: admin123 / petugas123 / owner123
-- ---------------------------------------------------------------------
INSERT INTO `tb_user`
  (`id_user`, `nama_lengkap`, `username`, `password`, `role`, `status_aktif`)
VALUES
  (1, 'Administrator Parkir', 'admin1', '$2a$10$WyYondkze98hOJThb0QHR.Vd/QoEidnB/KhMSSSYyx/22MLbN1CxG', 'admin', 1),
  (2, 'Petugas Parkir Satu', 'petugas1', '$2a$10$dDf7snf43A.ofS3V2OupPuuZ/SdkFUqcuLBzA0E2xwMoXSVwoOAUC', 'petugas', 1),
  (3, 'Pemilik Usaha Parkir', 'owner1', '$2a$10$iKde.rEWJzDb4.FeKwPHxuG9k.R7kGdB.7vBrXOz3DXltGEMFKVUi', 'owner', 1);

INSERT INTO `tb_tarif` (`id_tarif`, `jenis_kendaraan`, `tarif_per_jam`)
VALUES
  (1, 'motor', 2000),
  (2, 'mobil', 5000),
  (3, 'lainnya', 3000);

INSERT INTO `tb_area_parkir` (`id_area`, `nama_area`, `kapasitas`, `terisi`)
VALUES
  (1, 'Area A - Motor', 50, 1),
  (2, 'Area B - Mobil', 30, 1);

INSERT INTO `tb_kendaraan`
  (`id_kendaraan`, `plat_nomor`, `jenis_kendaraan`, `warna`, `pemilik`, `id_user`)
VALUES
  (1, 'B 1234 XYZ', 'motor', 'Merah', 'Budi Santoso', 2),
  (2, 'D 5678 ABC', 'mobil', 'Hitam', 'Siti Aminah', 1),
  (3, 'B 9999 ZZ', 'motor', 'Putih', 'Andi Pratama', 2),
  (4, 'D 1111 QQ', 'mobil', 'Silver', 'Rina Wati', 2),
  (5, 'B 3333 TR', 'motor', 'Biru', 'Dedi Kurniawan', 1);

-- Transaksi selesai (2), transaksi aktif (2), transaksi selesai (1).
-- Area A terisi 1 dan Area B terisi 1, sesuai transaksi berstatus masuk.
INSERT INTO `tb_transaksi`
  (`id_parkir`, `id_kendaraan`, `waktu_masuk`, `waktu_keluar`, `id_tarif`,
   `durasi_jam`, `biaya_total`, `status`, `id_user`, `id_area`)
VALUES
  (1, 1,
   DATE_SUB(CURDATE(), INTERVAL 1 DAY) + INTERVAL 8 HOUR,
   DATE_SUB(CURDATE(), INTERVAL 1 DAY) + INTERVAL 11 HOUR,
   1, 3, 6000, 'keluar', 2, 1),
  (2, 2,
   DATE_SUB(CURDATE(), INTERVAL 1 DAY) + INTERVAL 9 HOUR + INTERVAL 10 MINUTE,
   DATE_SUB(CURDATE(), INTERVAL 1 DAY) + INTERVAL 10 HOUR + INTERVAL 30 MINUTE,
   2, 2, 10000, 'keluar', 2, 2),
  (3, 3,
   CURDATE() + INTERVAL 7 HOUR + INTERVAL 45 MINUTE,
   NULL, 1, NULL, NULL, 'masuk', 2, 1),
  (4, 4,
   CURDATE() + INTERVAL 8 HOUR + INTERVAL 15 MINUTE,
   NULL, 2, NULL, NULL, 'masuk', 2, 2),
  (5, 5,
   DATE_SUB(CURDATE(), INTERVAL 2 DAY) + INTERVAL 13 HOUR,
   DATE_SUB(CURDATE(), INTERVAL 2 DAY) + INTERVAL 14 HOUR + INTERVAL 15 MINUTE,
   1, 2, 4000, 'keluar', 2, 1);

INSERT INTO `tb_log_aktivitas`
  (`id_user`, `aktivitas`, `waktu_aktivitas`)
VALUES
  (1, 'Login ke sistem', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
  (2, 'Transaksi masuk B 9999 ZZ', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (2, 'Transaksi masuk D 1111 QQ', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  (1, 'Menambahkan tarif mobil', DATE_SUB(NOW(), INTERVAL 30 MINUTE));

-- ---------------------------------------------------------------------
-- 8. VIEW REKAP TRANSAKSI
-- ---------------------------------------------------------------------
-- DEFINER sengaja tidak ditulis agar view dapat diimpor oleh user database
-- apa pun yang memiliki hak pembuatan view (mis. root atau admin_parkir).
CREATE OR REPLACE
  ALGORITHM = UNDEFINED
  SQL SECURITY DEFINER
VIEW `v_rekap_transaksi` AS
SELECT
  t.`id_parkir`,
  k.`plat_nomor`,
  k.`jenis_kendaraan`,
  a.`nama_area`,
  t.`waktu_masuk`,
  t.`waktu_keluar`,
  t.`durasi_jam`,
  t.`biaya_total`,
  t.`status`
FROM `tb_transaksi` t
INNER JOIN `tb_kendaraan` k ON k.`id_kendaraan` = t.`id_kendaraan`
INNER JOIN `tb_area_parkir` a ON a.`id_area` = t.`id_area`;

-- ---------------------------------------------------------------------
-- 9. STORED PROCEDURE TRANSAKSI KELUAR
-- Input  : p_id_parkir, p_id_user
-- Proses : lock row, hitung durasi & biaya, update transaksi/area/log
-- Output : transaksi berstatus keluar (dibaca ulang oleh aplikasi)
-- ---------------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE `sp_parkir_keluar`(
  IN `p_id_parkir` INT,
  IN `p_id_user` INT
)
BEGIN
  DECLARE v_status VARCHAR(10);
  DECLARE v_waktu_masuk DATETIME;
  DECLARE v_tarif_per_jam DECIMAL(10,0);
  DECLARE v_id_area INT;
  DECLARE v_plat_nomor VARCHAR(15);
  DECLARE v_waktu_keluar DATETIME;
  DECLARE v_durasi_jam INT;
  DECLARE v_biaya_total DECIMAL(10,0);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT
    t.`status`,
    t.`waktu_masuk`,
    tr.`tarif_per_jam`,
    t.`id_area`,
    k.`plat_nomor`
  INTO
    v_status,
    v_waktu_masuk,
    v_tarif_per_jam,
    v_id_area,
    v_plat_nomor
  FROM `tb_transaksi` t
  INNER JOIN `tb_tarif` tr ON tr.`id_tarif` = t.`id_tarif`
  INNER JOIN `tb_kendaraan` k ON k.`id_kendaraan` = t.`id_kendaraan`
  WHERE t.`id_parkir` = p_id_parkir
  FOR UPDATE;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Transaksi parkir tidak ditemukan';
  END IF;

  IF v_status <> 'masuk' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Kendaraan sudah keluar / transaksi tidak aktif';
  END IF;

  SET v_waktu_keluar = NOW();
  SET v_durasi_jam = GREATEST(
    1,
    CEIL(TIMESTAMPDIFF(MINUTE, v_waktu_masuk, v_waktu_keluar) / 60)
  );
  SET v_biaya_total = v_durasi_jam * v_tarif_per_jam;

  UPDATE `tb_transaksi`
  SET
    `waktu_keluar` = v_waktu_keluar,
    `durasi_jam` = v_durasi_jam,
    `biaya_total` = v_biaya_total,
    `status` = 'keluar'
  WHERE `id_parkir` = p_id_parkir;

  UPDATE `tb_area_parkir`
  SET `terisi` = GREATEST(0, `terisi` - 1)
  WHERE `id_area` = v_id_area;

  INSERT INTO `tb_log_aktivitas` (`id_user`, `aktivitas`, `waktu_aktivitas`)
  VALUES (
    p_id_user,
    CONCAT('Transaksi keluar #', p_id_parkir, ' - ', v_plat_nomor),
    NOW()
  );

  COMMIT;
END$$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 10. USER DATABASE & HAK AKSES (LEAST PRIVILEGE)
-- Password database hanya untuk contoh lokal. Ganti di lingkungan produksi.
-- ---------------------------------------------------------------------
DROP USER IF EXISTS 'admin_parkir'@'localhost';
DROP USER IF EXISTS 'petugas_parkir'@'localhost';
DROP USER IF EXISTS 'owner_parkir'@'localhost';

CREATE USER 'admin_parkir'@'localhost' IDENTIFIED BY 'AdminParkir#2026';
CREATE USER 'petugas_parkir'@'localhost' IDENTIFIED BY 'PetugasParkir#2026';
CREATE USER 'owner_parkir'@'localhost' IDENTIFIED BY 'OwnerParkir#2026';

-- Admin aplikasi: seluruh hak pada database parkir.
GRANT ALL PRIVILEGES ON `parkir`.* TO 'admin_parkir'@'localhost';

-- Petugas: data operasional seperlunya + eksekusi procedure keluar.
GRANT SELECT ON `parkir`.`tb_kendaraan` TO 'petugas_parkir'@'localhost';
GRANT SELECT ON `parkir`.`tb_tarif` TO 'petugas_parkir'@'localhost';
GRANT SELECT ON `parkir`.`tb_area_parkir` TO 'petugas_parkir'@'localhost';
GRANT UPDATE (`terisi`) ON `parkir`.`tb_area_parkir` TO 'petugas_parkir'@'localhost';
GRANT SELECT, INSERT, UPDATE ON `parkir`.`tb_transaksi` TO 'petugas_parkir'@'localhost';
GRANT INSERT ON `parkir`.`tb_log_aktivitas` TO 'petugas_parkir'@'localhost';
GRANT EXECUTE ON PROCEDURE `parkir`.`sp_parkir_keluar` TO 'petugas_parkir'@'localhost';

-- Owner: hanya boleh membaca view rekap.
GRANT SELECT ON `parkir`.`v_rekap_transaksi` TO 'owner_parkir'@'localhost';

FLUSH PRIVILEGES;

-- Selesai.
