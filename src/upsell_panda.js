import stylesheet from './stylesheet.css';

function countdownTimer(ends) {
  let remaining = 'Promotion is expired!';
  if (!ends) { return remaining; }

  var difference = ends - +new Date();

  if (difference > 0) {
    var parts = {
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
  var ends = promotion.ends;
  var content = promotion.content;
  var hasCountdown = promotion.hasCountdown;
  var countdownTextColour = promotion.countdownTextColour;

  if (!hasCountdown) { return promotion.content; }

  var combinerObject = document.createElement('div');
  combinerObject.innerHTML = promotion.content;
  var htmlContent = combinerObject.getElementsByClassName('__promotion_content')[0];

  var countdownContent = countdownTimer(new Date(ends));
  var styledCountdown = `<span style="color:${countdownTextColour};"> ${countdownContent}</span>`;
  htmlContent.innerHTML = htmlContent.innerHTML + styledCountdown;

  var contentWrapper = combinerObject.getElementsByClassName('__promotion_content_wrapper')[0];
  var promotionContent = `<div class="__promotion_content">${htmlContent.innerHTML}</div>`;
  var backgroundColour = contentWrapper.style.backgroundColor;
  return `<div
    class="__promotion_content_wrapper"
    style="background-color:${backgroundColour}"
  >
    ${promotionContent}
  </div>`;
}

function renderPromotionInContainer(promotion, fadeIn) {
  var bannerContainer = document.getElementsByClassName('__promotions_container')[0];

  var promotionHolder = document.createElement('span');
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
  var newStylesheet = document.createElement('style');
  newStylesheet.innerHTML = stylesheet;

  var params = serializeQuery(window.__upsell_panda);
  var appUrl = process.env.APP_URL;

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

    var bannerContainer = document.createElement('div');
    bannerContainer.classList = '__promotions_container';
    var body = document.body;
    body.insertBefore(bannerContainer, body.firstChild);

    var currentPromotion = promotionsList[0];
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

  var nextPromotion = promotionsList[iterator];
  var fadeIn = promotionsList.length > 1;
  insertAndAnimatePromotion(nextPromotion, fadeIn);

  setTimeout(showNextPromo, 5000);
}

function serializeQuery(obj, prefix) {
  var str = [],
    p;
  for (p in obj) {
    if (obj.hasOwnProperty(p)) {
      if (obj[p] === null || obj[p].length === 0) continue

      var k = prefix ? prefix + "[" + p + "]" : p,
        v = obj[p];
      str.push((v !== null && typeof v === "object") ?
        serializeQuery(v, k) :
        k + "=" + encodeURIComponent(v));
    }
  }
  return str.join("&");
}
