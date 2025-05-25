const socket = io();
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


socket.on('show-gift', gift => {

  console.log('Received gift:', gift);

  if (gift.is_thank) {
    // random 1 to 20
    const effectId = `effect${Math.floor(Math.random() * 20) + 1}`;
    showEffect(effectId, gift.username, gift.avatar);

    //     const giftBox = document.createElement('div');
    //     giftBox.className = 'gift-box';
    //     giftBox.innerText = `🎁 Cảm ơn ${gift.username} đã tặng ${gift.name} x${gift.count}`;
    //     frame.appendChild(giftBox);
    // 
    //     setTimeout(() => {
    //       giftBox.style.animation = 'fadeout 1s forwards';
    //       setTimeout(() => giftBox.remove(), 1000);
    //     }, 4000);
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


