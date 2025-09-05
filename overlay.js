const socket = io({
  transports: ['websocket']
});

const frame = document.querySelector('body');


let currentActiveEffect = null;
let currentEffectTimeout = null;


function showEffect(startingText, username, avatarBaseUrl) {
  const effectElement = document.querySelector(".contentTk");
  if (!effectElement) {
    console.error("Effect element not found:", effectId);
    return;
  }

  // Update avatar
  const avatarImg = effectElement.querySelector('.avatarTk');
  if (avatarImg) {
    avatarImg.src = avatarBaseUrl;
  }

  // Update username and message (handle different structures)
  const usernameSpan = effectElement.querySelector('#usernameDisplay');
  
  if (usernameSpan) {
    usernameSpan.textContent = username;
  }
  
  const startingTextElement = effectElement.querySelector('.thank-you-text');
  if (startingTextElement) {
    startingTextElement.textContent = startingText;
  }


  let effectIndex = Math.floor(Math.random() * 2) + 1;
  console.log(effectIndex)
  startFireworkEffect(`effect${effectIndex}`);

}

function showVideoEffect(effectId, username, avatarBaseUrl) {


  const effectElement = document.getElementById(effectId);
  if (!effectElement) {
    console.error("Effect element not found:", effectId);
    return;
  }

  // Update avatar
  const avatarImg = effectElement.querySelector('.avatar');
  if (avatarImg) {
    avatarImg.src = avatarBaseUrl;
  }

  // Update username and message
  const usernameContainer = effectElement.querySelectorAll('.thank-title');
  // random 1 to 9
  const usernameEffect = Math.floor(Math.random() * 9) + 1;
  // add class thankyou-eff{eff} 
  usernameContainer.forEach(container => {
    container.classList.add(`thankyou-eff${usernameEffect}`);
  });
  const usernameSpan = effectElement.querySelector('.username');
  if (usernameSpan) {
    usernameSpan.textContent = username;
  }

  // update khung 
  const khungImg = effectElement.querySelector('.khung');
  if (khungImg) {
    // random 1 ddeens 8 
    // const khungIndex = Math.floor(Math.random() * 8) + 1; // Random from 1 to 8
    const khungIndex = 1;
    khungImg.src = `khung/${khungIndex}.png`;
  }

  effectElement.classList.add('active');

  // đóng hiệu ứng sau 5s có fadeout
  setTimeout(() => {
    effectElement.style.animation = 'fadeout 1s forwards';
    setTimeout(() => {
      effectElement.classList.remove('active');
      effectElement.style.animation = ''; // Reset animation
    }, 1000);
  }, 5000);

}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomFromEffect(effect) {
  const effectName = effect.name;

  const gifFiles = effect.gifs.split(',').map(s => s.trim());
  const gifFile = randomItem(gifFiles);
  const gif = "/assets/" + effectName + "/" + gifFile;

  let soundFile = null;
  if (gifFile) {
    // Lấy thư mục từ gifFile
    const gifFolder = gifFile.substring(0, gifFile.lastIndexOf('/'));

    const soundFiles = effect.sounds
      .split(',')
      .map(s => s.trim())
      .filter(f => f.substring(0, f.lastIndexOf('/')) === gifFolder);

    if (soundFiles.length > 0) {
      soundFile = randomItem(soundFiles);
    }
  }



  const sound = "/assets/" + effectName + "/" + soundFile;
  return { gif, sound };
}


function showVideoElement(gift) {
  const effectBox = document.createElement('div');
  effectBox.className = 'effect-box';
  const videoElement = document.createElement('video');
  videoElement.className = 'effect-gif-nomask';
  videoElement.src = gift.video;
  videoElement.muted = false;
  effectBox.appendChild(videoElement);
  frame.appendChild(effectBox);
  videoElement.play();

  videoElement.addEventListener('loadedmetadata', () => {
    const videoDuration = videoElement.duration;

    // Đặt timer cảnh báo trước 5s khi video gần hết
    const warnTime = (videoDuration - 5) * 1000;
    if (warnTime > 0 && !gift.is_vip) {
      setTimeout(() => {

        // videoElement.style.opacity = '0.4';
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'black';
        overlay.style.opacity = '0.5'; // Độ đậm của lớp phủ
        overlay.style.pointerEvents = 'none'; // Không chặn click vào video

        // Đảm bảo effectBox là position: relative
        effectBox.style.position = 'relative';

        // Thêm video trước, rồi thêm overlay
        effectBox.appendChild(videoElement);
        effectBox.appendChild(overlay);

        showVideoEffect("video-effect1", gift.username, gift.avatar);
      }, warnTime);
    }
  });

  // Khi video kết thúc thì fadeout và remove
  videoElement.addEventListener('ended', () => {
    effectBox.style.animation = 'fadeout 1s forwards';
    setTimeout(() => effectBox.remove(), 1000);
  });
}


socket.on('show-gift', gift => {

  console.log('Received gift:', gift);


  // const amount = parseInt(gift.count);




  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type');



  if (gift.is_thank && type == 1 && !gift.is_video && !gift.is_member) {

    
    showEffect("Cảm ơn", gift.username, gift.avatar);


  }


  if (type == 1 && !gift.is_video && gift.is_member) {

    
    showEffect("Xin chào", gift.username, gift.avatar);


  }







  if (gift.main_effect && type == 2) {
    let totalDelay = 0; // dùng cộng dồn thay vì i * duration

    for (let i = 0; i < gift.gift_count; i++) {
      // Chọn effect cho lần render này (KHÔNG ghi đè vào gift gốc)
      let gifUrl = gift.gif;
      let soundUrl = gift.sound;

      if (gift.effect_setting) {
        const effect = pickRandomFromEffect(gift.effect_setting);

        gifUrl = "http://localhost:4001" + effect.gif;
        soundUrl = "http://localhost:4001" + effect.sound;
      }

      // Thời lượng riêng cho lần này
      const duration = gifUrl.includes('special') ? 10000 : 5000;

      // Lên lịch hiển thị theo tổng delay đã cộng dồn
      setTimeout(() => {
        const effectBox = document.createElement('div');
        effectBox.className = 'effect-box';

        const gif = document.createElement('img');
        gif.className = gifUrl.includes('nomask') ? 'effect-gif-nomask' : 'effect-gif';
        gif.src = gifUrl;
        effectBox.appendChild(gif);
        frame.appendChild(effectBox);

        const audio = new Audio(soundUrl);
        audio.play();

        // Hết duration thì fadeout & remove
        setTimeout(() => {
          effectBox.style.animation = 'fadeout 1s forwards';
          setTimeout(() => effectBox.remove(), 1000);
        }, duration);
      }, totalDelay);

      // Cộng dồn cho lượt kế tiếp
      totalDelay += duration;
    }


  }



  if (gift.is_video && type == 2) {

    setTimeout(() => {
      showVideoElement(gift);
    }, gift.show_seconds * 1000);


  }





});


