import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_STORES = [
  {
    name: 'Accra Market',
    owner: 'merchant@buckduck.com',
    ownerName: 'Efua Boateng',
    category: 'African Groceries',
    emoji: '🌍',
    color: '#B7791F',
    address: '8401 Colesville Rd',
    city: 'Silver Spring',
    state: 'MD',
    zip: '20910',
    tagline: 'Ghanaian staples, fresh every week',
    description: 'Family-owned specialty market. Gari, fresh kenkey, red palm oil, smoked fish and the authentic flavors of home — packed fresh for Saturday delivery in Silver Spring and DC Metro.',
    products: [
      { name: 'Gari (White), 4 lb', category: 'Staples', priceCents: 899, unit: '4 lb bag', emoji: '🍚', stock: 45 },
      { name: 'Red Palm Oil', category: 'Pantry', priceCents: 1099, unit: '1 L bottle', emoji: '🫙', stock: 30 },
      { name: 'Ripe Plantains', category: 'Produce', priceCents: 499, unit: 'bunch of 5', emoji: '🍌', stock: 80 },
      { name: 'Shito Hot Pepper Sauce', category: 'Pantry', priceCents: 799, unit: '12 oz jar', emoji: '🌶️', stock: 40 },
      { name: 'Fresh Kenkey', category: 'Prepared', priceCents: 1299, unit: '5 balls pack', emoji: '🍙', stock: 25 },
      { name: 'Fufu Flour', category: 'Staples', priceCents: 699, unit: '24 oz box', emoji: '🥣', stock: 50 },
      { name: 'Smoked Herring', category: 'Seafood', priceCents: 1499, unit: '1 lb pack', emoji: '🐟', stock: 20 },
      { name: 'Puna Yam', category: 'Produce', priceCents: 1299, unit: 'per tuber (large)', emoji: '🍠', stock: 35 },
    ],
  },
  {
    name: 'Lagos Pantry',
    owner: 'lagos@buckduck.com',
    ownerName: 'Tunde Adeyemi',
    category: 'African Groceries',
    emoji: '🌶️',
    color: '#C53030',
    address: '11200 Georgia Ave',
    city: 'Silver Spring',
    state: 'MD',
    zip: '20902',
    tagline: 'Nigerian kitchen essentials',
    description: 'Egusi, ogbono, ground crayfish, stockfish and everything needed for authentic Sunday stew — delivered Saturday.',
    products: [
      { name: 'Ground Egusi', category: 'Pantry', priceCents: 899, unit: '1 lb container', emoji: '🥜', stock: 40 },
      { name: 'Semolina Flour', category: 'Staples', priceCents: 999, unit: '5 lb bag', emoji: '🌾', stock: 50 },
      { name: 'Honey Beans (Oloyin)', category: 'Staples', priceCents: 1099, unit: '4 lb bag', emoji: '🫘', stock: 30 },
      { name: 'Ground Crayfish', category: 'Seafood', priceCents: 1199, unit: '8 oz container', emoji: '🦐', stock: 25 },
      { name: 'Suya Spice (Yaji)', category: 'Spices', priceCents: 599, unit: '6 oz shaker', emoji: '🌶️', stock: 60 },
      { name: 'Chin Chin', category: 'Snacks', priceCents: 499, unit: '14 oz jar', emoji: '🍪', stock: 45 },
    ],
  },
  {
    name: 'Island Spice Mart',
    owner: 'island@buckduck.com',
    ownerName: 'Marcia Campbell',
    category: 'Caribbean',
    emoji: '🍍',
    color: '#D69E2E',
    address: '8221 Georgia Ave',
    city: 'Silver Spring',
    state: 'MD',
    zip: '20910',
    tagline: 'Caribbean flavor, island fresh',
    description: 'From scotch bonnets to canned ackee — the authentic taste of Jamaica, Trinidad, and Guyana.',
    products: [
      { name: 'Scotch Bonnet Peppers', category: 'Produce', priceCents: 399, unit: '8 oz container', emoji: '🌶️', stock: 40 },
      { name: 'Canned Ackee', category: 'Pantry', priceCents: 1299, unit: '19 oz can', emoji: '🥫', stock: 35 },
      { name: 'Jerk Seasoning (Traditional)', category: 'Spices', priceCents: 699, unit: '10 oz jar', emoji: '🍖', stock: 50 },
      { name: 'Coco Bread', category: 'Bakery', priceCents: 499, unit: '4 pack', emoji: '🥖', stock: 25 },
      { name: 'Boneless Saltfish', category: 'Seafood', priceCents: 1399, unit: '1 lb pack', emoji: '🐟', stock: 20 },
      { name: 'Island Curry Powder', category: 'Spices', priceCents: 499, unit: '8 oz tin', emoji: '🍛', stock: 45 },
    ],
  },
  {
    name: 'Prime Cut Halal Meats',
    owner: 'primecut@buckduck.com',
    ownerName: 'Yusuf Hassan',
    category: 'Meat & Seafood',
    emoji: '🥩',
    color: '#9B2C2C',
    address: '9312 Piney Branch Rd',
    city: 'Silver Spring',
    state: 'MD',
    zip: '20903',
    tagline: 'Hand-cut halal meats & fresh fish',
    description: 'Certified halal butcher. Hand-cut, vacuum-sealed and chilled Saturday morning for immediate delivery.',
    products: [
      { name: 'Whole Halal Chicken', category: 'Poultry', priceCents: 1299, unit: '4–5 lb each', emoji: '🍗', stock: 35 },
      { name: 'Cubed Goat Meat', category: 'Goat & Lamb', priceCents: 999, unit: 'per lb', emoji: '🥩', stock: 40 },
      { name: 'Beef Stew Meat', category: 'Beef', priceCents: 899, unit: 'per lb', emoji: '🥩', stock: 45 },
      { name: 'Fresh Whole Tilapia', category: 'Seafood', priceCents: 799, unit: 'per lb (cleaned)', emoji: '🐟', stock: 30 },
      { name: 'Jumbo Tiger Shrimp', category: 'Seafood', priceCents: 1299, unit: '1 lb pack', emoji: '🦐', stock: 25 },
    ],
  },
  {
    name: 'Golden Crust Bakery',
    owner: 'goldencrust@buckduck.com',
    ownerName: 'Grace Okafor',
    category: 'Bakery',
    emoji: '🥐',
    color: '#975A16',
    address: '13847 Connecticut Ave',
    city: 'Silver Spring',
    state: 'MD',
    zip: '20906',
    tagline: 'Baked before sunrise, delivered by noon',
    description: 'Fresh artisanal meat pies, sweet breads, puff-puff and pastries baked Saturday at 3 AM.',
    products: [
      { name: 'West African Meat Pies', category: 'Savory', priceCents: 999, unit: '4 pack', emoji: '🥧', stock: 30 },
      { name: 'Sweet Hard-Dough Bread', category: 'Bread', priceCents: 599, unit: 'loaf', emoji: '🍞', stock: 40 },
      { name: 'Golden Puff-Puff', category: 'Pastry', priceCents: 699, unit: 'dozen', emoji: '🍩', stock: 35 },
      { name: 'Warm Cinnamon Rolls', category: 'Pastry', priceCents: 1099, unit: '4 pack', emoji: '🥮', stock: 25 },
    ],
  },
  {
    name: 'Green Valley Produce',
    owner: 'greenvalley@buckduck.com',
    ownerName: 'Daniel Ortiz',
    category: 'Fresh Produce',
    emoji: '🥬',
    color: '#2F855A',
    address: '2200 University Blvd W',
    city: 'Silver Spring',
    state: 'MD',
    zip: '20902',
    tagline: 'Farm-direct fresh vegetables & greens',
    description: 'We source crisp greens and farm-direct produce every Thursday for Saturday peak freshness.',
    products: [
      { name: 'Roma Tomatoes', category: 'Vegetables', priceCents: 199, unit: 'per lb', emoji: '🍅', stock: 100 },
      { name: 'Hass Avocados', category: 'Fruit', priceCents: 599, unit: '4 count bag', emoji: '🥑', stock: 60 },
      { name: 'Baby Spinach', category: 'Greens', priceCents: 449, unit: '10 oz tub', emoji: '🥬', stock: 45 },
      { name: 'Organic Bananas', category: 'Fruit', priceCents: 79, unit: 'per lb', emoji: '🍌', stock: 90 },
    ],
  },
];

async function main() {
  console.log('Seeding BuckDuck database for Silver Spring pilot launch...');

  const pwHash = await bcrypt.hash('demo1234', 10);

  // 1. Settings
  const settings = [
    { key: 'delivery_fee_cents', value: '599' },
    { key: 'service_fee_rate', value: '0.05' },
    { key: 'service_fee_min_cents', value: '199' },
    { key: 'driver_base_pay_cents', value: '550' },
    { key: 'min_order_cents', value: '1500' },
    { key: 'order_cutoff_hours', value: '24' },
    { key: 'default_commission_rate', value: '0.15' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // 2. Demo Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@buckduck.com' },
    update: {},
    create: {
      email: 'admin@buckduck.com',
      passwordHash: pwHash,
      name: 'BuckDuck Operations',
      role: 'admin',
      phone: '(301) 555-0100',
      status: 'active',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@buckduck.com' },
    update: {},
    create: {
      email: 'customer@buckduck.com',
      passwordHash: pwHash,
      name: 'Ama Mensah',
      role: 'customer',
      phone: '(301) 555-0101',
      status: 'active',
    },
  });

  const driver = await prisma.user.upsert({
    where: { email: 'driver@buckduck.com' },
    update: {},
    create: {
      email: 'driver@buckduck.com',
      passwordHash: pwHash,
      name: 'Kwame Asante',
      role: 'driver',
      phone: '(301) 555-0102',
      status: 'active',
      driverOnline: true,
      vehicle: 'Toyota Sienna · Silver (MD Reg)',
    },
  });

  // Additional demo driver
  await prisma.user.upsert({
    where: { email: 'luis@buckduck.com' },
    update: {},
    create: {
      email: 'luis@buckduck.com',
      passwordHash: pwHash,
      name: 'Luis Ramirez',
      role: 'driver',
      phone: '(301) 555-0103',
      status: 'active',
      driverOnline: true,
      vehicle: 'Ford Transit · White',
    },
  });

  // 3. Stores & Products
  const createdStores: any[] = [];
  for (const s of SEED_STORES) {
    const owner = await prisma.user.upsert({
      where: { email: s.owner },
      update: {},
      create: {
        email: s.owner,
        passwordHash: pwHash,
        name: s.ownerName,
        role: 'merchant',
        phone: '(301) 555-0150',
        status: 'active',
      },
    });

    const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const store = await prisma.store.upsert({
      where: { slug },
      update: {
        name: s.name,
        address: s.address,
        city: s.city,
        state: s.state,
        zip: s.zip,
        tagline: s.tagline,
        description: s.description,
        category: s.category,
        color: s.color,
        emoji: s.emoji,
        status: 'active',
        commissionRate: 0.15,
        rating: 4.9,
      },
      create: {
        ownerId: owner.id,
        name: s.name,
        slug,
        address: s.address,
        city: s.city,
        state: s.state,
        zip: s.zip,
        tagline: s.tagline,
        description: s.description,
        category: s.category,
        color: s.color,
        emoji: s.emoji,
        status: 'active',
        commissionRate: 0.15,
        rating: 4.9,
      },
    });

    createdStores.push(store);

    for (const p of s.products) {
      const existingProduct = await prisma.product.findFirst({
        where: { storeId: store.id, name: p.name },
      });
      if (!existingProduct) {
        await prisma.product.create({
          data: {
            storeId: store.id,
            name: p.name,
            description: `${p.name} from ${store.name} in Silver Spring, MD.`,
            category: p.category,
            priceCents: p.priceCents,
            unit: p.unit,
            stock: p.stock,
            emoji: p.emoji,
            active: true,
          },
        });
      }
    }
  }

  // 4. Delivery Windows
  const now = new Date();
  const day = now.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7;
  const nextSat = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSaturday);

  const windowSlots = [
    ['06:00', '12:00', 'Morning · 6 AM – 12 PM'],
    ['12:00', '16:00', 'Afternoon · 12 PM – 4 PM'],
  ];

  const createdWindows: any[] = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date(nextSat);
    d.setDate(d.getDate() + i * 7);
    const dateStr = d.toISOString().split('T')[0];

    for (const [start, end, label] of windowSlots) {
      const win = await prisma.deliveryWindow.upsert({
        where: { date_startTime: { date: dateStr, startTime: start } },
        update: {},
        create: {
          date: dateStr,
          startTime: start,
          endTime: end,
          label,
          capacity: 120,
          active: true,
        },
      });
      createdWindows.push(win);
    }
  }

  // 5. Seed live demo orders across the pipeline
  const activeWin = createdWindows[0];
  const samplePipeline = [
    { status: 'placed', count: 3 },
    { status: 'accepted', count: 2 },
    { status: 'packing', count: 2 },
    { status: 'ready', count: 2 },
  ];

  let orderSeq = 10001;
  for (const { status, count } of samplePipeline) {
    for (let i = 0; i < count; i++) {
      const store = createdStores[i % createdStores.length];
      const prods = await prisma.product.findMany({ where: { storeId: store.id }, take: 2 });
      if (!prods.length) continue;

      const subtotal = prods.reduce((sum, p) => sum + p.priceCents, 0);
      const deliveryFee = 599;
      const serviceFee = Math.max(199, Math.round(subtotal * 0.05));
      const tip = 400;
      const total = subtotal + deliveryFee + serviceFee + tip;
      const commission = Math.round(subtotal * 0.15);
      const driverPay = 550 + tip;

      const co = await prisma.checkout.create({
        data: {
          customerId: customer.id,
          totalCents: total,
          paymentStatus: 'paid',
          paymentMethod: 'card',
          paymentIntentId: `pi_seed_${orderSeq}`,
        },
      });

      const order = await prisma.order.create({
        data: {
          number: `BD-${orderSeq++}`,
          checkoutId: co.id,
          customerId: customer.id,
          storeId: store.id,
          windowId: activeWin.id,
          status,
          subtotalCents: subtotal,
          deliveryFeeCents: deliveryFee,
          serviceFeeCents: serviceFee,
          tipCents: tip,
          totalCents: total,
          commissionCents: commission,
          driverPayCents: driverPay,
          bags: 2,
          addressLine1: '8401 Colesville Rd',
          city: 'Silver Spring',
          state: 'MD',
          zip: '20910',
          phone: '(301) 555-0101',
          notes: 'Please leave in building lobby or front door.',
          items: {
            create: prods.map((p) => ({
              productId: p.id,
              name: p.name,
              emoji: p.emoji,
              unit: p.unit,
              priceCents: p.priceCents,
              qty: 1,
            })),
          },
          events: {
            create: [
              { status: 'placed', note: 'Order placed by customer', actor: 'customer' },
              ...(status !== 'placed' ? [{ status, note: `Status updated to ${status}`, actor: 'merchant' }] : []),
            ],
          },
        },
      });
    }
  }

  // Also seed a delivered order with Kwame Asante
  const storeA = createdStores[0];
  const prodA = await prisma.product.findFirst({ where: { storeId: storeA.id } });
  if (prodA) {
    const co = await prisma.checkout.create({
      data: {
        customerId: customer.id,
        totalCents: prodA.priceCents + 599 + 199 + 500,
        paymentStatus: 'paid',
        paymentMethod: 'apple_pay',
      },
    });

    await prisma.order.create({
      data: {
        number: `BD-${orderSeq++}`,
        checkoutId: co.id,
        customerId: customer.id,
        storeId: storeA.id,
        windowId: activeWin.id,
        driverId: driver.id,
        status: 'delivered',
        subtotalCents: prodA.priceCents,
        deliveryFeeCents: 599,
        serviceFeeCents: 199,
        tipCents: 500,
        totalCents: prodA.priceCents + 599 + 199 + 500,
        commissionCents: Math.round(prodA.priceCents * 0.15),
        driverPayCents: 1050,
        bags: 1,
        addressLine1: '8401 Colesville Rd',
        city: 'Silver Spring',
        state: 'MD',
        zip: '20910',
        phone: '(301) 555-0101',
        proofNote: 'Left safely at front door with concierge',
        items: {
          create: [{ productId: prodA.id, name: prodA.name, emoji: prodA.emoji, unit: prodA.unit, priceCents: prodA.priceCents, qty: 1 }],
        },
        events: {
          create: [
            { status: 'placed', note: 'Paid with Apple Pay', actor: 'customer' },
            { status: 'ready', note: 'Packed in BuckDuck bags', actor: 'merchant' },
            { status: 'picked_up', note: 'Picked up by Kwame Asante', actor: 'driver' },
            { status: 'delivered', note: 'Left at front door', actor: 'driver' },
          ],
        },
      },
    });
  }

  console.log('✅ Seeding complete! Database is populated with Silver Spring stores, products & Saturday pipeline.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
