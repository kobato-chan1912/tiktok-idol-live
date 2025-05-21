const socket = io();

const giftBox = document.getElementById('gift-box');

socket.on('show-gift', (gift) => {
  giftBox.innerHTML = `Cảm ơn ${gift.username} đã tặng ${gift.Cost} ${gift.Name}`;
  giftBox.style.display = 'block'; // Quan trọng để kích hoạt transition

  requestAnimationFrame(() => {
    giftBox.classList.add('show');
  });

  // Ẩn sau 5 giây
  setTimeout(() => {
    giftBox.classList.remove('show');
    setTimeout(() => {
      giftBox.style.display = 'none';
    }, 500); // chờ fade-out xong
  }, 5000);
});



socket.on('clear', () => {
  giftBox.style.display = 'none';
});
