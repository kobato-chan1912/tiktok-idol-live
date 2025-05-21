const { WebcastPushConnection } = require('tiktok-live-connector');
const overlayServer = require('./overlayServer');

let tiktokLive;
let isLive = false;

document.getElementById('toggleLive').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();

  if (!username) {
    alert('Vui lòng nhập username TikTok!');
    return;
  }

  if (!isLive) {
    // Start TikTok Live
    tiktokLive = new WebcastPushConnection(username);

    tiktokLive.connect().then(state => {
      console.log(`Connected to ${username}`);
      document.getElementById('toggleLive').innerText = 'Dừng Live';
      isLive = true;

      alert('Mở OBS và thêm nguồn trình duyệt: http://localhost:3000/overlay.html');
    }).catch(err => {
      console.error(err);
      alert('Không thể kết nối tới live.');
    });

    tiktokLive.on('chat', data => {
      // Không hiển thị comment
      console.log({
        avatar: data.uniqueId,
        username: data.nickname || data.uniqueId,
        content: data.comment
      });
    });

    tiktokLive.on('gift', data => {
      if (data.giftType === 1 && !data.repeatEnd) return;
      const giftData = {
        username: data.nickname || data.uniqueId,
        Name: `${data.giftName} (ID:${data.giftId})`,
        Cost: `${data.diamondCount} Diamonds`
      };
      overlayServer.sendGift(giftData);
    });

  } else {
    await tiktokLive.disconnect();
    overlayServer.clearGift();
    // overlayServer.closeServer?.(); // Nếu muốn tắt hẳn server
    isLive = false;
    document.getElementById('toggleLive').innerText = 'Bắt đầu Live';
    console.log('Ngắt kết nối.');
  }
});
