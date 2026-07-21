/**
 * Google Apps Script — Bikin Google Form Prospek + Submit ke Kinetic CRM
 *
 * CARA PAKAI:
 * 1. Buka https://script.google.com/home → New Project
 * 2. Paste semua kode ini → Simpan (Ctrl+S)
 * 3. Ganti API_KEY di bawah dengan key dari CRM (Konfigurasi → Integrasi)
 * 4. Pilih fungsi "createProspekForm" → klik Run
 * 5. Setelah form jadi, buka formnya → ⋮ → Script Editor
 * 6. Paste ulang kode yang sama di script editor form
 * 7. Pilih fungsi "setupTrigger" → Run (authorize sekali)
 * 8. Selesai! Form siap dipublikasikan
 */

const API_KEY = 'ISI_API_KEY_DISINI';
const WEBHOOK_URL = 'https://kinetic-crm-app.vercel.app/api/v1/gform/webhook';

// ============================================================
// LANGKAH 1: Jalankan fungsi ini untuk membuat form
// ============================================================
function createProspekForm() {
  const form = FormApp.create('Form Prospek - Kinetic CRM');
  form.setDescription('Silakan isi data prospek di bawah ini. Data akan otomatis masuk ke CRM.')
    .setCollectEmail(true)
    .setShowLinkToRespondAgain(false);

  form.addTextItem()
    .setTitle('Nama Customer')
    .setHelpText('Nama perusahaan atau perorangan')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Tipe Perusahaan')
    .setChoiceValues(['Swasta', 'BUMN', 'Pemerintah', 'Asing'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Level')
    .setHelpText('Hot = prioritas, Medium = potensial, Low = prospek biasa')
    .setChoiceValues(['Hot', 'Medium', 'Low']);

  form.addTextItem().setTitle('Nama PIC');
  form.addTextItem().setTitle('Jabatan PIC');
  form.addTextItem().setTitle('No HP PIC');
  form.addTextItem().setTitle('Email PIC');
  form.addTextItem().setTitle('Kota');
  form.addTextItem().setTitle('NPWP');

  form.addParagraphTextItem().setTitle('Alamat');
  form.addTextItem().setTitle('Cabang');
  form.addTextItem().setTitle('Industri');
  form.addTextItem().setTitle('Bidang Usaha');
  form.addTextItem().setTitle('Provider Existing');
  form.addParagraphTextItem().setTitle('Kebutuhan');

  Logger.log('FORM JADI!');
  Logger.log('Edit form: ' + form.getEditUrl());
  Logger.log('Publikasikan: ' + form.getPublishedUrl());
  Logger.log('');
  Logger.log('LANJUTKAN KE LANGKAH 2:');
  Logger.log('Buka link edit form → ⋮ → Script Editor → paste ulang kode ini');
  Logger.log('Lalu jalankan fungsi setupTrigger()');
}

// ============================================================
// LANGKAH 2: Jalankan fungsi ini SETELAH script dipasang di form
// ============================================================
function setupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  if (triggers.length === 0) {
    ScriptApp.newTrigger('onSubmit')
      .forForm(FormApp.getActiveForm())
      .onFormSubmit()
      .create();
    Logger.log('Trigger berhasil dibuat! Form siap digunakan.');
  } else {
    Logger.log('Trigger sudah ada.');
  }
}

// ============================================================
// Fungsi yang jalan otomatis tiap kali form di-submit
// ============================================================
function onSubmit(e) {
  const itemResponses = e.response.getItemResponses();
  const answers = {};
  const keyMap = {
    'Nama Customer': 'nama_customer',
    'Tipe Perusahaan': 'tipe_perusahaan',
    'Level': 'level',
    'Nama PIC': 'pic_name',
    'Jabatan PIC': 'pic_position',
    'No HP PIC': 'pic_phone',
    'Email PIC': 'pic_email',
    'Kota': 'kota',
    'NPWP': 'npwp',
    'Alamat': 'alamat',
    'Cabang': 'cabang',
    'Industri': 'industri',
    'Bidang Usaha': 'bidang_usaha',
    'Provider Existing': 'provider_existing',
    'Kebutuhan': 'kebutuhan',
  };

  itemResponses.forEach(item => {
    const key = keyMap[item.getItem().getTitle()];
    if (key) answers[key] = item.getResponse();
  });

  UrlFetchApp.fetch(WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-api-key': API_KEY },
    payload: JSON.stringify({
      form_id: e.source.getId(),
      answers,
    }),
    muteHttpExceptions: true,
  });
}

// ============================================================
// TEST: Kirim data dummy ke webhook (jalanin kapan aja)
// ============================================================
function testWebhook() {
  const payload = {
    form_id: 'test-form',
    answers: {
      nama_customer: 'PT. Maju Bersama',
      tipe_perusahaan: 'swasta',
      level: 'hot',
      pic_name: 'Budi Santoso',
      pic_position: 'Procurement Manager',
      pic_phone: '08123456789',
      pic_email: 'budi@example.com',
      kota: 'Jakarta',
      kebutuhan: 'Pengadaan server dan jaringan',
    },
  };

  const res = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-api-key': API_KEY },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  Logger.log('Status: ' + res.getResponseCode());
  Logger.log('Response: ' + res.getContentText());
}
