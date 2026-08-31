# MIRAI - Care Future Teller (Demo Transfer Pasien)

MIRAI ("masa depan" dalam bahasa Jepang) adalah demo browser untuk konsep penilaian transfer perawat-pasien: melihat masa depan perawatan dalam waktu dekat - dan memilih yang lebih aman.

> Full documentation in English: [README.md](README.md)

## Skenario

Dua perawat memindahkan seorang pasien (misalnya dari tempat tidur ke kursi roda) sementara sebuah kamera mengamati. Jika dilakukan dengan punggung membungkuk, pasien terlalu jauh, atau pivot sambil memuntir badan, manuver sehari-hari ini adalah cara perawat menumpuk cedera pinggang kronis - dan cara pasien mendapat memar atau terjatuh. MIRAI berperan sebagai "peramal masa depan perawatan":

1. **Sense (mengindra)** - MIRAI melacak kedua perawat dan pasien sebagai skeleton, lalu menilai risiko cedera secara langsung, frame demi frame, murni dari geometri tubuh.
2. **Predict (memprediksi)** - pada momen berisiko, video dijeda dan bola ajaib terbuka memproyeksikan tiga masa depan ~8 detik ke depan: *lanjut seperti ini* (pasien merosot, nyaris jatuh), *siapkan + pasien membantu* (bawa pasien ke tepi kursi, hitung bersama, lalu pandu saat pasien bangkit dengan kakinya sendiri), *jeda dan nilai ulang* (pasien tampak goyah, jadi dudukkan kembali dan periksa sebelum mengangkat). Setiap masa depan adalah kelanjutan gerakan yang dihitung dari skeleton saat itu dan dinilai ulang per frame proyeksi - bukan video yang diskenariokan.
3. **Intervene (mengintervensi)** - perawat berbicara dengan MIRAI (suara full-duplex), menonton setiap masa depan diputar sebagai figur manusia beranimasi dengan pembacaan risiko langsung, lalu memilih satu lewat suara atau klik. Masa depan yang dipilih diputar ulang, video dilanjutkan, dan siklus siap kembali untuk momen berisiko berikutnya.

## Alur demo

1. Jalankan `npm run dev`, buka halaman di Chrome, tekan "Load attached video", lalu Play.
2. Saat pengangkatan menjadi berisiko, video berhenti otomatis dan AI Dialog muncul bersama bola ajaib (dengan animasi masuk): MIRAI mengucapkan peringatan tentang cedera jangka panjang perawat/pasien sementara bola menampilkan momen berisiko tersebut.
3. Ketiga masa depan lalu diputar satu per satu di viewport besar bergaya VR (bukan di dalam bola) sebagai figur humanoid beranimasi dengan skeleton tetap terlihat: gerakan proyeksi yang panjang dan detail - lanjut seperti ini (pasien merosot, nyaris jatuh), siapkan + pasien membantu (tepi kursi, hitung bersama, pasien mendorong bangkit sementara perawat memandu), jeda dan nilai ulang (dudukkan kembali pasien yang goyah dan stabilkan) - lengkap dengan pembacaan risiko proyeksi yang mengikuti gerakan serta narasi suara. Otomatis lanjut saat narasi selesai, atau tekan "Next vision" / "Skip to the choice".
4. Bagian akhir menampilkan tiga pilihan berdampingan. Pilih dengan suara - ucapkan "one", "two", atau "three" - atau klik kartunya. Masa depan yang dipilih diputar di panel pratinjau sementara MIRAI menarasikan sebab-akibatnya, lalu video dilanjutkan secara otomatis.
5. Pada momen berisiko berikutnya bola terbuka lagi (risiko harus turun dulu di bawah 50, lalu melewati 60 - histeresis, sehingga momen yang sama tidak bisa memicu ulang tepat setelah video dilanjutkan) dan siklus sense-predict-intervene berulang. Semua angka risiko dihitung ulang dari skeleton proyeksi, bukan diskenariokan. Chip "Magic ball" dapat membuka kembali urutan ini kapan saja.

Jalan pintas latihan: buka `/?stage=vision` untuk langsung masuk ke urutan bola ajaib pada momen terburuk sampel berisiko, atau `/?stage=choose` untuk layar pemilihan.

Pengenalan suara membutuhkan Chrome dan akses jaringan; tanpanya, gunakan tombol dan chip cepat - AI tetap menjawab dengan suara. Suara dapat dimatikan lewat "AI voice: off".

## Inti program

Seluruh aplikasi adalah satu file, `worker/index.js`: handler `fetch` bergaya Cloudflare Worker yang menyajikan satu halaman HTML mandiri (CSS + JS inline, tanpa framework, tanpa dependensi runtime). `scripts/serve.mjs` membungkusnya menjadi server pengembangan lokal; `scripts/build.sh` menyalinnya ke `dist/` untuk deployment. Semua kode di antara penanda `// === logic-start ===` dan `// === logic-end ===` adalah logika bebas-DOM (geometri, penilaian, proyeksi) - bagian inilah yang diuji smoke test.

**Sense - dari keypoint ke risiko.** Setiap frame memuat hingga tiga orang (`nurse`, `nurse2`, `patient`) dengan 13 sendi dalam koordinat gambar ternormalisasi, hasil ekstraksi RTMPose (`scripts/extract_keypoints.py` -> `assets/sample-keypoints.json`) atau pembangkit sintetis sebagai cadangan. Fungsi `features()` menghitung per frame: sudut fleksi punggung, tekukan lutut, jarak dukungan (jarak panggul perawat-pasien dinormalisasi panjang punggung perawat), kemiringan pasien, dan proksi puntiran (garis bahu yang menyempit relatif terhadap lutut, dikalibrasi sendiri dari frame-frame awal). Jumlah berbobot yang sadar-fase menghasilkan risiko 0..1. Fase transfer (persiapan, duduk-ke-berdiri, mengangkat, pivot, mendudukkan) dideteksi dari gerakan panggul pasien. Peringatan menyala dengan histeresis: risiko harus turun di bawah 50 untuk siap kembali, lalu melewati 60.

**Predict - tiga masa depan.** `projectContinue` meneruskan kecepatan sendi saat ini dengan peredaman dan memperdalam pola berisiko sebanding dengan risiko saat itu (pasien lepas dari genggaman dan merosot). `projectAssist` membawa pasien ke tepi kursi dalam jangkauan, mendudukkannya tegak, menahan untuk hitungan bersama, lalu pasien bangkit dengan kakinya sendiri (lutut meluruskan, punggung tegak) sementara perawat tetap tegak dan hanya memandu. `projectPause` mendudukkan kembali pasien yang goyah ke posisi duduk tegak yang stabil dan menegakkan perawat keluar dari angkatan; karena manuver berbahaya telah berhenti, frame proyeksi kembali ke fase persiapan yang diberi bobot jauh lebih rendah oleh `features()` untuk tekukan lutut dan jarak sangga - sehingga risiko yang dihitung mencerminkan bahwa angkatan benar-benar dibatalkan, bukan angka yang diskenariokan. Setiap frame proyeksi dinilai ulang dengan `features()` yang sama seperti frame langsung, sehingga semua angka risiko di layar adalah hasil perhitungan sebab-akibat (terukur pada sampel: lanjut ~56->77, siapkan+bantu ~56->44, jeda ~56->14). Suntingan kontrafaktual yang sama juga menggerakkan overlay hijau "what-if ghost".

**Intervene - dialog AI full-duplex.** AI-nya adalah bola ajaib yang berbicara, bukan chat: `speechSynthesis` mengucapkan setiap jawaban sementara kata-katanya diketik sebagai caption langsung di bawah bola, `SpeechRecognition` (Chrome) mendengarkan perawat, ucapan yang terdengar tampil sebentar lalu memudar, dan menekan Speak saat AI berbicara akan menyelanya (barge-in). Pil status menampilkan keadaan duplex (speaking / listening / standing by). Dalam urutan vision, setiap masa depan diputar di viewport bergaya VR sebagai figur humanoid - torso, kepala, dan anggota badan kapsul yang dibangun dari 13 keypoint yang sama, dengan skeleton tetap tergambar di atasnya - bersama pembacaan risiko proyeksi langsung; pilihan dibuat lewat suara ("one", "two", "three") atau klik.

## Cara menjalankan

```sh
npm run dev
```

Buka:

```text
http://127.0.0.1:8790
```

Lalu tekan:

```text
Load attached video
```

Video MOV asli telah dikonversi menjadi `assets/sample-transfer.mp4` (1280x720 H.264 tanpa audio, demi kompatibilitas browser dan privasi). Untuk menghasilkan keypoint asli dari video tersebut, lihat `README_pose.md` (skrip Python RTMPose/MMPose; virtualenv-nya tidak ikut di repo).

## Integrasi MoshiRAG

Setelah setup MoshiRAG di RunPod berjalan dan main server menampilkan URL publik Gradio, jalankan aplikasi ini dengan URL tersebut:

```sh
MOSHIRAG_URL="https://xxxxx.gradio.live" npm run dev
```

Buka `http://127.0.0.1:8790`. Panel AI Dialog menampilkan status MoshiRAG. Saat health check server lolos, tekan **`Use MoshiRAG voice`** untuk meng-embed client voice full-duplex bawaan MoshiRAG **langsung di dalam panel AI Dialog** dan menyerahkan percakapan ke sana. Ini hibrida, bukan pengganti total:

- **MoshiRAG menangani percakapan bebas** saat aktif; TTS bawaan MIRAI otomatis dimatikan (toggle `AI voice` berubah ke off) agar dua suara tidak tumpang tindih. Tekan `Back to built-in voice` untuk mematikan, atau `Open in new tab` bila server Anda memblokir embedding iframe.
- **Mock bawaan tetap default dan fallback offline** - bila `MOSHIRAG_URL` tidak diset atau server tidur, dialog bawaan MIRAI (`speak()`/`SpeechRecognition`, ter-grounding lewat `advice()`) tetap jalan.
- **Narasi bola ajaib tetap pakai TTS**, tersinkron dengan preview motion dan pembacaan risiko.
- **Grounding**: client generik MoshiRAG adalah kotak hitam - MIRAI tak bisa menyuntikkan teks, membaca ucapannya, atau mendeteksi apa yang Anda katakan padanya (WebSocket `/api/chat` butuh handshake sesi/worker milik deployment-nya, dan Moshi speech-to-speech, jadi jembatan teks tidak andal). Sebagai gantinya panel menampilkan **strip konteks risiko live** (risiko, fase, trunk/lutut perawat, jarak pasien, tanda utama, tiga future) yang diperbarui tiap frame, plus tombol **`Copy context`** untuk menyalin ringkasan ter-grounding satu paragraf yang bisa diucapkan/ditempel ke MoshiRAG. **Saat Anda memilih future di MIRAI, konteks diawali dengan pilihan itu** (mis. "The nurse has chosen 'Ready + patient assists' ... risk 64 → 32"), sehingga yang Anda serahkan ke MoshiRAG sesuai dengan pilihan Anda.

Kenapa embed di panel, bukan menulis ulang stream dari nol: endpoint live MoshiRAG adalah **stream audio WebSocket di `/api/chat`** memakai codec Opus, bukan REST teks. Menulis ulang loop codec/WebSocket itu inline di `worker/index.js` satu-file tidak praktis, jadi MIRAI meng-embed client MoshiRAG sendiri (yang sudah menangani pipeline audio) dan meng-grounding-nya lewat strip konteks.

Untuk mengecek koneksi dari aplikasi ini:

```sh
curl http://127.0.0.1:8790/api/moshirag/config
curl http://127.0.0.1:8790/api/moshirag/health
```

### Grounding otomatis (opsional - butuh satu perubahan kecil di server)

Grounding otomatis penuh **tidak bisa** dari sisi MIRAI: klien Kyutai yang di-embed tak membaca parameter `instructions`/`prompt`, handshake-nya hanya membawa version/model, pesan control-nya hanya aksi tetap, dan ia tak pernah mengirim teks - jadi tak ada kait untuk menyuntik konteks. Persona/system-prompt model ada sepenuhnya di **server MoshiRAG Anda**. Untuk membuat Moshi otomatis tahu risiko live, tambahkan endpoint kecil di sana.

MIRAI sudah mengerjakan paruhnya: ia `POST` konteks live ke `/api/moshirag/context`, yang diteruskan dev server ke `${MOSHIRAG_URL}${MOSHIRAG_CONTEXT_PATH}` (default `/api/context`) setiap kali momen risiko-tinggi membuka bola, sebuah future dipilih, atau Anda menyalakan MoshiRAG voice. Body-nya berisi `{event, risk, level, high, phase, chosen, context}`.

Di server MoshiRAG, tambahkan route yang (1) mengembalikan `{"ok": true}` untuk `POST /api/context`, (2) menyimpan `context` terakhir, dan (3) **menyisipkannya ke system-prompt LLM** saat percakapan dimulai (mis. awali dengan "Current situation: <context>"), dan/atau menambahkannya sebagai dokumen RAG. Selama route itu belum ada, MIRAI mendeteksi 404 dan kembali ke tombol `Copy context` manual (tanpa error).

Catatan: Moshi bersifat **reaktif** - ia bicara sebagai respons audio, jadi meski ter-grounding ia tak akan *proaktif* mengumumkan momen risiko baru kecuali server Anda menyuntik giliran sintetis saat menerima `high: true`. Karena itu MIRAI tetap membuat pengumuman proaktif itu sendiri (peringatan risiko + tiga future + pilihan); pembagian yang disarankan: **MIRAI mengumumkan risiko, MoshiRAG menjawab pertanyaan lanjutan yang ter-grounding**.

## Validasi

```sh
npm run build      # salin worker ke dist/
npm run validate   # pastikan dist/ adalah ESM valid dan mengekspor fetch
npm run smoke      # render halaman, cek penanda konten, parse skrip browser
```

## Format JSON keypoint (opsional)

Lihat bagian "Optional keypoint JSON format" di [README.md](README.md) - koordinat dinormalisasi 0..1, `time` (detik) menggerakkan sinkronisasi video, sendi ber-confidence rendah dilewati, dan perawat kedua dapat diberikan per frame sebagai `nurse2`.
