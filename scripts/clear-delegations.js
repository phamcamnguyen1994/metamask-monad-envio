/**
 * Script để xóa delegations từ localStorage
 * Chạy trong browser console: node scripts/clear-delegations.js
 * Hoặc copy-paste vào console
 */

// Xem delegations hiện tại
const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
console.log('📋 Delegations hiện tại:', delegations);
console.log('📊 Tổng số:', delegations.length);

// Xóa tất cả
localStorage.removeItem('delegations');
console.log('✅ Đã xóa tất cả delegations!');

// Verify
const after = JSON.parse(localStorage.getItem('delegations') || '[]');
console.log('📋 Sau khi xóa:', after);

