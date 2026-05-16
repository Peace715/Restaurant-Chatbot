import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const API_BASE = "http://localhost:5000";
const socket = io(API_BASE);
const MENU_CATEGORIES = [
  { id: "all", label: "All menu" },
  { id: "foods", label: "Foods" },
  { id: "drinks", label: "Drinks" },
  { id: "smoothies", label: "Smoothies" },
  { id: "parfait", label: "Parfait" },
];

function formatCurrency(value) {
  return `NGN ${Number(value || 0).toLocaleString()}`;
}

function makeDeviceId() {
  return localStorage.getItem("deviceId") || Math.random().toString(36).substring(2, 10);
}

export default function ChatUI() {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [menu, setMenu] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const chatEndRef = useRef(null);

  const [deviceId] = useState(makeDeviceId);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const filteredMenu = useMemo(() => {
    if (activeCategory === "all") {
      return menu;
    }

    return menu.filter((item) => item.category === activeCategory);
  }, [activeCategory, menu]);

  const addMessage = useCallback((sender, text) => {
    setMessages((prev) => [...prev, { sender, text, time: new Date() }]);
  }, []);

  const fetchMenu = useCallback(async () => {
    try {
      setIsMenuLoading(true);
      const res = await fetch(`${API_BASE}/api/menu`);
      const data = await res.json();
      const menuWithFullImageUrls = data.map(item => ({
        ...item,
        image: item.image.startsWith('http') ? item.image : `${API_BASE}${item.image}`
      }));
      setMenu(menuWithFullImageUrls);
    } catch (err) {
      addMessage("bot", "I could not load the menu. Check the server and try again.");
    } finally {
      setIsMenuLoading(false);
    }
  }, [addMessage]);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cart/${deviceId}`);
      const data = await res.json();
      setCart(data.items || []);
      setCartTotal(data.total || 0);
    } catch (err) {
      addMessage("bot", "I could not refresh your cart right now.");
    }
  }, [addMessage, deviceId]);

  const clearCart = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cart/${deviceId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      setCart(data.items || []);
      setCartTotal(data.total || 0);
    } catch (err) {
      addMessage("bot", "I could not clear the cart.");
    }
  }, [addMessage, deviceId]);

  const verifyPayment = useCallback(
    async (reference) => {
      try {
        const res = await fetch(`${API_BASE}/api/payment/verify/${reference}`);
        const data = await res.json();

        if (data.status === "success") {
          setPaymentStatus("success");
          await clearCart();
        } else {
          setPaymentStatus("failed");
        }
      } catch (err) {
        setPaymentStatus("failed");
      }
    },
    [clearCart]
  );

  useEffect(() => {
    localStorage.setItem("deviceId", deviceId);
    fetchMenu();
    fetchCart();

    const reference = new URLSearchParams(window.location.search).get("reference");

    if (reference) {
      verifyPayment(reference);
    }

    if (!sessionStorage.getItem("welcomeShown")) {
      addMessage("bot", "Welcome back. Pick a meal below or type 1 to order.");
      sessionStorage.setItem("welcomeShown", "true");
    }

    socket.on("botReply", (msg) => {
      addMessage("bot", msg);
    });

    return () => socket.off("botReply");
  }, [addMessage, deviceId, fetchCart, fetchMenu, verifyPayment]);

  useEffect(() => {
    if (typeof chatEndRef.current?.scrollIntoView === "function") {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function sendMessage(msg = input) {
    const trimmedMessage = msg.trim();

    if (!trimmedMessage) {
      return;
    }

    addMessage("user", trimmedMessage);
    socket.emit("chatMessage", { message: trimmedMessage, deviceId });
    setInput("");
  }

  async function addSelectedItem() {
    if (!selectedItem) {
      return;
    }

    try {
      setIsAddingItem(true);
      const res = await fetch(`${API_BASE}/api/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          itemId: selectedItem._id,
          quantity,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not add item");
      }

      setCart(data.items || []);
      setCartTotal(data.total || 0);
      addMessage(
        "bot",
        `${selectedItem.name} x${quantity} added. Your total is ${formatCurrency(data.total)}.`
      );
      setSelectedItem(null);
      setQuantity(1);
    } catch (err) {
      addMessage("bot", err.message);
    } finally {
      setIsAddingItem(false);
    }
  }

  async function handleCheckout() {
    if (!cart.length) {
      addMessage("bot", "Your cart is empty. Add a meal first.");
      return;
    }

    try {
      setIsCheckingOut(true);
      const res = await fetch(`${API_BASE}/api/payment/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
      const data = await res.json();

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      throw new Error(data.error || "Payment could not start");
    } catch (err) {
      addMessage("bot", err.message);
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Fresh table service</p>
          <h1>Restaurant ChatBot</h1>
        </div>
        <button className="cart-button" type="button" onClick={() => sendMessage("97")}>
          Cart <span>{cartCount}</span>
        </button>
      </header>

      {paymentStatus && (
        <div className={`payment-banner ${paymentStatus}`}>
          {paymentStatus === "success"
            ? "Payment successful. Your order is being prepared."
            : "Payment failed. Please try again."}
        </div>
      )}

      <section className="hero-panel">
        <div>
          <p className="eyebrow">Order in minutes</p>
          <h2>Food, drinks, smoothies, and parfaits in one clean menu.</h2>
          <p>
            Browse by category, add items to your cart, then continue through chat or
            checkout directly.
          </p>
        </div>
        <div className="hero-card" aria-label="Order summary preview">
          <span>Current order</span>
          <strong>{formatCurrency(cartTotal)}</strong>
          <small>{cartCount} item{cartCount === 1 ? "" : "s"} selected</small>
        </div>
      </section>

      <div className="ordering-layout">
        <section className="menu-panel" aria-labelledby="menu-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Explore menu</p>
              <h2 id="menu-heading">Choose your cravings</h2>
            </div>
            <button type="button" onClick={() => sendMessage("1")}>
              Chat order
            </button>
          </div>

          <div className="category-tabs" aria-label="Menu categories">
            {MENU_CATEGORIES.map((category) => (
              <button
                className={`category-tab ${activeCategory === category.id ? "active" : ""}`}
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="menu-grid">
            {isMenuLoading &&
              [1, 2, 3, 4, 5, 6].map((item) => (
                <div className="menu-card skeleton" key={item} />
              ))}

            {!isMenuLoading &&
              filteredMenu.map((item) => (
                <button
                  className={`menu-card ${selectedItem?._id === item._id ? "selected" : ""}`}
                  key={item._id}
                  type="button"
                  onClick={() => {
                    setSelectedItem(item);
                    setQuantity(1);
                  }}
                >
                  <img src={item.image} alt={item.name} className="food-image" />
                  <span className="food-copy">
                    <small>{item.category || "foods"}</small>
                    <strong>{item.name}</strong>
                    {item.description && <p>{item.description}</p>}
                    <b>{formatCurrency(item.price)}</b>
                  </span>
                  <span className="add-mark" aria-hidden="true">
                    +
                  </span>
                </button>
              ))}
          </div>
        </section>

        <aside className="side-panel">
          <section className="cart-panel" aria-label="Cart summary">
            <div className="section-heading compact">
              <h2>Your cart</h2>
              {cart.length > 0 && (
                <button type="button" onClick={clearCart}>
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <p className="empty-cart">Tap any menu item to start building your order.</p>
            ) : (
              <div className="cart-list">
                {cart.map((item, index) => (
                  <div className="cart-row" key={`${item.itemName}-${index}`}>
                    <span>
                      {item.itemName} <small>x{item.quantity}</small>
                    </span>
                    <strong>{formatCurrency(item.price)}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="cart-total">
              <span>Total</span>
              <strong>{formatCurrency(cartTotal)}</strong>
            </div>
            <button
              className="primary-button wide"
              type="button"
              onClick={handleCheckout}
              disabled={isCheckingOut || cart.length === 0}
            >
              {isCheckingOut ? "Opening payment..." : "Pay now"}
            </button>
          </section>

          <section className="chat-panel" aria-label="Chat conversation">
            <div className="section-heading compact">
              <h2>Assistant</h2>
            </div>
            <div className="chat-stream">
              {messages.map((msg, index) => (
                <div
                  className={`message-row ${msg.sender === "user" ? "from-user" : "from-bot"}`}
                  key={`${msg.time.toISOString()}-${index}`}
                >
                  <div className="message-bubble">
                    <p>{msg.text}</p>
                    <span>
                      {msg.time.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="quick-actions">
              <button type="button" onClick={() => sendMessage("1")}>
                Order
              </button>
              <button type="button" onClick={() => sendMessage("97")}>
                Cart
              </button>
              <button type="button" onClick={() => sendMessage("99")}>
                Checkout
              </button>
            </div>

            <form
              className="composer"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type a message..."
                aria-label="Message"
              />
              <button type="submit" aria-label="Send message">
                Send
              </button>
            </form>
          </section>
        </aside>
      </div>

      {selectedItem && (
        <div className="selection-backdrop" role="presentation" onClick={() => setSelectedItem(null)}>
          <div
            className="selection-sheet"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={selectedItem.image} alt={selectedItem.name} className="sheet-image" />
            <div className="sheet-body">
              <div className="sheet-header">
                <div>
                  <span>Adding</span>
                  <h2>{selectedItem.name}</h2>
                </div>
                <strong>{formatCurrency(selectedItem.price * quantity)}</strong>
              </div>

              <p>{selectedItem.description}</p>

              <div className="quantity-control">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => value + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <div className="sheet-actions">
                <button className="ghost-button" type="button" onClick={() => setSelectedItem(null)}>
                  Cancel
                </button>
                <button
                  className="primary-button wide"
                  type="button"
                  onClick={addSelectedItem}
                  disabled={isAddingItem}
                >
                  {isAddingItem ? "Adding..." : "Add to cart"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
