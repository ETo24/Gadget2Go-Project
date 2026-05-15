// Mock data for Gadget2Go (G2G) — used across the app.

export const CATEGORIES = [
  { id: 'phones', name: 'Phones', icon: 'Smartphone', count: 1240 },
  { id: 'tablets', name: 'Tablets', icon: 'Tablet', count: 320 },
  { id: 'laptops', name: 'Laptops', icon: 'Laptop', count: 580 },
  { id: 'consoles', name: 'Consoles', icon: 'Gamepad2', count: 210 },
  { id: 'smartwatches', name: 'Smartwatches', icon: 'Watch', count: 410 },
  { id: 'accessories', name: 'Accessories', icon: 'Headphones', count: 920 },
];

export const CONDITION_GRADES = [
  { id: 'A', label: 'Like New', color: 'emerald', desc: 'Minimal wear, looks new.' },
  { id: 'B', label: 'Excellent', color: 'teal', desc: 'Minor scratches only.' },
  { id: 'C', label: 'Good', color: 'amber', desc: 'Visible wear, fully functional.' },
  { id: 'D', label: 'Fair', color: 'orange', desc: 'Heavy wear, all features work.' },
];

const IMG = {
  iphone15: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80',
  iphone14: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=900&q=80',
  samsung: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=900&q=80',
  pixel: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80',
  macbook: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
  macbookAir: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=900&q=80',
  dell: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=900&q=80',
  ipad: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=900&q=80',
  ipadPro: 'https://images.unsplash.com/photo-1585789575094-3c4d9f1f8f6c?auto=format&fit=crop&w=900&q=80',
  ps5: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80',
  xbox: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=900&q=80',
  watch: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80',
  airpods: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=900&q=80',
  galaxyWatch: 'https://images.unsplash.com/photo-1617043786394-f977fa12eddf?auto=format&fit=crop&w=900&q=80',
};

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
];

export const PRODUCTS = [
  {
    id: 'p1', title: 'iPhone 15 Pro 256GB — Natural Titanium', category: 'phones',
    brand: 'Apple', model: 'iPhone 15 Pro', storage: '256GB', ram: '8GB',
    price: 999, aiFair: 1050, condition: 'A', batteryHealth: 96, warranty: 'Apple Care+ until 2026',
    images: [IMG.iphone15, IMG.iphone14, IMG.samsung],
    seller: { id: 'u1', name: 'Aria Tan', avatar: AVATARS[0], rating: 4.9, verified: true, deals: 38 },
    location: 'Singapore', postedDays: 2, views: 432, saved: 28, demandScore: 92,
    description: 'Mint condition iPhone 15 Pro, used for 6 months. Comes with original box, cable, and Apple Care+. No scratches, screen perfect.',
    verifiedBadge: true,
  },
  {
    id: 'p2', title: 'MacBook Pro 14" M3 Pro 18GB / 512GB', category: 'laptops',
    brand: 'Apple', model: 'MacBook Pro 14', storage: '512GB', ram: '18GB',
    price: 1850, aiFair: 1920, condition: 'A', batteryHealth: 98, warranty: '6 months left',
    images: [IMG.macbook, IMG.macbookAir, IMG.dell],
    seller: { id: 'u2', name: 'Daniel Lim', avatar: AVATARS[1], rating: 4.8, verified: true, deals: 22 },
    location: 'Kuala Lumpur', postedDays: 1, views: 287, saved: 19, demandScore: 88,
    description: 'M3 Pro chip, Space Black. Light usage for design work. Battery cycles: 84. Includes original charger.',
    verifiedBadge: true,
  },
  {
    id: 'p3', title: 'Samsung Galaxy S24 Ultra 512GB', category: 'phones',
    brand: 'Samsung', model: 'Galaxy S24 Ultra', storage: '512GB', ram: '12GB',
    price: 1100, aiFair: 1080, condition: 'B', batteryHealth: 93, warranty: 'No',
    images: [IMG.samsung, IMG.pixel, IMG.iphone15],
    seller: { id: 'u3', name: 'Maya R.', avatar: AVATARS[2], rating: 4.7, verified: true, deals: 14 },
    location: 'Jakarta', postedDays: 5, views: 198, saved: 12, demandScore: 80,
    description: 'Titanium Gray, includes S Pen and original box. Tiny scuff on bottom edge.',
    verifiedBadge: true,
  },
  {
    id: 'p4', title: 'iPad Pro 11" M2 256GB Wi-Fi', category: 'tablets',
    brand: 'Apple', model: 'iPad Pro 11 M2', storage: '256GB', ram: '8GB',
    price: 720, aiFair: 760, condition: 'A', batteryHealth: 97, warranty: 'No',
    images: [IMG.ipadPro, IMG.ipad, IMG.macbook],
    seller: { id: 'u4', name: 'Kenji Y.', avatar: AVATARS[3], rating: 5.0, verified: true, deals: 47 },
    location: 'Singapore', postedDays: 3, views: 312, saved: 24, demandScore: 85,
    description: 'Space Gray. Used mostly for note-taking. Apple Pencil 2 included.',
    verifiedBadge: true,
  },
  {
    id: 'p5', title: 'PlayStation 5 Slim Disc Edition', category: 'consoles',
    brand: 'Sony', model: 'PS5 Slim', storage: '1TB', ram: '16GB',
    price: 540, aiFair: 560, condition: 'B', batteryHealth: null, warranty: '8 months left',
    images: [IMG.ps5, IMG.xbox, IMG.ps5],
    seller: { id: 'u5', name: 'Rio P.', avatar: AVATARS[4], rating: 4.6, verified: false, deals: 8 },
    location: 'Bali', postedDays: 7, views: 156, saved: 9, demandScore: 76,
    description: 'Comes with 2 controllers and 3 games. Lightly used.',
    verifiedBadge: false,
  },
  {
    id: 'p6', title: 'Apple Watch Series 9 45mm Cellular', category: 'smartwatches',
    brand: 'Apple', model: 'Watch Series 9', storage: '64GB', ram: '1GB',
    price: 380, aiFair: 395, condition: 'A', batteryHealth: 95, warranty: 'Apple Care',
    images: [IMG.watch, IMG.galaxyWatch, IMG.airpods],
    seller: { id: 'u1', name: 'Aria Tan', avatar: AVATARS[0], rating: 4.9, verified: true, deals: 38 },
    location: 'Singapore', postedDays: 1, views: 121, saved: 8, demandScore: 82,
    description: 'Midnight aluminum, sport loop. Practically new.',
    verifiedBadge: true,
  },
  {
    id: 'p7', title: 'AirPods Pro (2nd Gen) USB-C', category: 'accessories',
    brand: 'Apple', model: 'AirPods Pro 2', storage: null, ram: null,
    price: 165, aiFair: 175, condition: 'A', batteryHealth: 94, warranty: 'No',
    images: [IMG.airpods, IMG.watch, IMG.airpods],
    seller: { id: 'u6', name: 'Lina W.', avatar: AVATARS[5], rating: 4.8, verified: true, deals: 16 },
    location: 'Manila', postedDays: 2, views: 89, saved: 5, demandScore: 78,
    description: 'USB-C version, full set. Tips never used.',
    verifiedBadge: true,
  },
  {
    id: 'p8', title: 'Google Pixel 8 Pro 256GB Obsidian', category: 'phones',
    brand: 'Google', model: 'Pixel 8 Pro', storage: '256GB', ram: '12GB',
    price: 680, aiFair: 720, condition: 'B', batteryHealth: 91, warranty: 'No',
    images: [IMG.pixel, IMG.samsung, IMG.iphone15],
    seller: { id: 'u2', name: 'Daniel Lim', avatar: AVATARS[1], rating: 4.8, verified: true, deals: 22 },
    location: 'Penang', postedDays: 4, views: 142, saved: 11, demandScore: 73,
    description: 'Daily driver for 1 year. Light scratches on back, screen flawless.',
    verifiedBadge: true,
  },
];

export const TRENDING_IDS = ['p1', 'p2', 'p4', 'p6'];
export const FLASH_DEAL_IDS = ['p5', 'p7'];

export const TESTIMONIALS = [
  { id: 't1', name: 'Aria Tan', role: 'Verified Seller', text: 'Sold my iPhone in 2 hours with AI valuation — got 12% above expected!', avatar: AVATARS[0], rating: 5 },
  { id: 't2', name: 'Daniel Lim', role: 'Buyer', text: 'The condition report and verification gave me confidence to buy a $1.8k laptop online.', avatar: AVATARS[1], rating: 5 },
  { id: 't3', name: 'Maya R.', role: 'Dealer', text: 'G2G\'s smart matching has been a game-changer for our store\'s sourcing.', avatar: AVATARS[2], rating: 5 },
];

export const TRUST_STATS = [
  { label: 'Verified Users', value: 124000, suffix: '+' },
  { label: 'Devices Sold', value: 89000, suffix: '+' },
  { label: 'AI Valuations', value: 412000, suffix: '+' },
  { label: 'Trust Score', value: 4.9, suffix: '/5' },
];

export const CONVERSATIONS = [
  {
    id: 'c1', userId: 'u1', name: 'Aria Tan', avatar: AVATARS[0], productId: 'p1',
    lastMessage: 'Sure, I can do $980 if you can collect today.', time: '2m',
    unread: 2, online: true,
    messages: [
      { id: 'm1', from: 'them', text: 'Hi! Is the iPhone still available?', time: '10:12' },
      { id: 'm2', from: 'me', text: 'Yes! Condition is mint. Battery 96%.', time: '10:13' },
      { id: 'm3', from: 'them', text: 'Would you accept $980?', time: '10:15' },
      { id: 'm4', from: 'me', text: 'Let me check the AI valuation real quick.', time: '10:16' },
      { id: 'm5', from: 'them', text: 'Sure, I can do $980 if you can collect today.', time: '10:18' },
    ],
  },
  {
    id: 'c2', userId: 'u2', name: 'Daniel Lim', avatar: AVATARS[1], productId: 'p2',
    lastMessage: 'Where can we meet for inspection?', time: '1h',
    unread: 0, online: true,
    messages: [
      { id: 'm1', from: 'them', text: 'Interested in the MacBook Pro.', time: '09:02' },
      { id: 'm2', from: 'me', text: 'Great! Battery health is 98%.', time: '09:04' },
      { id: 'm3', from: 'them', text: 'Where can we meet for inspection?', time: '09:10' },
    ],
  },
  {
    id: 'c3', userId: 'u4', name: 'Kenji Y.', avatar: AVATARS[3], productId: 'p4',
    lastMessage: 'Deal! Sending payment via escrow now.', time: 'Yesterday',
    unread: 0, online: false,
    messages: [
      { id: 'm1', from: 'them', text: 'Deal! Sending payment via escrow now.', time: 'Yesterday' },
    ],
  },
];

export const NOTIFICATIONS = [
  { id: 'n1', type: 'offer', title: 'New offer on iPhone 15 Pro', text: 'Aria Tan offered $980.', time: '2m', unread: true, icon: 'Tag' },
  { id: 'n2', type: 'chat', title: 'New message from Daniel Lim', text: 'Where can we meet for inspection?', time: '1h', unread: true, icon: 'MessageSquare' },
  { id: 'n3', type: 'delivery', title: 'Your AirPods Pro shipped', text: 'Tracking #G2G-44291. ETA 2 days.', time: '5h', unread: false, icon: 'Truck' },
  { id: 'n4', type: 'system', title: 'Verification approved', text: 'You\'re now a Verified Seller. Welcome!', time: 'Yesterday', unread: false, icon: 'ShieldCheck' },
];

// Reusable AI valuation engine (mock, rules-based)
export function valuateDevice({ brand = '', model = '', storage = '', batteryHealth = 90, condition = 'B' }) {
  const base = {
    Apple: 900, Samsung: 700, Google: 600, Sony: 500, Microsoft: 550, OnePlus: 480, Xiaomi: 420, Other: 380,
  };
  const conditionMult = { A: 1.0, B: 0.88, C: 0.74, D: 0.58 };
  const storageGB = parseInt((storage || '').replace(/[^0-9]/g, '') || '128', 10);
  const storageBonus = Math.min(0.35, (storageGB - 128) / 1024);
  const battery = Math.max(0.55, Math.min(1.0, (Number(batteryHealth) || 90) / 100));
  const brandBase = base[brand] || base.Other;
  const fair = Math.round(brandBase * (1 + storageBonus) * (conditionMult[condition] || 0.8) * battery);
  const dealerLow = Math.round(fair * 0.78);
  const dealerHigh = Math.round(fair * 0.88);
  const recommended = Math.round(fair * 0.98);
  const demand = Math.min(98, Math.max(30, 60 + (battery * 30) - (condition === 'D' ? 25 : 0) + (brand === 'Apple' ? 10 : 0)));
  const confidence = Math.min(96, 70 + Math.round(battery * 20) + (brand === 'Apple' ? 4 : 0));
  const quickSale = Math.round(demand * 0.9);
  // 12-month trend
  const trend = Array.from({ length: 12 }, (_, i) => {
    const month = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'][i];
    const drift = Math.sin(i / 2) * 0.04 - i * 0.012;
    return { month, value: Math.round(fair * (1 + drift)) };
  });
  return { fair, dealerLow, dealerHigh, recommended, demand, confidence, quickSale, trend };
}

export function getProductById(id) { return PRODUCTS.find(p => p.id === id); }
export function getProductsByCategory(cat) { return cat ? PRODUCTS.filter(p => p.category === cat) : PRODUCTS; }
