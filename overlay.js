const socket = io({
  transports: ['websocket']
});

const frame = document.querySelector('body');


let currentActiveEffect = null;
let currentEffectTimeout = null;


function showEffect(effectId, username, avatarBaseUrl) {
  if (currentActiveEffect) {
    currentActiveEffect.classList.remove('active');
  }

  const effectElement = document.getElementById(effectId);
  if (!effectElement) {
    console.error("Effect element not found:", effectId);
    return;
  }

  // Update avatar
  const avatarImg = effectElement.querySelector('.avatar');
  if (avatarImg) {
    avatarImg.src = avatarBaseUrl + encodeURIComponent(username);
  }

  // Update username and message (handle different structures)
  const usernameSpan = effectElement.querySelector('.username');
  const messageP = effectElement.querySelector('.message'); // Most common
  let baseMessageText = "Cảm ơn ";
  let additionalMessage = " đã tặng quà!";
  let fullMessage = "";

  switch (effectId) {
    // Original 5
    case 'effect1': baseMessageText = "Cảm ơn "; additionalMessage = " đã tặng quà!"; break;
    case 'effect2': baseMessageText = "Cảm ơn "; additionalMessage = " đã tặng quà!"; break;
    case 'effect3': baseMessageText = "Cảm ơn "; additionalMessage = " đã tặng quà!"; break;
    case 'effect4': baseMessageText = "Cảm ơn "; additionalMessage = " đã tặng quà!"; break;
    case 'effect5':
      // Special handling for multi-span message
      if (messageP) {
        messageP.innerHTML =
          `<span class="text-part">Cảm ơn </span>` +
          `<span class="text-part username">${username}</span> ` +
          `<span class="text-part">đã tặng </span>` +
          `<span class="text-part">quà!</span>`;
        const parts = messageP.querySelectorAll('.text-part');
        parts.forEach((part, index) => {
          part.style.animation = 'none'; // Reset first
          void part.offsetWidth; // Reflow
          part.style.animation = `textCascadeOriginal 0.3s ease-out ${0.3 + index * 0.1}s forwards`;
        });
      }
      fullMessage = "SKIP"; // Indicate message handled
      break;
    // Effects 6-15
    case 'effect6': baseMessageText = "Cảm ơn "; additionalMessage = " đã chiếu sáng ngày của tôi!"; break;
    case 'effect7': baseMessageText = "Tên bạn "; additionalMessage = " sáng rực!"; break;
    case 'effect8': baseMessageText = "Quà của "; additionalMessage = " là một kho báu!"; break;
    case 'effect9': baseMessageText = ""; additionalMessage = `, bạn là một ngôi sao băng!`; break;
    case 'effect10':
      baseMessageText = "Cảm ơn "; additionalMessage = " đã gây nhiễu hệ thống!";
      effectElement.dataset.text = `Cảm ơn ${username} đã gây nhiễu hệ thống!`;
      break;
    case 'effect11': baseMessageText = ""; additionalMessage = ` đã mở khóa thành tựu "Nhà Hảo Tâm Vĩ Đại"!`; break;
    case 'effect12': baseMessageText = "Tiệc thôi nào! Cảm ơn "; additionalMessage = "!"; break;
    case 'effect13': baseMessageText = "Một món quà diệu kỳ từ "; additionalMessage = "!"; break;
    case 'effect14': baseMessageText = "SIÊU CẢM ƠN "; additionalMessage = "!"; break;
    case 'effect15': baseMessageText = "Trái tim tôi rung động vì "; additionalMessage = "!"; break;
    // Effects 16-20
    case 'effect16': baseMessageText = "PLAYER "; additionalMessage = " IS GENEROUS!"; break;
    case 'effect17': baseMessageText = "A Gift From The Incredible "; additionalMessage = ""; break;
    case 'effect18': baseMessageText = "Gratitude Protocol Executed. Donor: "; additionalMessage = "."; break;
    case 'effect19': baseMessageText = "Thanks, "; additionalMessage = ", for warping into my heart!"; break;
    case 'effect20': // Handled by specific structure
      const vipUsernameSpan = effectElement.querySelector('.text-details .username');
      if (vipUsernameSpan) vipUsernameSpan.textContent = username;
      fullMessage = "SKIP";
      break;

    default: baseMessageText = "Cảm ơn "; additionalMessage = " đã tặng quà!";
  }

  if (fullMessage !== "SKIP") {
    if (usernameSpan && !messageP) { // Only username span present in some simple cases
      usernameSpan.textContent = username;
    } else if (messageP) {
      // Reconstruct message, ensuring .username span is correctly placed
      const userSpanHTML = `<span class="username">${username}</span>`;
      let finalMsg = "";
      if (baseMessageText.endsWith(" ")) { // Username directly after base
        finalMsg = baseMessageText + userSpanHTML + additionalMessage;
      } else if (additionalMessage.startsWith(",")) { // Username at start of additional
        finalMsg = baseMessageText + userSpanHTML + additionalMessage;
      }
      else { // Default case: User between base and additional
        finalMsg = baseMessageText + userSpanHTML + " " + additionalMessage;
      }
      // Handle cases where base or additional might be empty for username-only messages
      if (baseMessageText === "" && additionalMessage.startsWith(",")) { // e.g. effect9
        finalMsg = userSpanHTML + additionalMessage;
      } else if (baseMessageText !== "" && additionalMessage === "") { // e.g. effect17
        finalMsg = baseMessageText + userSpanHTML;
      }

      messageP.innerHTML = finalMsg.trim();
    }
  }


  // Trigger reflow before re-adding active class for animations
  void effectElement.offsetWidth;
  // Trigger reflow for all children that might have animations.
  const allChildren = effectElement.querySelectorAll('*');
  allChildren.forEach(child => void child.offsetWidth);


  effectElement.classList.add('active');
  currentActiveEffect = effectElement;

  const clickedButton = Array.from(document.querySelectorAll('.controls button')).find(btn => btn.getAttribute('onclick').includes(`'${effectId}'`));
  if (clickedButton) {
    clickedButton.classList.add('active-btn');
    currentActiveButton = clickedButton;
  }

  let scrollTarget = effectElement;
  if (effectElement.parentElement.classList.contains('thank-you-wrapper')) {
    scrollTarget = effectElement.parentElement;
  }
  scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });


  if (currentEffectTimeout) {
    clearTimeout(currentEffectTimeout);
  }

  currentEffectTimeout = setTimeout(() => {
    if (currentActiveEffect) {
      currentActiveEffect.classList.remove('active');
    }
    currentEffectTimeout = null;
  }, 4000);

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
    if (warnTime > 0) {
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



  if (gift.is_thank && type == 1) {
    // random 1 to 20
    setTimeout(() => {
      // const effectId = `effect${Math.floor(Math.random() * 20) + 1}`;
      // random effectId từ 1 đến 20 nhưng bỏ số 19
      let effectIndex = Math.floor(Math.random() * 19) + 1;
      if (effectIndex == 19){
        effectIndex = 9;
      }
      const effectId = `effect${effectIndex}`;

      showEffect(effectId, gift.username, gift.avatar);
    }, 3000);

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
    }, 1500); // 1.5s đệm sau hiệu ứng cuối


  }





});


