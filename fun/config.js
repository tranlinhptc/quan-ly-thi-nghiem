const GOOGLE_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxr-8Y25S607UYytRjKutvw4Zhx69W05XOc3Qs5gsSBQNxAZ8S16mmt7Nj8xUV1nNIn/exec";



const MODULE_CONFIG = {
    TI: {
        TEMPLATE_DRIVE_ID: "1-VQ8Femmz7jaOoys3UvTeJyV1kAYRFjH",
        MODULE_PREFIX: "ti_",
        TITLE: "THỬ NGHIỆM BIẾN DÒNG ĐIỆN (CT/TI)",
        WORD_PREFIX: "ti"
    },

    TU: {
        TEMPLATE_DRIVE_ID: "1xRfbHxuOo4xPeV-Yn4aeMfjiXCHmD_C-",
        MODULE_PREFIX: "tu_",
        TITLE: "THỬ NGHIỆM BIẾN ĐIỆN ÁP (TU/VT)",
        WORD_PREFIX: "TU"
    },

    MC: {
        TEMPLATE_DRIVE_ID: "1xRfbHxuOo4xPeV-Yn4aeMfjiXCHmD_C-",
        MODULE_PREFIX: "mc_",
        TITLE: "THỬ NGHIỆM MÁY CẮT (MC)",
        WORD_PREFIX: "MC"
    },

    MBA: {
        TEMPLATE_DRIVE_ID: "1xRfbHxuOo4xPeV-Yn4aeMfjiXCHmD_C-",
        MODULE_PREFIX: "mba_",
        TITLE: "THỬ NGHIỆM MÁY BIẾN ÁP (MBA)",
        WORD_PREFIX: "MBA"
    }
};

// Xác định module hiện tại từ URL hoặc biến toàn cục
function getCurrentModule() {
    // Lấy từ biến toàn cục nếu có
    if (typeof CURRENT_MODULE !== 'undefined') {
        return MODULE_CONFIG[CURRENT_MODULE];
    }
    
    // Hoặc lấy từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const module = urlParams.get('module');
    if (module && MODULE_CONFIG[module]) {
        return MODULE_CONFIG[module];
    }
    
    // Mặc định: TI
    return MODULE_CONFIG.TI;
}