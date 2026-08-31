// ============================================================
// fun/common.js - FUNCTION DÙNG CHUNG CHO TẤT CẢ MODULE
// ============================================================

// ============================================================
// [SỬA] KHAI BÁO BIẾN TOÀN CỤC
// ============================================================
let globalHistoryData = [];
let prefix = 'ti_'; // Mặc định

// ============================================================
// [SỬA] HÀM LẤY PREFIX TỪ MODULE HIỆN TẠI
// ============================================================
function initPrefix() {
    if (typeof prefix !== 'undefined' && prefix) {
        return prefix;
    }
    if (typeof getCurrentModule === 'function') {
        const config = getCurrentModule();
        if (config && config.MODULE_PREFIX) {
            prefix = config.MODULE_PREFIX;
            return prefix;
        }
    }
    prefix = 'ti_';
    return prefix;
}

// ============================================================
// [SỬA] LẤY GOOGLE_WEB_APP_URL
// ============================================================
// const GOOGLE_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxr-8Y25S607UYytRjKutvw4Zhx69W05XOc3Qs5gsSBQNxAZ8S16mmt7Nj8xUV1nNIn/exec";

// ============================================================
// 1. HÀM KHỞI TẠO
// ============================================================

function setTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    document.getElementById('info_ngay').value = yyyy + '-' + mm + '-' + dd;
}

function fetchSubstations() {
    const cachedTrams = localStorage.getItem('CACHE_TRAMS');
    const select = document.getElementById('info_tram');
    if (cachedTrams) {
        populateSelect(JSON.parse(cachedTrams));
    } else {
        select.innerHTML = '<option value="" disabled selected>Đang tải danh sách trạm...</option>';
    }
    fetch(GOOGLE_WEB_APP_URL + "?action=getSubstations")
        .then(res => res.json())
        .then(data => {
            if(data.error) {
                if (!cachedTrams) select.innerHTML = `<option value="">⚠️ Lỗi: ${data.error}</option>`;
                console.error("Lỗi từ GAS:", data.error);
                return;
            }
            localStorage.setItem('CACHE_TRAMS', JSON.stringify(data));
            if (!cachedTrams) populateSelect(data);
        })
        .catch(err => {
            if (!cachedTrams) select.innerHTML = '<option value="">❌ Lỗi kết nối!</option>';
            console.error("Lỗi Fetch:", err);
        });
}

function populateSelect(data) {
    const select = document.getElementById('info_tram');
    select.innerHTML = '<option value="" disabled selected>-- Chọn Trạm --</option>';
    data.forEach(tram => {
        let option = document.createElement("option");
        option.value = tram;
        option.text = tram;
        select.appendChild(option);
    });
    if (localStorage.getItem(prefix + 'DRAFT')) {
        loadDraftData();
        checkUnlockForm();
    }
}
function checkUnlockForm() {
    const tram = document.getElementById('info_tram').value;
    const nganLo = document.getElementById('info_nganlo').value.trim();
    const zone = document.getElementById('locked_zone');
    const msg = document.getElementById('unlock_message');
    if (tram && tram !== "" && nganLo && nganLo !== "") {
        zone.classList.remove('form-locked');
        if (msg) msg.style.display = 'none';
    } else {
        zone.classList.add('form-locked');
        if (msg) msg.style.display = 'block';
    }
}

// ============================================================
// 2. HÀM XỬ LÝ DỮ LIỆU CŨ
// ============================================================

function loadOldDataSection() {
    const nganLo = encodeURIComponent(document.getElementById('info_nganlo').value.trim());
    const tram = encodeURIComponent(document.getElementById('info_tram').value);
    if (!nganLo || !tram) { alert("⚠️ Chưa chọn Trạm và Ngăn Lộ!"); return; }
    showLoading("Đang tải dữ liệu ...");
    const modName = prefix.replace('_', '').toUpperCase();
    const fetchUrl = `${GOOGLE_WEB_APP_URL}?nganLo=${nganLo}&tram=${tram}&module_name=${modName}`;
    fetch(fetchUrl).then(res => res.json()).then(data => {
        hideLoading();
        if (!data || data.length === 0 || data.error) { alert("ℹ️ Không tìm thấy dữ liệu cũ!"); return; }
        globalHistoryData = data;
        showHistoryModal(data);
    }).catch(err => { hideLoading(); alert("❌ Lỗi tải data: " + err); });
}

function loadLatestData() {
    const nganLo = encodeURIComponent(document.getElementById('info_nganlo').value.trim());
    const tram = encodeURIComponent(document.getElementById('info_tram').value);
    if (!nganLo || !tram) { alert("⚠️ Chưa chọn Trạm và Ngăn Lộ!"); return; }
    showLoading("Đang tải thông số gần nhất...");
    const modName = prefix.replace('_', '').toUpperCase();
    const fetchUrl = `${GOOGLE_WEB_APP_URL}?action=getLatest&nganLo=${nganLo}&tram=${tram}&module_name=${modName}`;
    fetch(fetchUrl).then(res => res.json()).then(data => {
        hideLoading();
        if (!data || Object.keys(data).length === 0 || data.error) {
            alert("ℹ️ Không tìm thấy dữ liệu cũ của thiết bị này trên hệ thống!");
            return;
        }
        applyLatestData(data);
    }).catch(err => { hideLoading(); alert("❌ Lỗi mạng: " + err); });
}

function applyLatestData(data) {
    const numWindingsId = prefix + 'num_windings';

    if (data[numWindingsId] !== undefined) {
        const el = document.getElementById(numWindingsId);
        if(el) {
            const oldVal = el.value;
            el.value = data[numWindingsId];
            if (oldVal !== data[numWindingsId]) {
                changeWindingCount();
            }
        }
    }

    for (let key in data) {
        const el = document.getElementById(key);
        if (el && data[key] !== undefined && data[key] !== '') {
            if (el.tagName === 'INPUT') {
                if (isConfigField(key)) {
                    el.value = data[key];
                } else {
                    el.value = "";
                    el.placeholder = data[key];
                    el.classList.remove('old-data-history', 'old-data', 'new-data', 'pass-color', 'fail-color');
                    el.classList.add('old-data-latest');
                    el.dataset.oldval = data[key];
                    el.dataset.dataType = 'latest';
                    el.style.color = '';
                    el.style.fontWeight = '';
                }
            } else if (el.tagName === 'SELECT' && key !== 'info_tram') {
                el.value = data[key];
            }
        }
    }

    ['chk_sec2', 'chk_sec3', 'chk_sec4', 'chk_sec5'].forEach(id => {
        const chk = document.getElementById(id);
        if(chk) {
            chk.checked = true;
            if (typeof toggleSection === 'function') {
                toggleSection(id.replace('chk', 'body'), chk);
            }
        }
    });

    if (typeof calculateAll === 'function') calculateAll();
    alert(`⚡ Đã nhập các số liệu mới nhất!`);
}

function showHistoryModal(dataArray) {
    const listDiv = document.getElementById('historyList');
    listDiv.innerHTML = '';
    dataArray.forEach((row, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        const modeMap = { "new": "Mới", "1yr": "Sau 1 năm", "3yr": "Sau 3 năm", "6yr": "Sau 6 năm", "boost": "Tăng cường" };
        const modeText = modeMap[row[prefix + 'mode']] || row[prefix + 'mode'] || 'Không ghi nhận';
        div.innerHTML = `<div class="history-date">📅 Ngày: ${row.ngayTN || '?'}</div><div class="history-person" style="color: #0288d1; font-weight: bold;">⚙️ Chế độ: ${modeText}</div>`;
        div.onclick = () => applyHistoryData(index);
        listDiv.appendChild(div);
    });
    document.getElementById('historyModal').style.display = 'flex';
}

function closeHistoryModal() { document.getElementById('historyModal').style.display = 'none'; }

function applyHistoryData(index) {
    if (typeof closeHistoryModal === 'function') closeHistoryModal();
    const data = globalHistoryData[index];
    let warnCount = 0;

    const numWindingsId = prefix + 'num_windings';
    if (data[numWindingsId] !== undefined) {
        const el = document.getElementById(numWindingsId);
        if(el) {
            const oldVal = el.value;
            el.value = data[numWindingsId];
            if (oldVal !== data[numWindingsId]) {
                renderAllTables();
            }
        }
    }

    for (let key in data) {
        const el = document.getElementById(key);
        if (el && data[key] !== undefined && data[key] !== '') {
            if (el.tagName === 'INPUT') {
                if (isConfigField(key)) {
                    el.value = data[key];
                } else {
                    el.classList.remove('old-data-latest', 'old-data', 'new-data', 'pass-color', 'fail-color');
                    el.classList.add('old-data-history');
                    el.placeholder = data[key];
                    el.dataset.oldval = data[key];
                    el.dataset.dataType = 'history';
                    el.style.color = '';
                    el.style.fontWeight = '';
                }
            } else if (el.tagName === 'SELECT' && key !== 'info_tram') {
                el.value = data[key];
            }
        }
    }

    if (typeof calculateAll === 'function') calculateAll();
    let msg = `⚡ Đã tải xong kết quả ngày ${data.ngayTN || ''} để đối chiếu!`;
    if (warnCount > 0) msg += `\n⚠️ CẢNH BÁO: Phát hiện ${warnCount} vị trí có sự thay đổi bất thường!`;
    alert(msg);
}

// ============================================================
// 3. HÀM XỬ LÝ NHẬP LIỆU
// ============================================================

function handleNewInput(event) {
    const el = event.target;
    if (el.value && el.value.trim() !== '') {
        el.classList.remove('old-data-latest', 'old-data-history', 'old-data', 'pass-color', 'fail-color');
        el.classList.add('new-data');
        el.style.color = '';
        el.style.fontWeight = '';
        if (el.placeholder) {
            el.placeholder = '';
        }
        delete el.dataset.dataType;
        el.classList.remove('warning-degradation', 'warning-increase');
        el.title = '';
    } else {
        el.classList.remove('new-data');
        el.style.color = '';
        el.style.fontWeight = '';
    }
    if (typeof calculateAll === 'function') calculateAll();
}

function captureInputs() {
    const data = {};
    document.querySelectorAll('input, select').forEach(el => { if(el.id && el.value) data[el.id] = el.value; });
    return data;
}

function saveDraftManually() {
    localStorage.setItem(prefix + 'DRAFT', JSON.stringify(captureInputs()));
    alert("💾 Đã lưu nháp!");
}

function loadDraftData() {
    const str = localStorage.getItem(prefix + 'DRAFT');
    if (!str) return;
    const data = JSON.parse(str);
    if (data['info_tram']) document.getElementById('info_tram').value = data['info_tram'];
    if (data['info_nganlo']) document.getElementById('info_nganlo').value = data['info_nganlo'];
    if (data[prefix + 'num_windings']) {
        document.getElementById(prefix + 'num_windings').value = data[prefix + 'num_windings'];
        renderAllTables();
    }
    for (let key in data) {
        const el = document.getElementById(key);
        if (el && data[key] !== "") {
            el.value = data[key];
        }
    }
    if (typeof calculateAll === 'function') calculateAll();
}

function clearDraft() {
    if(confirm("⚠️ Xóa sạch bản nháp mới?")) {
        localStorage.removeItem(prefix + 'DRAFT');
        location.reload();
    }
}

// ============================================================
// 4. HÀM XỬ LÝ LOADING
// ============================================================

function showLoading(text) { 
    const overlay = document.getElementById('loadingOverlay');
    const textEl = document.getElementById('loadingText');
    if (textEl) textEl.innerText = text;
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() { 
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

function toggleSection(sectionId, chk) { 
    const section = document.getElementById(sectionId);
    if (section) section.classList.toggle('hidden-section', !chk.checked);
}

// ============================================================
// 5. HÀM LƯU LÊN GOOGLE SHEET
// ============================================================

function syncOneDrive() {
    showLoading("Đang up dữ liệu ...");
    const nguoiDo = prompt("Nhập tên người thực hiện (để trống nếu không cần):", "");
    const tram = document.getElementById('info_tram').value || "";
    const nganLo = document.getElementById('info_nganlo').value || "";
    const maPhienGop = tram + "_" + nganLo;
    const modName = prefix.replace('_', '').toUpperCase();
    const payload = {
        module_name: modName,
        timestamp: new Date().toLocaleString('vi-VN'),
        maPhien: maPhienGop,
        ngayTN: document.getElementById('info_ngay').value,
        tram: tram,
        nganLo: nganLo,
        nguoiTN: nguoiDo || ""
    };

    document.querySelectorAll(`input[id^="${prefix}"], select[id^="${prefix}"]`).forEach(el => {
        let value = "";
        if (el.tagName === "INPUT") {
            value = el.value.trim() || el.value.trim();
        } else if (el.tagName === "SELECT") {
            value = el.value;
        } else {
            value = el.value;
        }
        value = value ? value.replace("75°C:", "").replace("ms", "").trim() : "";
        if (value && value !== '-' && value !== 'NaN' && value !== '0') payload[el.id] = value;
    });

    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));
    fetch(GOOGLE_WEB_APP_URL, { method: 'POST', body: formData })
        .then(res => res.text()).then(text => {
            hideLoading();
            if(text === "OK") alert("🚀 ĐÃ LƯU!");
            else alert("⚠️ Lỗi Server: " + text);
        }).catch(err => { hideLoading(); alert("❌ Lỗi gửi: " + err); });
}

// ============================================================
// 6. HÀM XUẤT WORD
// ============================================================

async function exportWordFromDrive() {
    if (!TEMPLATE_DRIVE_ID) {
        alert("⚠️ Chưa cấu hình TEMPLATE_DRIVE_ID!");
        return;
    }
    showLoading("Đang soạn file...");
    try {
        const res = await fetch(`${GOOGLE_WEB_APP_URL}?action=getTemplate&fileId=${TEMPLATE_DRIVE_ID}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const binaryString = window.atob(data.base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

        const payload = {};
        payload[prefix + 'tram'] = document.getElementById('info_tram').value || "";
        payload[prefix + 'nganlo'] = document.getElementById('info_nganlo').value || "";
        payload["ngayTN"] = document.getElementById('info_ngay').value || "";
        payload["nguoiTN"] = "";

        document.querySelectorAll(`input[id^="${prefix}"], select[id^="${prefix}"]`).forEach(el => {
            let val = getVal(el.id);
            payload[el.id] = val ? val.replace("75°C:", "").replace("ms", "").trim() : "";
        });

        //const checkboxes = ['chk_sec1', 'chk_sec2', 'chk_sec3', 'chk_sec4', 'chk_sec5'];
        //checkboxes.forEach(id => {
            //const checked = document.getElementById(id)?.checked;
            //if (checked) payload[`is_${id.replace('chk_', '')}`] = true;
       // });



                    // --- BỘ CÔNG TẮC ĐIỀU KIỆN ẨN/HIỆN FORM WORD ---
			const sec1 = document.getElementById('chk_sec1').checked; if (sec1) {payload["is_sec1"] = true;} else {    delete payload["is_sec1"];}
			const sec2 = document.getElementById('chk_sec2').checked; if (sec2) {payload["is_sec2"] = true;} else {    delete payload["is_sec2"];}
			const sec3 = document.getElementById('chk_sec3').checked; if (sec3) {payload["is_sec3"] = true;} else {    delete payload["is_sec3"];}
			const sec4 = document.getElementById('chk_sec4').checked; if (sec4) {payload["is_sec4"] = true;} else {    delete payload["is_sec4"];}
			const sec5 = document.getElementById('chk_sec5').checked; if (sec5) {payload["is_sec5"] = true;} else {    delete payload["is_sec5"];}
			const sec6 = document.getElementById('chk_sec6').checked; if (sec6) {payload["is_sec6"] = true;} else {    delete payload["is_sec6"];}

			const tuDK = document.getElementById('mc_tudk').value;
            payload["is_1tu"] = (tuDK === "1"); // Bằng true nếu là 1 tủ
            payload["is_3tu"] = (tuDK === "3"); // Bằng true nếu là 3 tủ
            
            const cuonDay = document.getElementById('mc_cuonday').value;
            payload["is_1C2O"] = (cuonDay === "1C2O");
            payload["is_2C1O"] = (cuonDay === "2C1O");
            payload["is_2C2O"] = (cuonDay === "2C2O");

            const tiepDiem = document.getElementById('mc_tiepdiem').value;
            payload["is_1TD"] = (tiepDiem === "1");
            payload["is_2TD"] = (tiepDiem === "2");
            payload["is_3TD"] = (tiepDiem === "3");
            payload["is_4TD"] = (tiepDiem === "4");
            // ------------------------------------------------

        const num_windings = document.getElementById(prefix + 'num_windings').value;
        payload["is_2wind"] = (num_windings === "2");
        payload["is_3wind"] = (num_windings === "3");
        payload["is_4wind"] = (num_windings === "4");
        payload["is_5wind"] = (num_windings === "5");
        payload["is_6wind"] = (num_windings === "6");
        payload["is_7wind"] = (num_windings === "7");
        payload["is_8wind"] = (num_windings === "8");

        if (payload["ngayTN"]) {
            const m = payload["ngayTN"].match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (m) payload["ngayTN"] = `${m[3]}/${m[2]}/${m[1]}`;
        }

        const zip = new PizZip(bytes.buffer);
        const doc = new window.docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
        doc.render(payload);
        const out = doc.getZip().generate({ type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE" });

        const dateStr = payload["ngayTN"] ? payload["ngayTN"].replace(/\//g, '-') : "New";
        const tramStr = payload[prefix + 'tram'] ? payload[prefix + 'tram'].replace(/[\/\\]/g, '-') : "Tram";
        const nganLoStr = payload[prefix + 'nganlo'] ? payload[prefix + 'nganlo'].replace(/[\/\\]/g, '-') : "NL";
        const wordPrefix = prefix.replace('_', '').toUpperCase();
        saveAs(out, `Bien ban thi nghiem ${wordPrefix}_${nganLoStr}_${tramStr}_${dateStr}.docx`);

        hideLoading();
    } catch (e) {
        hideLoading();
        alert("❌ Lỗi xuất Word: " + e.message);
    }
}

// ============================================================
// 7. HÀM ĐIỀU HƯỚNG TAB
// ============================================================

// Tab cho bảng RDC
function handleRdcTab(event, currentWinding, colType) {
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        const numWindings = parseInt(document.getElementById(prefix + 'num_windings')?.value) || 2;
        const cols = ['terminal', 'ref', 'a', 'b', 'c'];
        let colIndex = cols.indexOf(colType);
        let nextWinding = currentWinding;
        let nextCol = colType;

        if (event.key === 'Enter' || !event.shiftKey) {
            if (currentWinding < numWindings) {
                nextWinding++;
            } else {
                nextWinding = 1;
                colIndex = (colIndex + 1) % cols.length;
                nextCol = cols[colIndex];
                if (colIndex === 0) { event.target.blur(); return; }
            }
        } else {
            if (currentWinding > 1) {
                nextWinding--;
            } else {
                nextWinding = numWindings;
                colIndex = (colIndex - 1 + cols.length) % cols.length;
                nextCol = cols[colIndex];
                if (colIndex === cols.length - 1) { event.target.blur(); return; }
            }
        }

        let nextId = '';
        if (nextCol === 'terminal') {
            nextId = `${prefix}rdc_terminal_${nextWinding}`;
        } else if (nextCol === 'ref') {
            nextId = `${prefix}rdc_ref_${nextWinding}`;
        } else {
            nextId = `${prefix}rdc_m_${nextWinding}_${nextCol}`;
        }
        const nextEl = document.getElementById(nextId);
        if (nextEl) { nextEl.focus(); nextEl.select(); }
    }
}

// Tab cho bảng RCD
function handleRcdTab(event, currentWinding, colType, isPri) {
    if (event.key !== 'Tab' && event.key !== 'Enter') return;
    event.preventDefault();

    const numWindings = parseInt(document.getElementById(prefix + 'num_windings')?.value) || 2;
    const cols = ['a', 'b', 'c'];
    let colIndex = cols.indexOf(colType);
    let nextWinding = currentWinding;
    let nextIsPri = isPri;
    let nextCol = colType;

    if (event.key === 'Enter' || !event.shiftKey) {
        if (isPri) {
            nextWinding = 1;
            nextIsPri = false;
        } else if (currentWinding < numWindings) {
            nextWinding++;
        } else {
            colIndex = (colIndex + 1) % cols.length;
            if (colIndex === 0) {
                event.target.blur();
                return;
            }
            nextCol = cols[colIndex];
            nextWinding = 0;
            nextIsPri = true;
        }
    } else {
        if (isPri) {
            if (colIndex <= 0) {
                event.target.blur();
                return;
            }
            colIndex--;
            nextCol = cols[colIndex];
            nextWinding = numWindings;
            nextIsPri = false;
        } else if (currentWinding > 1) {
            nextWinding--;
        } else {
            if (colIndex > 0) {
                colIndex--;
                nextCol = cols[colIndex];
                nextWinding = 0;
                nextIsPri = true;
            } else {
                event.target.blur();
                return;
            }
        }
    }

    const nextId = nextIsPri
        ? `${prefix}rcd_pri_${nextCol}`
        : `${prefix}rcd_sec${nextWinding}_${nextCol}`;

    const nextEl = document.getElementById(nextId);
    if (nextEl) {
        nextEl.focus();
        nextEl.select();
    }
}

function handleEnterToNext(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
        const currentIndex = Array.from(inputs).indexOf(event.target);
        if (currentIndex < inputs.length - 1) {
            inputs[currentIndex + 1].focus();
            inputs[currentIndex + 1].select();
        }
    }
}

// ============================================================
// 8. HÀM TIỆN ÍCH
// ============================================================

function isConfigField(id) {
    const commonSuffixes = [
        '_nsx', '_no', '_namsx', '_udm', '_idm', '_inm', '_kieu', '_ghichu', 
        '_temp', '_humidity', '_csuat', '_ddung', '_kieu',
        '_terminal_', '_term'
    ];
    const systemIds = ['info_ngay', 'info_tram', 'info_nganlo'];
    if (systemIds.includes(id)) return true;
    return commonSuffixes.some(suffix => id.includes(suffix));
}

function getVal(id) {
    const el = document.getElementById(id);
    if (!el) return "";
    if (el.tagName === "SPAN" || el.tagName === "DIV") return el.innerText.trim();
    if (isConfigField(id)) {
        return (el.value && el.value.trim() !== "") ? el.value : (el.placeholder || "");
    }
    return el.value || "";
}
