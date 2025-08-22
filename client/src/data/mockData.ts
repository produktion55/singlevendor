// Mock data for the application - this file provides realistic sample data
// to make the app feel alive as requested in the requirements

export const mockFeatures = [
  {
    id: 1,
    icon: "shield-check",
    title: "Secure Transactions",
    description: "End-to-end encrypted payments with cryptocurrency support and escrow protection.",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: 2,
    icon: "settings",
    title: "Document Generators",
    description: "Professional document generation tools for invoices, receipts, and official documents.",
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    id: 3,
    icon: "shopping-bag",
    title: "Digital Marketplace",
    description: "Browse and purchase premium digital products, software licenses, and exclusive content.",
    bgColor: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
];

export const mockCartItems = [
  {
    id: "prod-1",
    title: "Microsoft Office 365 Pro",
    price: 49.99,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
    type: "Digital License",
  },
  {
    id: "prod-2",
    title: "Premium Game Bundle",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
    type: "Steam Keys",
  },
];

export const mockNotifications = [
  {
    id: 1,
    title: "Order Delivered",
    message: "Your Premium Game Bundle has been delivered (Order #90ABCDEF)",
    time: "2 min ago",
    type: "success",
    orderId: "order_1234567890abcdef1234567890abcdef", // Example order ID
  },
  {
    id: 2,
    title: "Payment Confirmed",
    message: "Bitcoin deposit of 500€ confirmed",
    time: "1 hour ago",
    type: "info",
  },
];

export const mockCryptoAddresses = {
  bitcoin: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  litecoin: "ltc1qvx9k8ryqr6fgj3r2vk2v9c8n4m5l7p9w3x1z2",
  monero: "42rV4...x8kL5",
};

export const mockAdminStats = {
  totalSales: 12450,
  activeProducts: 84,
  totalUsers: 1247,
  pendingIssues: 7,
};
