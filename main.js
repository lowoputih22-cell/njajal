/* -------------------------
   DATA & INIT
   ------------------------- */
let daftar = JSON.parse(localStorage.getItem("soal_asli") || "[]");
let modeArab = true;

const arabDigits = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];

function toArabicNumber(n){
    return String(n).split("").map(c => /\d/.test(c) ? arabDigits[+c] : c).join("");
}

function toast(msg){
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.classList.add("show");
    setTimeout(()=> t.classList.remove("show"), 2200);
}

/* -------------------------
   RENDER LIST
------------------------- */
function renderList(){
    const tbody = document.getElementById("tbodySoal");
    tbody.innerHTML = "";

    daftar.forEach((it, i) => {
        const tr = document.createElement("tr");

        const tdNo = document.createElement("td");
        tdNo.style.fontWeight = "700";
        tdNo.style.width = "36px";
        tdNo.textContent = it.mode === "arab" ? toArabicNumber(i+1) : (i+1);

        const tdText = document.createElement("td");
        tdText.textContent = it.text;
        tdText.style.textAlign = it.mode === "arab" ? "right" : "left";
        if(it.mode === "arab") tdText.classList.add("arabic");

        const tdAct = document.createElement("td");
        tdAct.style.textAlign = "right";

        const b1 = document.createElement("button");
        b1.className = "iconBtn";
        b1.textContent = "Edit";
        b1.onclick = () => editItem(i);

        const b2 = document.createElement("button");
        b2.className = "iconBtn del";
        b2.textContent = "Hapus";
        b2.onclick = () => showDeleteConfirm(i);

        tdAct.appendChild(b1);
        tdAct.appendChild(document.createTextNode(" "));
        tdAct.appendChild(b2);

        tr.appendChild(tdNo);
        tr.appendChild(tdText);
        tr.appendChild(tdAct);

        tbody.appendChild(tr);
    });

    document.getElementById("totalCount").innerText = daftar.length;
}

/* SAVE */
function save(){
    localStorage.setItem("soal_asli", JSON.stringify(daftar));
    renderList();
}

/* -------------------------
   INPUT FUNCTIONS
------------------------- */
function isRTL(txt){
    return /[\u0600-\u06FF]/.test(txt);
}

function addSoal(){
    const t = document.getElementById("soalInput").value.trim();
    if(!t){ toast("Tulis soal dulu"); return; }

    daftar.push({
        text: t,
        mode: modeArab ? "arab" : "latin",
        direction: modeArab ? "rtl" : "ltr"
    });

    document.getElementById("soalInput").value = "";
    save();
    toast("Soal ditambahkan!");
}

/* EDIT */
let editingIndex = null;

function editItem(i){
    const s = daftar[i];
    const box = document.getElementById("editQuestion");
    box.value = s.text;
    box.style.direction = s.direction || (s.mode === "arab" ? "rtl" : "ltr");
    box.style.textAlign = (s.direction === "rtl" || s.mode === "arab") ? "right" : "left";
    editingIndex = i;
    document.getElementById("editModal").style.display = "flex";
}
function closeEdit(){
    document.getElementById("editModal").style.display = "none";
}
function saveEdit(){
    const newText = document.getElementById("editQuestion").value.trim();
    if(!newText){ toast("Teks kosong"); return; }

    const dir = isRTL(newText) ? "rtl" : "ltr";
    daftar[editingIndex].text = newText;
    daftar[editingIndex].direction = dir;
    daftar[editingIndex].mode = dir === "rtl" ? "arab" : "latin";

    save();
    closeEdit();
    toast("Soal diperbarui!");
}

/* -------------------------
   DELETE & RESET
------------------------- */
let deleteIndex = null;

function showDeleteConfirm(i){
    deleteIndex = i;
    document.getElementById("deleteOverlay").style.display = "flex";
}
function hideDeleteConfirm(){
    document.getElementById("deleteOverlay").style.display = "none";
}
function doDelete(){
    if(deleteIndex !== null){
        daftar.splice(deleteIndex, 1);
        save();
        toast("Soal dihapus");
    }
    deleteIndex = null;
    hideDeleteConfirm();
}

function showConfirm(){
    document.getElementById("confirmOverlay").style.display = "flex";
}
function hideConfirm(){
    document.getElementById("confirmOverlay").style.display = "none";
}
function doReset(){
    daftar = [];
    save();
    hideConfirm();
    toast("Semua soal direset");
}

/* -------------------------
   TOGGLE MODE
------------------------- */
function toggleMode(){
    modeArab = !modeArab;
    const knob = document.getElementById("knob");
    const inp = document.getElementById("soalInput");
    const label = document.getElementById("modeLabel");

    if(modeArab){
        knob.classList.add("rtl");
        label.textContent = "Arab (RTL)";
        inp.dir = "rtl"; inp.style.textAlign = "right";
    } else {
        knob.classList.remove("rtl");
        label.textContent = "Latin (LTR)";
        inp.dir = "ltr"; inp.style.textAlign = "left";
    }
}

/* -------------------------
   PREVIEW
------------------------- */
function openPreview(){
    if(!daftar.length){ toast("Belum ada soal"); return; }

    const sem = document.getElementById("semester").value;
    const th = document.getElementById("tahun").value;
    const fan = document.getElementById("fan").value;
    const kelas = document.getElementById("kelas").value;

    let html = buildPaperHTML(sem, th, fan, kelas);

    const w = window.open('', '_blank');
    w.document.open();
    w.document.write(`
        <html>
        <head>
            <title>Preview Soal</title>
            <meta charset="utf-8" />
            <link href="https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body{ margin:0; font-family: Arial, Helvetica, sans-serif; color:#000; padding:10mm; }
                .paper{ width:210mm; min-height:330mm; box-sizing:border-box; }
                .pdf-arab { font-family: 'Scheherazade New', serif; direction:rtl; text-align:right; }
                table{ width:100%; border-collapse:collapse; }
            </style>
        </head>
        <body>
            <div class="paper">${html}</div>
        </body>
        </html>
    `);
    w.document.close();
}

/* Build PDF HTML */
function buildPaperHTML(sem, th, fan, kelas){
    let html = `
<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">

    <img src="${LOGO_PPDA}" style="width:115px;">

    <div style="text-align:center; flex:1; font-size:13pt; font-weight:700; line-height:1.5;">
        UJIAN AKHIR SEMESTER ${sem} <br>
        MUHADHOROH “MANBAUS SHOLAH” <br>
        PONDOK PESANTREN DARUTTAUHID AL ALAWI <br>
        TAHUN PELAJARAN ${th}
    </div>

    <img src="${LOGO_MADIN}" style="width:115px;">

</div>

<div style="border-bottom: 2px solid black; margin: 10px 0 15px 0;"></div>

<div style="display:flex; gap:10px; margin:18px 0; align-items:flex-start;">
    <table style="width:6.5cm; font-size:12pt; line-height:1.1;">
        <tr><td>Fan</td><td>:</td><td>${escapeHtml(fan)}</td></tr>
        <tr><td>Kelas</td><td>:</td><td>${escapeHtml(kelas)}</td></tr>
    </table>

    <table style="width:8.3cm; font-size:12pt; line-height:1.1;">
        <tr><td>Nama</td><td>:</td><td>..........................................</td></tr>
        <tr><td>No. Ujian</td><td>:</td><td>..........................................</td></tr>
    </table>

    <table style="width:4cm; font-size:12pt; border:1px solid black; text-align:center;">
        <tr><td style="font-weight:bold;">NILAI</td></tr>
        <tr><td>&nbsp;</td></tr>
    </table>
</div>

<div style="border-bottom: 1px solid black; margin: 10px 0 20px 0;"></div>

<p style="font-size:20pt; font-weight:bold; text-decoration:underline; text-align:center;">
    <span class="pdf-arab" dir="rtl">أجب هذه الأسئلة بأجوبة موافقة !</span>
</p>
`;
function fixArabicPunctuation(txt){
    return txt
        .replace(/!/g, `<span style="direction:ltr; unicode-bidi:bidi-override;">!</span>`)
        .replace(/\?/g, `<span style="direction:ltr; unicode-bidi:bidi-override;">?</span>`)
        .replace(/\./g, `<span style="direction:ltr; unicode-bidi:bidi-override;">.</span>`);
}

daftar.forEach((it, i) => {
    if(it.mode === "arab"){

        html += `
        <div style="font-size:28pt; margin-bottom:6px; direction:rtl;">
            <table style="width:100%; font-family:'Scheherazade New', serif;">
                <tr>
                    <td style="width:28px; vertical-align:top; font-size:16pt; font-family:'Scheherazade New', serif;">
                        ${toArabicNumber(i+1)}.
                    </td>
                    <td class="pdf-arab">
                        ${fixArabicPunctuation(escapeHtml(it.text))}
                    </td>
                </tr>
            </table>
        </div>`;
    } else {

        html += `
        <div style="font-size:16pt; margin-bottom:12px; direction:ltr;">
            <table style="width:100%;">
                <tr>
                    <td style="width:28px; vertical-align:top;">${i+1}.</td>
                    <td>${escapeHtml(it.text)}</td>
                </tr>
            </table>
        </div>`;
    }
});


    return html;
}

/* DOWNLOAD PDF */
function openRename(){
    const kelas = document.getElementById("kelas").value || "Kelas";
    const fan = document.getElementById("fan").value || "Mapel";
    const tahun = (document.getElementById("tahun").value || "Tahun").replace(/\//g, "_");

    document.getElementById("fileNameInput").value = `${kelas} - ${fan} - ${tahun}`;
    document.getElementById("renameModal").style.display = "flex";
}
function closeRename(){
    document.getElementById("renameModal").style.display = "none";
}

function confirmDownloadPDF(){
    let raw = document.getElementById("fileNameInput").value.trim();
    let filename = (raw || "Soal_Ujian").replace(/\s+/g, "_");

    closeRename();
    generatePDF(filename);
}

function generatePDF(filename){
    if(!daftar.length){ toast("Belum ada soal"); return; }

    const sem = document.getElementById("semester").value;
    const th = document.getElementById("tahun").value;
    const fan = document.getElementById("fan").value;
    const kelas = document.getElementById("kelas").value;

    const htmlContent = `
        <div class="paper" style="font-family:Arial;">
            ${buildPaperHTML(sem, th, fan, kelas)}
        </div>
    `;

    const temp = document.createElement("div");
    temp.innerHTML = htmlContent;
    document.body.appendChild(temp);

    temp.querySelectorAll(".pdf-arab").forEach(el=>{
        el.style.fontFamily="'Scheherazade New', serif";
        el.style.direction="rtl";
        el.style.textAlign="right";
    });

    temp.querySelectorAll(".pdf-arab").forEach(el=>{
    el.style.fontFamily = "'Scheherazade New', serif";
    el.style.fontSize = "16pt";      // <<< UKURAN FONT SOAL ARAB
    el.style.direction = "rtl";
    el.style.textAlign = "right";
    });

    html2pdf().set({
        margin: 0,
        filename: filename + ".pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: [216, 330], orientation: "portrait" }
    }).from(temp)
      .save()
      .then(()=> temp.remove());
}

/* UTIL */
function escapeHtml(str){
    if(!str && str !== 0) return "";
    return String(str)
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'", "&#039;");
}

/* INIT */
renderList();