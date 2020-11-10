import stylesheet from './stylesheet.css';

function countdownTimer(ends) {
  let remaining = 'Promotion is expired!';
  if (!ends) { return remaining; }

  const difference = ends - +new Date();

  if (difference > 0) {
    const parts = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hr: Math.floor((difference / (1000 * 60 * 60)) % 24),
      min: Math.floor((difference / 1000 / 60) % 60),
      sec: Math.floor((difference / 1000) % 60),
    };

    function getParts(part) { return `${parts[part]} ${part}`; }
    remaining = Object.keys(parts).map(getParts).join(" ");
  }

  return remaining;
}

function generatePromotionContent(promotion) {
  const ends = promotion.ends;
  const content = promotion.content;
  const hasCountdown = promotion.hasCountdown;
  const countdownTextColour = promotion.countdownTextColour;

  if (!hasCountdown) { return promotion.content; }

  const combinerObject = document.createElement('div');
  combinerObject.innerHTML = promotion.content;
  const htmlContent = combinerObject.getElementsByClassName('__promotion_content')[0];

  const countdownContent = countdownTimer(new Date(ends));
  const styledCountdown = `<span style="color:${countdownTextColour};"> ${countdownContent}</span>`;
  htmlContent.innerHTML = htmlContent.innerHTML + styledCountdown;

  const contentWrapper = combinerObject.getElementsByClassName('__promotion_content_wrapper')[0];
  const promotionContent = `<div class="__promotion_content">${htmlContent.innerHTML}</div>`;
  const backgroundColour = contentWrapper.style.backgroundColor;
  return `<div
    class="__promotion_content_wrapper"
    style="background-color:${backgroundColour}"
  >
    ${promotionContent}
  </div>`;
}

function renderPromotionInContainer(promotion) {
  const bannerContainer = document.getElementsByClassName('__promotions_container')[0];

  const promotionHolder = document.createElement('span');
  promotionHolder.innerHTML = generatePromotionContent(promotion);
  promotionHolder.classList = '__shown __promotion';
  bannerContainer.innerHTML = '';
  bannerContainer.appendChild(promotionHolder);
}

let intervalTracker = 0;
let intervalID = null;
function turnOnCountdown(promotion) {
  intervalID = setInterval(function () {
    renderPromotionInContainer(promotion);

    if (++intervalTracker === 4) {
      window.clearInterval(intervalID);
      intervalTracker = 0;
    }
  }, 1000);
}

function removeNoShowPromotions(path, promotions) {
  if (!promotions || promotions.length === 0) { return []; }

  return promotions.filter(function (promotion) {
    return promotion.noShowPages.every(function (page) {
      return !path.includes(page);
    });
  });
}

let promotionsList = [];

window.onload = function() {
  var newStylesheet = document.createElement('style');
  newStylesheet.innerHTML = stylesheet;

  const params = serializeQuery(window.__upsell_panda);

  fetch(`https://www.upsellpanda.com/api/student_promotions?${params}`)
  .then((response) => {
    return response.json();
  }).then((data) => {
    promotionsList = removeNoShowPromotions(
      window.location.pathname,
      data.promotions
    );
    if (promotionsList.length === 0) { return; }

    document.body.appendChild(newStylesheet);

    const bannerContainer = document.createElement('div');
    bannerContainer.classList = '__promotions_container';
    const body = document.body;
    body.insertBefore(bannerContainer, body.firstChild);

    const currentPromotion = promotionsList[0];
    renderPromotionInContainer(currentPromotion);

    if (currentPromotion.hasCountdown) {
      turnOnCountdown(currentPromotion);
    }

    setTimeout(showNextPromo, 5000);
  });
}

let iterator = 0;
function showNextPromo() {
  if (promotionsList.length === iterator + 1) {
    iterator = 0;
  } else {
    iterator++;
  }

  const nextPromotion = promotionsList[iterator];
  renderPromotionInContainer(nextPromotion);

  if (nextPromotion.hasCountdown) {
    turnOnCountdown(nextPromotion);
  }

  setTimeout(showNextPromo, 5000);
}

function serializeQuery(obj, prefix) {
  var str = [],
    p;
  for (p in obj) {
    if (obj.hasOwnProperty(p)) {
      var k = prefix ? prefix + "[" + p + "]" : p,
        v = obj[p];
      str.push((v !== null && typeof v === "object") ?
        serializeQuery(v, k) :
        k + "=" + encodeURIComponent(v));
    }
  }
  return str.join("&");
}
