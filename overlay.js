const socket = io();
const frame = document.querySelector('body');




socket.on('show-gift', gift => {

  console.log('Received gift:', gift);

  if (gift.is_thank) {
    const giftBox = document.createElement('div');
    giftBox.className = 'gift-box';
    giftBox.innerText = `🎁 Cảm ơn ${gift.username} đã tặng ${gift.name} x${gift.count}`;
    frame.appendChild(giftBox);

    setTimeout(() => {
      giftBox.style.animation = 'fadeout 1s forwards';
      setTimeout(() => giftBox.remove(), 1000);
    }, 4000);
  }

  if (gift.main_effect) {
    const effect = {
      gif: gift.gif,
      sound: gift.sound,  
    }
    const effectBox = document.createElement('div');
    effectBox.className = 'effect-box';

    const gif = document.createElement('img');
    gif.className = 'effect-gif';
    gif.src = effect.gif;
    console.log('effect.gif', effect.gif);
    effectBox.appendChild(gif);
    frame.appendChild(effectBox);

    const audio = new Audio(effect.sound);
    audio.play();

    setTimeout(() => {
      effectBox.style.animation = 'fadeout 1s forwards';
      setTimeout(() => effectBox.remove(), 1000);
    }, 5000);
  }
});


