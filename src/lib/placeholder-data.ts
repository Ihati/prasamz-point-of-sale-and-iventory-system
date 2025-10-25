export type Product = {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  quantity: number;
  createdAt: any; // Can be a Date or Firestore Timestamp
};

export type PriceType = 'retail' | 'wholesale';

export type SaleItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  priceType: PriceType;
}

export type Sale = {
  id:string;
  userId: string;
  customerName: string;
  createdAt: any; // Can be ISO string, Date, or Firestore Timestamp
  items: SaleItem[];
};

export type User = {
  id:string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
};


// --- PLACEHOLDER DATA ---

function generateSales(products: Product[], users: User[]): Sale[] {
  const sales: Sale[] = [];
  const numSales = 50; // Generate 50 sales
  const customerNames = [
    'Liam Johnson', 'Olivia Smith', 'Noah Williams', 'Emma Brown', 'Oliver Jones',
    'Ava Garcia', 'Elijah Miller', 'Charlotte Davis', 'William Rodriguez', 'Sophia Martinez',
    'James Hernandez', 'Amelia Lopez', 'Benjamin Gonzalez', 'Isabella Wilson', 'Lucas Anderson',
    'Mia Taylor', 'Henry Thomas', 'Evelyn Moore', 'Alexander Jackson', 'Harper Martin'
  ];

  for (let i = 0; i < numSales; i++) {
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 30)); // Sales within the last 30 days
    
    const numItems = Math.floor(Math.random() * 5) + 1;
    const saleItems: SaleItem[] = [];

    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const priceType: PriceType = Math.random() > 0.3 ? 'retail' : 'wholesale';
      const price = priceType === 'retail' ? product.retailPrice : product.wholesalePrice;
      
      saleItems.push({
        productId: product.id,
        name: product.name,
        quantity,
        price,
        priceType,
      });
    }
    
    const user = users[Math.floor(Math.random() * users.length)];
    const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];

    sales.push({
      id: `sale-${i + 1}`,
      userId: user.id,
      customerName: customerName,
      createdAt: saleDate.toISOString(),
      items: saleItems,
    });
  }
  return sales.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}


const placeholderProducts: Product[] = [
    { id: 'prod-1', name: 'Pro-Tec Classic Helmet', category: 'Helmets', costPrice: 90, retailPrice: 150, wholesalePrice: 120, quantity: 50, createdAt: new Date() },
    { id: 'prod-2', name: 'Giro Register MIPS Helmet', category: 'Helmets', costPrice: 120, retailPrice: 180, wholesalePrice: 150, quantity: 30, createdAt: new Date() },
    { id: 'prod-3', name: 'Kryptonite KryptoLok U-Lock', category: 'Locks', costPrice: 60, retailPrice: 95, wholesalePrice: 75, quantity: 12, createdAt: new Date() },
    { id: 'prod-4', name: 'Abus Granit X-Plus 540', category: 'Locks', costPrice: 180, retailPrice: 250, wholesalePrice: 220, quantity: 25, createdAt: new Date() },
    { id: 'prod-5', name: 'Cateye Velo Wireless Computer', category: 'Accessories', costPrice: 50, retailPrice: 85, wholesalePrice: 65, quantity: 100, createdAt: new Date() },
    { id: 'prod-6', name: 'Topeak JoeBlow Sport Pump', category: 'Pumps', costPrice: 45, retailPrice: 75, wholesalePrice: 60, quantity: 80, createdAt: new Date() },
    { id: 'prod-7', name: 'Generic Inner Tube 700x25c', category: 'Tires & Tubes', costPrice: 5, retailPrice: 15, wholesalePrice: 10, quantity: 200, createdAt: new Date() },
    { id: 'prod-8', name: 'Continental GatorSkin Tire', category: 'Tires & Tubes', costPrice: 70, retailPrice: 110, wholesalePrice: 90, quantity: 60, createdAt: new Date() },
    { id: 'prod-9', name: 'Shimano SPD Pedals', category: 'Components', costPrice: 80, retailPrice: 120, wholesalePrice: 100, quantity: 45, createdAt: new Date() },
    { id: 'prod-10', name: 'Finish Line Dry Lube', category: 'Maintenance', costPrice: 15, retailPrice: 25, wholesalePrice: 20, quantity: 150, createdAt: new Date() },
    { id: 'prod-11', name: 'Bell Qualifier DLX MIPS', category: 'Helmets', costPrice: 250, retailPrice: 350, wholesalePrice: 300, quantity: 8, createdAt: new Date() },
    { id: 'prod-12', name: 'Hiplok DX U-Lock', category: 'Locks', costPrice: 100, retailPrice: 150, wholesalePrice: 130, quantity: 18, createdAt: new Date() },
];

const placeholderUsers: User[] = [
  { id: 'user-1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
  { id: 'user-2', name: 'Staff User', email: 'staff@example.com', role: 'staff' },
];

const placeholderSales = generateSales(placeholderProducts, placeholderUsers);


export { 
  placeholderProducts as products, 
  placeholderSales as sales,
  placeholderUsers as users 
};
