// ===== Firebase Modular SDK Imports =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// ===== Firebase Configuration =====
const firebaseConfig = {
  apiKey: "AIzaSyA4XAze8F0Bl0amwjhqBU0fqzsvdKlUuv8",
  authDomain: "shiping-92aba.firebaseapp.com",
  projectId: "shiping-92aba",
  storageBucket: "shiping-92aba.firebasestorage.app",
  messagingSenderId: "582321037266",
  appId: "1:582321037266:web:d8f0e492687f319027f20b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== State =====
let currentTrackingData = null;
let currentTrackingId = null;

// ===== Auth Guard =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    const displayName = user.displayName || 'User';
    document.getElementById('userName').textContent = displayName;
    document.getElementById('userAvatar').src = user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName) + '&background=0052CC&color=fff';

    // Set welcome greeting with time-based message
    const hour = new Date().getHours();
    let timeGreeting = 'Good Evening';
    if (hour < 12) timeGreeting = 'Good Morning';
    else if (hour < 17) timeGreeting = 'Good Afternoon';

    const firstName = displayName.split(' ')[0];
    document.getElementById('welcomeGreeting').textContent = `👋 ${timeGreeting}, ${firstName}!`;
  } else {
    window.location.href = 'index.html';
  }
});

// ===== Logout =====
document.getElementById('logoutBtn').addEventListener('click', () => {
  signOut(auth).then(() => {
    window.location.href = 'index.html';
  });
});

// ===== DOM Elements =====
const trackingInput = document.getElementById('trackingInput');
const searchBtn = document.getElementById('searchBtn');
const loader = document.getElementById('loader');
const resultContainer = document.getElementById('resultContainer');

// ===== Search Handler =====
searchBtn.addEventListener('click', handleSearch);
trackingInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});



async function handleSearch() {
  const id = trackingInput.value.trim().toUpperCase();
  if (!id) {
    showToast('Please enter a Tracking ID');
    trackingInput.focus();
    return;
  }

  resultContainer.innerHTML = '';
  loader.classList.add('active');

  try {
    // Fetch from Firestore collection "tracking", document ID = Tracking ID
    const docRef = doc(db, "tracking", id);
    const docSnap = await getDoc(docRef);

    loader.classList.remove('active');

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Ensure trackingId field is present (use doc ID as fallback)
      data.trackingId = data.trackingId || id;
      currentTrackingData = data;
      currentTrackingId = id;
      renderTrackingCard(data);
    } else {
      renderError(id);
    }
  } catch (error) {
    loader.classList.remove('active');
    console.error('Firestore fetch error:', error);
    renderError(id);
    showToast('Error fetching data. Please try again.');
  }
}

// ===== Helper: safe value =====
function val(v, fallback = 'N/A') {
  return v || fallback;
}

// ===== Render Tracking Card =====
function renderTrackingCard(data) {
  // Derive statusClass from status if not provided
  const statusClass = data.statusClass || data.status.toLowerCase().replace(/\s+/g, '-');

  // Build timeline from history array
  const history = data.history || [];
  const timelineHTML = history.map((step) => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-item-content">
        <div class="timeline-event"><i class="fas ${step.icon || 'fa-circle'}" style="color:var(--primary);margin-right:6px;"></i>${step.event}</div>
        <div class="timeline-meta">
          <i class="fas fa-map-pin"></i> ${step.location}
          <span style="margin-left:auto;"><i class="fas fa-clock"></i> ${step.date}</span>
        </div>
      </div>
    </div>
  `).join('');

  // Format address — support both newline chars and literal \n from Firestore
  const formattedAddress = (data.address || '').replace(/\\n|\n/g, '<br>');

  // Payment badge class
  const paymentClass = (data.paymentMethod || '').toLowerCase() === 'cod' ? 'cod' : 'prepaid';

  // Product image fallback
  const productImg = data.productImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(val(data.productName, 'P')) + '&background=EBF4FF&color=0052CC&size=128&font-size=0.4';

  // Journey progress
  const progress = Math.min(100, Math.max(0, Number(data.progressPercent) || 0));
  const originCity = val(data.originCity, 'Origin');
  const destinationCity = val(data.destinationCity, 'Destination');

  resultContainer.innerHTML = `
    <div class="tracking-card">
      <!-- Header -->
      <div class="tracking-header">
        <div>
          <div class="tracking-id-label">Tracking ID</div>
          <div class="tracking-id-value">${data.trackingId}</div>
        </div>
        <div class="status-badge ${statusClass}">
          <span class="status-dot"></span>
          ${data.status}
        </div>
      </div>

      <!-- Animated Journey Tracker -->
      <div class="tracking-section journey-section">
        <div class="section-title" style="margin-bottom:18px;"><i class="fas fa-route icon-teal"></i> Package Journey</div>
        <div class="journey-tracker">
          <div class="journey-cities">
            <div class="journey-city origin">
              <i class="fas fa-warehouse"></i>
              <span>${originCity}</span>
            </div>
            <div class="journey-city destination">
              <i class="fas fa-flag-checkered"></i>
              <span>${destinationCity}</span>
            </div>
          </div>
          <div class="journey-track">
            <div class="journey-track-bg"></div>
            <div class="journey-track-fill" style="width:${progress}%"></div>
            <div class="journey-truck" style="left:${progress}%">
              <div class="journey-truck-icon">
                <i class="fas fa-truck-fast"></i>
              </div>
              <div class="journey-truck-pulse"></div>
            </div>
            <div class="journey-dot start"></div>
            <div class="journey-dot end"></div>
          </div>
          <div class="journey-percent">${progress}% Complete</div>
        </div>
      </div>

      <!-- Product Information -->
      <div class="tracking-section">
        <div class="section-header">
          <div class="section-title"><i class="fas fa-cube icon-blue"></i> Product Information</div>
        </div>
        <div class="product-hero">
          <img class="product-thumb" src="${productImg}" alt="${val(data.productName, 'Product')}" onerror="this.src='https://ui-avatars.com/api/?name=P&background=EBF4FF&color=0052CC&size=128'">
          <div class="product-meta">
            <div class="product-name">${val(data.productName, 'Product Name Not Set')}</div>
            ${data.productCategory ? `<div class="product-category-badge"><i class="fas fa-tag"></i> ${data.productCategory}</div>` : ''}
            <div class="product-qty">Quantity: <strong>${val(data.quantity, 1)}</strong></div>
          </div>
        </div>
      </div>

      <!-- Package Details & Payment -->
      <div class="tracking-section">
        <div class="detail-grid">
          <!-- Package Details -->
          <div>
            <div class="section-title" style="margin-bottom:14px;"><i class="fas fa-weight-hanging icon-purple"></i> Package Details</div>
            <div class="detail-card" style="margin-bottom:10px;">
              <div class="detail-card-label">Weight</div>
              <div class="detail-card-value"><i class="fas fa-balance-scale"></i> ${val(data.weight)}</div>
            </div>
            <div class="detail-card">
              <div class="detail-card-label">Dimensions</div>
              <div class="detail-card-value"><i class="fas fa-ruler-combined"></i> ${val(data.dimensions)}</div>
            </div>
          </div>
          <!-- Payment Info -->
          <div>
            <div class="section-title" style="margin-bottom:14px;"><i class="fas fa-credit-card icon-amber"></i> Payment Info</div>
            <div class="detail-card" style="margin-bottom:10px;">
              <div class="detail-card-label">Payment Method</div>
              <div class="detail-card-value">
                <span class="payment-badge ${paymentClass}"><i class="fas ${paymentClass === 'cod' ? 'fa-money-bill-wave' : 'fa-check-circle'}"></i> ${val(data.paymentMethod, 'Prepaid')}</span>
              </div>
            </div>
            <div class="detail-card" style="margin-bottom:10px;">
              <div class="detail-card-label">Order Value</div>
              <div class="detail-card-value"><i class="fas fa-indian-rupee-sign"></i> ${val(data.orderValue)}</div>
            </div>
            <div class="detail-card">
              <div class="detail-card-label">Courier Partner</div>
              <div class="detail-card-value"><i class="fas fa-truck-fast"></i> ${val(data.courierPartner, 'EcomExpress')}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sender & Receiver -->
      <div class="tracking-section">
        <div class="section-title" style="margin-bottom:16px;"><i class="fas fa-user-group icon-green"></i> Sender & Receiver</div>
        <div class="detail-grid">
          <div class="detail-card">
            <div class="detail-card-label">Sender</div>
            <div class="detail-card-value" style="margin-bottom:4px;"><i class="fas fa-building"></i> ${val(data.senderName)}</div>
            <div class="detail-card-value" style="font-size:13px;color:var(--text-muted);"><i class="fas fa-location-dot"></i> ${val(data.senderCity)}</div>
          </div>
          <div class="detail-card">
            <div class="detail-card-label">Receiver</div>
            <div class="detail-card-value" style="margin-bottom:4px;"><i class="fas fa-user"></i> ${val(data.receiverName)}</div>
            <div class="detail-card-value" style="font-size:13px;color:var(--text-muted);"><i class="fas fa-phone"></i> ${val(data.receiverPhone)}</div>
          </div>
        </div>
      </div>

      <!-- Shipment Details -->
      <div class="tracking-section">
        <div class="section-title" style="margin-bottom:16px;"><i class="fas fa-map-location-dot icon-teal"></i> Shipment Details</div>
        <div class="detail-grid-3">
          <div class="detail-card">
            <div class="detail-card-label">Current Location</div>
            <div class="detail-card-value"><i class="fas fa-map-marker-alt"></i> ${val(data.location)}</div>
          </div>
          <div class="detail-card">
            <div class="detail-card-label">Estimated Delivery</div>
            <div class="detail-card-value"><i class="fas fa-calendar-alt"></i> ${val(data.deliveryDate)}</div>
          </div>
          <div class="detail-card">
            <div class="detail-card-label">Delivery Address</div>
            <div class="detail-card-value"><i class="fas fa-home"></i> ${formattedAddress || 'N/A'}</div>
          </div>
        </div>
      </div>

      <!-- Shipment Timeline -->
      <div class="tracking-section">
        <h3 class="timeline-title"><i class="fas fa-route"></i> Shipment Timeline</h3>
        <div class="timeline">
          ${timelineHTML || '<p style="color:var(--text-muted);font-size:14px;">No timeline data available.</p>'}
        </div>
      </div>
    </div>
  `;

  resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== Render Error =====
function renderError(id) {
  resultContainer.innerHTML = `
    <div class="error-card">
      <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
      <h3>Invalid Tracking ID</h3>
      <p>No shipment found for "<strong>${id}</strong>". Please check the ID and try again.</p>
    </div>
  `;
}

// ===== Toast =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
