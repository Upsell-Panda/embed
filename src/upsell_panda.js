import stylesheet from './stylesheet.css';

function countdownTimer(ends) {
  let remaining = 'Promotion is expired!';
  if (!ends) { return remaining; }

  let difference = ends - +new Date();

  if (difference > 0) {
    let parts = {
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
  let ends = promotion.ends;
  let content = promotion.content;
  let hasCountdown = promotion.hasCountdown;
  let countdownTextColour = promotion.countdownTextColour;

  if (!hasCountdown) { return promotion.content; }

  let combinerObject = document.createElement('div');
  combinerObject.innerHTML = promotion.content;
  let htmlContent = combinerObject.getElementsByClassName('__promotion_content')[0];

  let countdownContent = countdownTimer(new Date(ends));
  let styledCountdown = `<span style="color:${countdownTextColour};"> ${countdownContent}</span>`;
  htmlContent.innerHTML = htmlContent.innerHTML + styledCountdown;

  let contentWrapper = combinerObject.getElementsByClassName('__promotion_content_wrapper')[0];
  let promotionContent = `<div class="__promotion_content">${htmlContent.innerHTML}</div>`;
  let backgroundColour = contentWrapper.style.backgroundColor;
  return `<div
    class="__promotion_content_wrapper"
    style="background-color:${backgroundColour}"
  >
    ${promotionContent}
  </div>`;
}

function renderPromotionInContainer(promotion, fadeIn) {
  let bannerContainer = document.getElementsByClassName('__promotions_container')[0];

  let promotionHolder = document.createElement('span');
  promotionHolder.innerHTML = generatePromotionContent(promotion);
  bannerContainer.classList = `__promotions_container ${fadeIn ? '__fade_in' : ''}`;
  bannerContainer.innerHTML = '';
  bannerContainer.appendChild(promotionHolder);
}

let intervalTracker = 0;
let intervalID = null;
function insertAndAnimatePromotion(promotion, fadeIn) {
  renderPromotionInContainer(promotion, fadeIn);

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
  let newStylesheet = document.createElement('style');
  newStylesheet.innerHTML = stylesheet;

  let params = serializeQuery(window.__upsell_panda);
  let appUrl = process.env.APP_URL;

  fetch(`https://${appUrl}/api/student_promotions?${params}`)
  .then((response) => {
    return response.json();
  }).then((data) => {
    promotionsList = removeNoShowPromotions(
      window.location.pathname,
      data.promotions
    );
    if (promotionsList.length === 0) { return; }

    document.body.appendChild(newStylesheet);

    let bannerContainer = document.createElement('div');
    bannerContainer.classList = '__promotions_container';
    let body = document.body;
    body.insertBefore(bannerContainer, body.firstChild);

    let currentPromotion = promotionsList[0];
    insertAndAnimatePromotion(currentPromotion, true);

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

  let nextPromotion = promotionsList[iterator];
  let fadeIn = promotionsList.length > 1;
  insertAndAnimatePromotion(nextPromotion, fadeIn);

  setTimeout(showNextPromo, 5000);
}

function serializeQuery(paramObject, prefix) {
  let params = Object.keys(paramObject).map(function(key) {
    let value = paramObject[key];

    if (value === null) return

    paramObject.constructor === Array ?
      key = prefix + "[]"
    :
      paramObject.constructor === Object && (key = prefix ? prefix + "[" + key + "]" : key);

    return "object" === typeof value ? serializeQuery(value, key) : key + "=" + encodeURIComponent(value)
  }).filter((identity) => identity);

  return [].concat.apply([], params).join("&")
}
