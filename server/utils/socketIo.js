/**
 * Socket.IO Instance Manager
 * Lưu trữ io instance để sử dụng trong services
 */

let ioInstance = null;

/**
 * Set io instance
 * @param {Server} io - Socket.IO server instance
 */
function setIoInstance(io) {
  ioInstance = io;
}

/**
 * Get io instance
 * @returns {Server|null} Socket.IO server instance
 */
function getIoInstance() {
  return ioInstance;
}

module.exports = {
  setIoInstance,
  getIoInstance
};


