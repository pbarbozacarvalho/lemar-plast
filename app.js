const CONFIG = {
  storeName: "Le-mar Plast",
  whatsappNumber: "5491154154625",
  googleSheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTAOBoSFHI5csYQme05-kpxKWGnrQWH1flqoBm3fhqsHhEkaTIBYL6AjYPjck6rzWzrx4sErmot_JME/pub?gid=0&single=true&output=csv",
  currency: "ARS",
  locale: "es-AR",
};

const sampleProducts = [
  {
    id: "balde-10",
    nombre: "Balde plástico 10 L",
    categoria: "Hogar",
    descripcion: "Balde resistente para limpieza y uso general.",
    precio: 2500,
    stock: 12,
    imagen: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
    activo: "SI",
  },
  {
    id: "organizador",
    nombre: "Organizador multiuso",
    categoria: "Organización",
    descripcion: "Caja plástica apilable con tapa.",
    precio: 4200,
    stock: 7,
    imagen: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
    activo: "SI",
  },
  {
    id: "palangana",
    nombre: "Palangana reforzada",
    categoria: "Hogar",
    descripcion: "Disponible en colores surtidos.",
    precio: 3100,
    stock: 9,
    imagen: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=80",
    activo: "SI",
  },
  {
    id: "cajon-apilable",
    nombre: "Cajón apilable",
    categoria: "Organización",
    descripcion: "Cajón plástico para guardado y transporte.",
    precio: 5300,
    stock: 5,
    imagen: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=800&q=80",
    activo: "SI",
  },
  {
    id: "fuente-plastica",
    nombre: "Fuente plástica",
    categoria: "Cocina",
    descripcion: "Fuente liviana para cocina, mesa o preparación.",
    precio: 1800,
    stock: 18,
    imagen: "https://images.unsplash.com/photo-1584990347449-a62e1c0d023f?auto=format&fit=crop&w=800&q=80",
    activo: "SI",
  },
];

const state = {
  products: [],
  cart: new Map(),
  search: "",
  category: "",
  slide: 0,
};

const formatter = new Intl.NumberFormat(CONFIG.locale, {
  style: "currency",
  currency: CONFIG.currency,
  maximumFractionDigits: 0,
});

const elements = {
  storeName: document.querySelector("#storeName"),
  directWhatsapp: document.querySelector("#directWhatsapp"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  statusMessage: document.querySelector("#statusMessage"),
  productGrid: document.querySelector("#productGrid"),
  productTemplate: document.querySelector("#productTemplate"),
  carouselTrack: document.querySelector("#carouselTrack"),
  carouselDots: document.querySelector("#carouselDots"),
  prevSlide: document.querySelector("#prevSlide"),
  nextSlide: document.querySelector("#nextSlide"),
  cartItems: document.querySelector("#cartItems"),
  emptyCart: document.querySelector("#emptyCart"),
  cartTotal: document.querySelector("#cartTotal"),
  clearCart: document.querySelector("#clearCart"),
  customerName: document.querySelector("#customerName"),
  deliveryDetails: document.querySelector("#deliveryDetails"),
  sendOrder: document.querySelector("#sendOrder"),
};

init();

async function init() {
  elements.storeName.textContent = CONFIG.storeName;
  elements.directWhatsapp.href = whatsappUrl(`Hola, quiero consultar por las ofertas de ${CONFIG.storeName}.`);

  bindEvents();

  try {
    state.products = await loadProducts();
    state.products = state.products.filter((product) => isActive(product.activo));
    renderCategories();
    renderCarousel();
    renderProducts();
    renderCart();
  } catch (error) {
    elements.statusMessage.textContent = getLoadErrorMessage(error);
    elements.carouselTrack.innerHTML = `<div class="status">${getLoadErrorMessage(error)}</div>`;
    console.error(error);
  }
}

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderProducts();
  });

  elements.categoryFilter.addEventListener("change", (event) => {
    state.category = event.target.value;
    renderProducts();
  });

  elements.clearCart.addEventListener("click", () => {
    state.cart.clear();
    renderCart();
  });

  elements.prevSlide.addEventListener("click", () => moveSlide(-1));
  elements.nextSlide.addEventListener("click", () => moveSlide(1));
  elements.sendOrder.addEventListener("click", sendOrder);
}

async function loadProducts() {
  if (!CONFIG.googleSheetCsvUrl) {
    return sampleProducts;
  }

  if (window.location.protocol === "file:") {
    throw new Error("LOCAL_FILE_BLOCKED");
  }

  const response = await fetch(CONFIG.googleSheetCsvUrl);
  if (!response.ok) {
    throw new Error(`Error al leer Google Sheets: ${response.status}`);
  }

  const csv = await response.text();
  return csvToObjects(csv).map(normalizeProduct);
}

function getLoadErrorMessage(error) {
  if (error.message === "LOCAL_FILE_BLOCKED") {
    return "Para cargar productos desde Google Sheets, abrí la página desde GitHub Pages o desde un servidor local. El navegador bloquea esta lectura cuando el HTML se abre como archivo.";
  }

  return "No se pudieron cargar los productos desde Google Sheets. Revisá que la planilla siga publicada como CSV.";
}

function csvToObjects(csv) {
  const rows = parseCsv(csv).filter((row) => row.some(Boolean));
  const headers = rows.shift().map((header) => header.trim().toLowerCase());

  return rows.map((row) => {
    return headers.reduce((item, header, index) => {
      item[header] = row[index] || "";
      return item;
    }, {});
  });
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && insideQuotes && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function normalizeProduct(product) {
  return {
    id: product.id || slugify(product.nombre),
    nombre: product.nombre || "",
    categoria: product.categoria || "General",
    descripcion: product.descripcion || "",
    precio: Number(String(product.precio || "0").replace(",", ".")),
    stock: Number(product.stock || 0),
    imagen: product.imagen || "",
    activo: product.activo || "SI",
  };
}

function renderCategories() {
  const categories = [...new Set(state.products.map((product) => product.categoria).filter(Boolean))].sort();

  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.categoryFilter.append(option);
  }
}

function renderCarousel() {
  const featuredProducts = getFeaturedProducts();
  elements.carouselTrack.innerHTML = "";
  elements.carouselDots.innerHTML = "";

  if (!featuredProducts.length) {
    elements.carouselTrack.innerHTML = '<div class="status">No hay destacados disponibles.</div>';
    elements.prevSlide.disabled = true;
    elements.nextSlide.disabled = true;
    return;
  }

  state.slide = Math.min(state.slide, featuredProducts.length - 1);
  elements.prevSlide.disabled = featuredProducts.length <= 1;
  elements.nextSlide.disabled = featuredProducts.length <= 1;

  featuredProducts.forEach((product, index) => {
    const slide = document.createElement("article");
    slide.className = `carousel-slide${index === state.slide ? " active" : ""}`;
    slide.innerHTML = `
      <div class="carousel-image">
        <img src="${escapeHtml(product.imagen)}" alt="${escapeHtml(product.nombre)}">
      </div>
      <div class="carousel-body">
        <p class="product-category">${escapeHtml(product.categoria)}</p>
        <h3>${escapeHtml(product.nombre)}</h3>
        <p>${escapeHtml(product.descripcion)}</p>
        <strong class="carousel-price">${formatter.format(product.precio)}</strong>
        <button class="add-button" type="button">Agregar al pedido</button>
      </div>
    `;

    const image = slide.querySelector("img");
    image.onerror = () => {
      image.src = placeholderImage(product.nombre);
    };
    slide.querySelector("button").addEventListener("click", () => addToCart(product.id));
    elements.carouselTrack.append(slide);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = index === state.slide ? "active" : "";
    dot.setAttribute("aria-label", `Ver destacado ${index + 1}`);
    dot.addEventListener("click", () => {
      state.slide = index;
      renderCarousel();
    });
    elements.carouselDots.append(dot);
  });
}

function getFeaturedProducts() {
  return state.products.filter((product) => product.stock > 0).slice(0, 5);
}

function moveSlide(direction) {
  const featuredCount = getFeaturedProducts().length;
  if (featuredCount <= 1) {
    return;
  }

  state.slide = (state.slide + direction + featuredCount) % featuredCount;
  renderCarousel();
}

function renderProducts() {
  const products = getFilteredProducts();
  elements.productGrid.innerHTML = "";
  elements.statusMessage.textContent = products.length ? "" : "No hay productos para mostrar.";

  for (const product of products) {
    const node = elements.productTemplate.content.cloneNode(true);
    const image = node.querySelector(".product-image");
    const stockBadge = node.querySelector(".stock-badge");
    const addButton = node.querySelector(".add-button");

    image.src = product.imagen;
    image.alt = product.nombre;
    image.onerror = () => {
      image.src = placeholderImage(product.nombre);
    };

    node.querySelector(".product-category").textContent = product.categoria;
    node.querySelector(".product-name").textContent = product.nombre;
    node.querySelector(".product-description").textContent = product.descripcion;
    node.querySelector(".product-price").textContent = formatter.format(product.precio);

    stockBadge.textContent = product.stock > 0 ? `${product.stock} disp.` : "Sin stock";
    stockBadge.classList.toggle("out", product.stock <= 0);
    addButton.disabled = product.stock <= 0;
    addButton.addEventListener("click", () => addToCart(product.id));

    elements.productGrid.append(node);
  }
}

function getFilteredProducts() {
  return state.products.filter((product) => {
    const matchesSearch = [product.nombre, product.categoria, product.descripcion]
      .join(" ")
      .toLowerCase()
      .includes(state.search);
    const matchesCategory = !state.category || product.categoria === state.category;

    return matchesSearch && matchesCategory;
  });
}

function addToCart(productId) {
  const product = findProduct(productId);
  const current = state.cart.get(productId) || 0;

  if (!product || current >= product.stock) {
    return;
  }

  state.cart.set(productId, current + 1);
  renderCart();
}

function renderCart() {
  elements.cartItems.innerHTML = "";
  const entries = [...state.cart.entries()];
  const total = entries.reduce((sum, [productId, quantity]) => {
    const product = findProduct(productId);
    return sum + product.precio * quantity;
  }, 0);

  elements.emptyCart.hidden = entries.length > 0;
  elements.cartTotal.textContent = formatter.format(total);
  elements.sendOrder.disabled = entries.length === 0;
  elements.clearCart.disabled = entries.length === 0;

  for (const [productId, quantity] of entries) {
    const product = findProduct(productId);
    const line = document.createElement("div");
    line.className = "cart-line";
    line.innerHTML = `
      <div>
        <strong>${escapeHtml(product.nombre)}</strong>
        <span>${formatter.format(product.precio)} c/u</span>
      </div>
      <div class="quantity-controls">
        <button type="button" aria-label="Quitar">-</button>
        <span>${quantity}</span>
        <button type="button" aria-label="Agregar">+</button>
      </div>
    `;

    const [removeButton, addButton] = line.querySelectorAll("button");
    removeButton.addEventListener("click", () => updateQuantity(productId, quantity - 1));
    addButton.addEventListener("click", () => updateQuantity(productId, quantity + 1));
    addButton.disabled = quantity >= product.stock;

    elements.cartItems.append(line);
  }
}

function updateQuantity(productId, quantity) {
  const product = findProduct(productId);

  if (quantity <= 0) {
    state.cart.delete(productId);
  } else {
    state.cart.set(productId, Math.min(quantity, product.stock));
  }

  renderCart();
}

function sendOrder() {
  const entries = [...state.cart.entries()];
  if (!entries.length) {
    return;
  }

  const lines = entries.map(([productId, quantity]) => {
    const product = findProduct(productId);
    return `- ${quantity} x ${product.nombre} - ${formatter.format(product.precio)} c/u`;
  });
  const total = entries.reduce((sum, [productId, quantity]) => {
    const product = findProduct(productId);
    return sum + product.precio * quantity;
  }, 0);
  const name = elements.customerName.value.trim();
  const delivery = elements.deliveryDetails.value.trim();
  const message = [
    `Hola, quiero hacer este pedido en ${CONFIG.storeName}:`,
    "",
    ...lines,
    "",
    `Total estimado: ${formatter.format(total)}`,
    name ? `Nombre: ${name}` : "Nombre:",
    delivery ? `Entrega: ${delivery}` : "Entrega:",
  ].join("\n");

  window.open(whatsappUrl(message), "_blank", "noopener");
}

function findProduct(productId) {
  return state.products.find((product) => product.id === productId);
}

function isActive(value) {
  return !["NO", "FALSE", "0"].includes(String(value).trim().toUpperCase());
}

function whatsappUrl(message) {
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function placeholderImage(text) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#e7ece1"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#687061" font-family="Arial" font-size="34">${escapeHtml(text)}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
