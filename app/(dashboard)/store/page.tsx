"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowUpRight,
  BadgePercent,
  Banknote,
  Boxes,
  Check,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Edit3,
  Eye,
  ImageIcon,
  Loader2,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
  Users,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

// ============================================================
// TYPES
// ============================================================

type StoreTab =
  | "Overview"
  | "Products"
  | "Orders"
  | "Inventory"
  | "Discounts"
  | "Settings";

type ProductStatus =
  | "active"
  | "draft"
  | "archived";

type OrderStatus =
  | "new"
  | "processing"
  | "dispatched"
  | "delivered"
  | "cancelled";

type PaymentStatus =
  | "paid"
  | "pending"
  | "refunded";

type DiscountType =
  | "percentage"
  | "fixed";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  status: ProductStatus;
  image?: string | null;
  orders: number;
  revenue: number;
};

type Order = {
  id: string;
  number: string;
  customer: string;
  email: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: number;
  createdAt: string;
};

type Discount = {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  uses: number;
  active: boolean;
};

type ProductForm = {
  name: string;
  sku: string;
  category: string;
  price: string;
  cost: string;
  stock: string;
  status: ProductStatus;
};

type DiscountForm = {
  code: string;
  type: DiscountType;
  value: string;
};

// ============================================================
// DUMMY DATA
// ============================================================

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Studio Planner",
    sku: "NP-PLN-001",
    category: "Stationery",
    price: 32,
    cost: 9.5,
    stock: 24,
    status: "active",
    orders: 58,
    revenue: 1856,
  },
  {
    id: "prod-2",
    name: "Classic Canvas Tote",
    sku: "NP-TOT-002",
    category: "Accessories",
    price: 26,
    cost: 8,
    stock: 4,
    status: "active",
    orders: 71,
    revenue: 1846,
  },
  {
    id: "prod-3",
    name: "Business Reset Workbook",
    sku: "NP-WBK-003",
    category: "Digital",
    price: 18,
    cost: 2.4,
    stock: 999,
    status: "active",
    orders: 64,
    revenue: 1152,
  },
  {
    id: "prod-4",
    name: "Desk Notes Set",
    sku: "NP-NOT-004",
    category: "Stationery",
    price: 14,
    cost: 4,
    stock: 7,
    status: "active",
    orders: 35,
    revenue: 490,
  },
  {
    id: "prod-5",
    name: "Launch Planning Kit",
    sku: "NP-KIT-005",
    category: "Digital",
    price: 48,
    cost: 5,
    stock: 999,
    status: "draft",
    orders: 0,
    revenue: 0,
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: "order-1",
    number: "#1048",
    customer: "Amelia Hart",
    email: "amelia@example.com",
    total: 86,
    status: "new",
    paymentStatus: "paid",
    items: 3,
    createdAt: "22 Aug 2026",
  },
  {
    id: "order-2",
    number: "#1047",
    customer: "Sophie Reed",
    email: "sophie@example.com",
    total: 42,
    status: "processing",
    paymentStatus: "paid",
    items: 2,
    createdAt: "22 Aug 2026",
  },
  {
    id: "order-3",
    number: "#1046",
    customer: "Oliver James",
    email: "oliver@example.com",
    total: 124,
    status: "dispatched",
    paymentStatus: "paid",
    items: 4,
    createdAt: "21 Aug 2026",
  },
  {
    id: "order-4",
    number: "#1045",
    customer: "Maya Collins",
    email: "maya@example.com",
    total: 32,
    status: "delivered",
    paymentStatus: "paid",
    items: 1,
    createdAt: "21 Aug 2026",
  },
  {
    id: "order-5",
    number: "#1044",
    customer: "Noah Bennett",
    email: "noah@example.com",
    total: 58,
    status: "processing",
    paymentStatus: "pending",
    items: 2,
    createdAt: "20 Aug 2026",
  },
];

const INITIAL_DISCOUNTS: Discount[] = [
  {
    id: "discount-1",
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    uses: 18,
    active: true,
  },
  {
    id: "discount-2",
    code: "FREESHIP",
    type: "fixed",
    value: 4.95,
    uses: 9,
    active: true,
  },
  {
    id: "discount-3",
    code: "SUMMER20",
    type: "percentage",
    value: 20,
    uses: 31,
    active: false,
  },
];

// ============================================================
// PAGE
// ============================================================

export default function StorePage() {
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<StoreTab>(
      "Overview"
    );

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>(
      INITIAL_PRODUCTS
    );

  const [
    orders,
    setOrders,
  ] =
    useState<Order[]>(
      INITIAL_ORDERS
    );

  const [
    discounts,
    setDiscounts,
  ] =
    useState<Discount[]>(
      INITIAL_DISCOUNTS
    );

  const [
    productSearch,
    setProductSearch,
  ] =
    useState("");

  const [
    orderSearch,
    setOrderSearch,
  ] =
    useState("");

  const [
    showProductModal,
    setShowProductModal,
  ] =
    useState(
      false
    );

  const [
    showDiscountModal,
    setShowDiscountModal,
  ] =
    useState(
      false
    );

  const [
    savingProduct,
    setSavingProduct,
  ] =
    useState(
      false
    );

  const [
    savingDiscount,
    setSavingDiscount,
  ] =
    useState(
      false
    );

  const [
    productForm,
    setProductForm,
  ] =
    useState<ProductForm>({
      name: "",
      sku: "",
      category: "General",
      price: "",
      cost: "",
      stock: "",
      status: "active",
    });

  const [
    discountForm,
    setDiscountForm,
  ] =
    useState<DiscountForm>({
      code: "",
      type: "percentage",
      value: "",
    });

  const [
    storeName,
    setStoreName,
  ] =
    useState(
      "North & Pine Store"
    );

  const [
    currency,
    setCurrency,
  ] =
    useState(
      "GBP"
    );

  const [
    lowStockThreshold,
    setLowStockThreshold,
  ] =
    useState(
      "8"
    );

  const [
    orderNotifications,
    setOrderNotifications,
  ] =
    useState(
      true
    );

  const [
    autoCreateContacts,
    setAutoCreateContacts,
  ] =
    useState(
      true
    );

  // ============================================================
  // METRICS
  // ============================================================

  const totalRevenue =
    useMemo(
      () =>
        products.reduce(
          (
            total,
            product
          ) =>
            total +
            product.revenue,
          0
        ),
      [
        products,
      ]
    );

  const totalOrders =
    useMemo(
      () =>
        products.reduce(
          (
            total,
            product
          ) =>
            total +
            product.orders,
          0
        ),
      [
        products,
      ]
    );

  const averageOrderValue =
    totalOrders >
    0
      ? totalRevenue /
        totalOrders
      : 0;

  const lowStockProducts =
    useMemo(
      () =>
        products.filter(
          (
            product
          ) =>
            product.stock <=
              Number(
                lowStockThreshold ||
                  0
              ) &&
            product.stock <
              900
        ),
      [
        products,
        lowStockThreshold,
      ]
    );

  const openOrders =
    useMemo(
      () =>
        orders.filter(
          (
            order
          ) =>
            ![
              "delivered",
              "cancelled",
            ].includes(
              order.status
            )
        ),
      [
        orders,
      ]
    );

  const paidOrders =
    useMemo(
      () =>
        orders.filter(
          (
            order
          ) =>
            order.paymentStatus ===
            "paid"
        ),
      [
        orders,
      ]
    );

  const orderRevenue =
    useMemo(
      () =>
        paidOrders.reduce(
          (
            total,
            order
          ) =>
            total +
            order.total,
          0
        ),
      [
        paidOrders,
      ]
    );

  const bestSellers =
    useMemo(
      () =>
        [...products]
          .sort(
            (
              first,
              second
            ) =>
              second.orders -
              first.orders
          )
          .slice(
            0,
            4
          ),
      [
        products,
      ]
    );

  const filteredProducts =
    useMemo(
      () => {
        const value =
          productSearch
            .trim()
            .toLowerCase();

        if (
          !value
        ) {
          return products;
        }

        return products.filter(
          (
            product
          ) =>
            product.name
              .toLowerCase()
              .includes(
                value
              ) ||
            product.sku
              .toLowerCase()
              .includes(
                value
              ) ||
            product.category
              .toLowerCase()
              .includes(
                value
              )
        );
      },
      [
        products,
        productSearch,
      ]
    );

  const filteredOrders =
    useMemo(
      () => {
        const value =
          orderSearch
            .trim()
            .toLowerCase();

        if (
          !value
        ) {
          return orders;
        }

        return orders.filter(
          (
            order
          ) =>
            order.number
              .toLowerCase()
              .includes(
                value
              ) ||
            order.customer
              .toLowerCase()
              .includes(
                value
              ) ||
            order.email
              .toLowerCase()
              .includes(
                value
              )
        );
      },
      [
        orders,
        orderSearch,
      ]
    );

  // ============================================================
  // HELPERS
  // ============================================================

  function money(
    value:
      | number
      | string
  ) {
    return new Intl.NumberFormat(
      "en-GB",
      {
        style:
          "currency",
        currency:
          currency ||
          "GBP",
        maximumFractionDigits:
          2,
      }
    ).format(
      Number(
        value ||
          0
      )
    );
  }

  function orderStatusLabel(
    status:
      OrderStatus
  ) {
    if (
      status ===
      "new"
    ) {
      return "New";
    }

    if (
      status ===
      "processing"
    ) {
      return "Processing";
    }

    if (
      status ===
      "dispatched"
    ) {
      return "Dispatched";
    }

    if (
      status ===
      "delivered"
    ) {
      return "Delivered";
    }

    return "Cancelled";
  }

  // ============================================================
  // PRODUCT ACTIONS
  // ============================================================

  function openNewProduct() {
    setProductForm({
      name: "",
      sku: "",
      category:
        "General",
      price: "",
      cost: "",
      stock: "",
      status:
        "active",
    });

    setShowProductModal(
      true
    );
  }

  async function createProduct() {
    if (
      savingProduct
    ) {
      return;
    }

    if (
      !productForm.name.trim()
    ) {
      alert(
        "Enter a product name."
      );
      return;
    }

    if (
      Number(
        productForm.price
      ) <
      0
    ) {
      alert(
        "Enter a valid price."
      );
      return;
    }

    setSavingProduct(
      true
    );

    await new Promise(
      (
        resolve
      ) =>
        setTimeout(
          resolve,
          350
        )
    );

    setProducts(
      (
        previous
      ) => [
        {
          id:
            `prod-${Date.now()}`,
          name:
            productForm.name.trim(),
          sku:
            productForm.sku.trim() ||
            `SKU-${Date.now()}`,
          category:
            productForm.category.trim() ||
            "General",
          price:
            Number(
              productForm.price ||
                0
            ),
          cost:
            Number(
              productForm.cost ||
                0
            ),
          stock:
            Number(
              productForm.stock ||
                0
            ),
          status:
            productForm.status,
          orders:
            0,
          revenue:
            0,
        },
        ...previous,
      ]
    );

    setSavingProduct(
      false
    );

    setShowProductModal(
      false
    );
  }

  function deleteProduct(
    productId: string
  ) {
    if (
      !window.confirm(
        "Remove this product from the demo store?"
      )
    ) {
      return;
    }

    setProducts(
      (
        previous
      ) =>
        previous.filter(
          (
            product
          ) =>
            product.id !==
            productId
        )
    );
  }

  // ============================================================
  // ORDER ACTIONS
  // ============================================================

  function advanceOrder(
    orderId: string
  ) {
    setOrders(
      (
        previous
      ) =>
        previous.map(
          (
            order
          ) => {
            if (
              order.id !==
              orderId
            ) {
              return order;
            }

            let nextStatus:
              OrderStatus =
              order.status;

            if (
              order.status ===
              "new"
            ) {
              nextStatus =
                "processing";
            } else if (
              order.status ===
              "processing"
            ) {
              nextStatus =
                "dispatched";
            } else if (
              order.status ===
              "dispatched"
            ) {
              nextStatus =
                "delivered";
            }

            return {
              ...order,
              status:
                nextStatus,
            };
          }
        )
    );
  }

  // ============================================================
  // DISCOUNTS
  // ============================================================

  async function createDiscount() {
    if (
      savingDiscount
    ) {
      return;
    }

    if (
      !discountForm.code.trim()
    ) {
      alert(
        "Enter a discount code."
      );
      return;
    }

    if (
      Number(
        discountForm.value
      ) <=
      0
    ) {
      alert(
        "Enter a discount value."
      );
      return;
    }

    setSavingDiscount(
      true
    );

    await new Promise(
      (
        resolve
      ) =>
        setTimeout(
          resolve,
          300
        )
    );

    setDiscounts(
      (
        previous
      ) => [
        {
          id:
            `discount-${Date.now()}`,
          code:
            discountForm.code
              .trim()
              .toUpperCase(),
          type:
            discountForm.type,
          value:
            Number(
              discountForm.value
            ),
          uses:
            0,
          active:
            true,
        },
        ...previous,
      ]
    );

    setSavingDiscount(
      false
    );

    setShowDiscountModal(
      false
    );

    setDiscountForm({
      code: "",
      type:
        "percentage",
      value: "",
    });
  }

  function toggleDiscount(
    discountId: string
  ) {
    setDiscounts(
      (
        previous
      ) =>
        previous.map(
          (
            discount
          ) =>
            discount.id ===
            discountId
              ? {
                  ...discount,
                  active:
                    !discount.active,
                }
              : discount
        )
    );
  }

  // ============================================================
  // TABS
  // ============================================================

  const tabs: {
    label:
      StoreTab;
    icon:
      any;
  }[] = [
    {
      label:
        "Overview",
      icon:
        Store,
    },
    {
      label:
        "Products",
      icon:
        Package,
    },
    {
      label:
        "Orders",
      icon:
        ShoppingBag,
    },
    {
      label:
        "Inventory",
      icon:
        Boxes,
    },
    {
      label:
        "Discounts",
      icon:
        BadgePercent,
    },
    {
      label:
        "Settings",
      icon:
        Settings,
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="min-h-screen bg-[#f7f5f2] pb-28 text-stone-900">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="mx-auto max-w-[1400px] px-4 pb-7 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2">
              <ShoppingBag
                size={
                  13
                }
                className="text-[#829473]"
              />

              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
                TOTS Commerce
              </span>
            </div>

            <h1 className="max-w-4xl font-serif text-5xl italic leading-none tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
              Your store,
              connected to
              your business.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-stone-500">
              Manage products,
              orders, stock and
              discounts alongside
              your clients,
              projects and
              finances.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-stone-500"
            >
              <RefreshCw
                size={
                  13
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={
                openNewProduct
              }
              className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#a9b897]"
            >
              <Plus
                size={
                  14
                }
              />

              New Product
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================
          NAV
      ====================================================== */}

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="no-scrollbar overflow-x-auto">
          <div className="flex min-w-max gap-1 rounded-2xl border border-stone-200 bg-white p-1.5">
            {tabs.map(
              (
                tab
              ) => {
                const Icon =
                  tab.icon;

                const active =
                  tab.label ===
                  activeTab;

                return (
                  <button
                    key={
                      tab.label
                    }
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        tab.label
                      )
                    }
                    className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[9px] font-black uppercase tracking-[0.13em] transition ${
                      active
                        ? "bg-stone-900 text-white"
                        : "text-stone-400 hover:bg-stone-50 hover:text-stone-700"
                    }`}
                  >
                    <Icon
                      size={
                        14
                      }
                    />

                    {
                      tab.label
                    }
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <AnimatePresence
          mode="wait"
        >
          {/* ==================================================
              OVERVIEW
          ================================================== */}

          {activeTab ===
            "Overview" && (
            <motion.div
              key="overview"
              initial={{
                opacity:
                  0,
                y:
                  8,
              }}
              animate={{
                opacity:
                  1,
                y:
                  0,
              }}
              exit={{
                opacity:
                  0,
              }}
              className="space-y-6"
            >
              <Panel>
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#a9b897]/10 text-[#829473]">
                    <Sparkles
                      size={
                        18
                      }
                    />
                  </div>

                  <div>
                    <SectionEyebrow>
                      TOTS Commerce
                      Summary
                    </SectionEyebrow>

                    <p className="mt-2 max-w-4xl text-lg leading-8 text-stone-700">
                      Your store has
                      generated{" "}
                      <strong>
                        {money(
                          totalRevenue
                        )}
                      </strong>{" "}
                      across{" "}
                      <strong>
                        {
                          totalOrders
                        }{" "}
                        orders
                      </strong>
                      . You currently
                      have{" "}
                      <strong>
                        {
                          openOrders.length
                        }{" "}
                        active orders
                      </strong>{" "}
                      and{" "}
                      <strong>
                        {
                          lowStockProducts.length
                        }{" "}
                        products
                      </strong>{" "}
                      requiring stock
                      attention.
                    </p>
                  </div>
                </div>
              </Panel>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StoreMetric
                  icon={
                    CircleDollarSign
                  }
                  label="Revenue"
                  value={money(
                    totalRevenue
                  )}
                />

                <StoreMetric
                  icon={
                    ShoppingCart
                  }
                  label="Orders"
                  value={String(
                    totalOrders
                  )}
                />

                <StoreMetric
                  icon={
                    TrendingUp
                  }
                  label="Avg Order"
                  value={money(
                    averageOrderValue
                  )}
                />

                <StoreMetric
                  icon={
                    AlertTriangle
                  }
                  label="Low Stock"
                  value={String(
                    lowStockProducts.length
                  )}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-12">
                <Panel className="lg:col-span-7">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <SectionEyebrow>
                        Fulfilment
                      </SectionEyebrow>

                      <h2 className="mt-1 font-serif text-2xl italic">
                        Orders needing
                        attention
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          "Orders"
                        )
                      }
                      className="text-xs font-semibold text-[#829473]"
                    >
                      View all
                    </button>
                  </div>

                  <div className="space-y-3">
                    {openOrders
                      .slice(
                        0,
                        4
                      )
                      .map(
                        (
                          order
                        ) => (
                          <OrderRow
                            key={
                              order.id
                            }
                            order={
                              order
                            }
                            money={
                              money
                            }
                            onAdvance={() =>
                              advanceOrder(
                                order.id
                              )
                            }
                          />
                        )
                      )}
                  </div>
                </Panel>

                <Panel className="lg:col-span-5">
                  <SectionEyebrow>
                    Store Snapshot
                  </SectionEyebrow>

                  <h2 className="mt-1 font-serif text-2xl italic">
                    Today&apos;s
                    position
                  </h2>

                  <div className="mt-6 space-y-4">
                    <DetailRow
                      label="Open orders"
                      value={String(
                        openOrders.length
                      )}
                    />

                    <DetailRow
                      label="Paid orders"
                      value={String(
                        paidOrders.length
                      )}
                    />

                    <DetailRow
                      label="Visible order value"
                      value={money(
                        orderRevenue
                      )}
                    />

                    <DetailRow
                      label="Active products"
                      value={String(
                        products.filter(
                          (
                            product
                          ) =>
                            product.status ===
                            "active"
                        ).length
                      )}
                    />

                    <DetailRow
                      label="Active discounts"
                      value={String(
                        discounts.filter(
                          (
                            discount
                          ) =>
                            discount.active
                        ).length
                      )}
                    />
                  </div>
                </Panel>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Panel>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <SectionEyebrow>
                        Performance
                      </SectionEyebrow>

                      <h2 className="mt-1 font-serif text-2xl italic">
                        Best sellers
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          "Products"
                        )
                      }
                      className="text-xs font-semibold text-[#829473]"
                    >
                      Products
                    </button>
                  </div>

                  <div className="space-y-3">
                    {bestSellers.map(
                      (
                        product,
                        index
                      ) => (
                        <div
                          key={
                            product.id
                          }
                          className="flex items-center gap-4 rounded-2xl bg-stone-50 p-4"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-stone-400">
                            <span className="font-serif text-lg italic">
                              #
                              {index +
                                1}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {
                                product.name
                              }
                            </p>

                            <p className="mt-1 text-[10px] text-stone-400">
                              {
                                product.orders
                              }{" "}
                              orders
                            </p>
                          </div>

                          <p className="font-serif text-lg italic">
                            {money(
                              product.revenue
                            )}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </Panel>

                <Panel>
                  <div className="mb-6">
                    <SectionEyebrow>
                      Inventory
                    </SectionEyebrow>

                    <h2 className="mt-1 font-serif text-2xl italic">
                      Stock warnings
                    </h2>
                  </div>

                  {!lowStockProducts.length ? (
                    <EmptyState
                      icon={
                        Check
                      }
                      title="Stock looks healthy"
                      text="Nothing is currently below your low-stock threshold."
                    />
                  ) : (
                    <div className="space-y-3">
                      {lowStockProducts.map(
                        (
                          product
                        ) => (
                          <div
                            key={
                              product.id
                            }
                            className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 p-4"
                          >
                            <div>
                              <p className="text-sm font-semibold text-stone-700">
                                {
                                  product.name
                                }
                              </p>

                              <p className="mt-1 text-[10px] text-amber-700">
                                {
                                  product.stock
                                }{" "}
                                left in stock
                              </p>
                            </div>

                            <AlertTriangle
                              size={
                                16
                              }
                              className="text-amber-500"
                            />
                          </div>
                        )
                      )}
                    </div>
                  )}
                </Panel>
              </div>

              <Panel>
                <SectionEyebrow>
                  Connected
                  Business
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-2xl italic">
                  Where commerce
                  connects into
                  TOTS-OS
                </h2>

                <div className="mt-6 grid gap-3 md:grid-cols-4">
                  <ConnectionCard
                    icon={
                      Users
                    }
                    title="Customers"
                    text="Orders can link customers back to CRM records."
                  />

                  <ConnectionCard
                    icon={
                      CircleDollarSign
                    }
                    title="Finance"
                    text="Sales can feed your wider finance position."
                  />

                  <ConnectionCard
                    icon={
                      PackageCheck
                    }
                    title="Tasks"
                    text="Fulfilment can become trackable work."
                  />

                  <ConnectionCard
                    icon={
                      Sparkles
                    }
                    title="Clarity"
                    text="Surface product, stock and order insights automatically."
                  />
                </div>
              </Panel>
            </motion.div>
          )}

          {/* ==================================================
              PRODUCTS
          ================================================== */}

          {activeTab ===
            "Products" && (
            <motion.div
              key="products"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
            >
              <Panel>
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <SectionEyebrow>
                      Catalogue
                    </SectionEyebrow>

                    <h2 className="mt-1 font-serif text-3xl italic">
                      Products
                    </h2>

                    <p className="mt-2 text-sm text-stone-500">
                      Manage the items
                      your business
                      sells.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                      <Search
                        size={
                          14
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                      />

                      <input
                        value={
                          productSearch
                        }
                        onChange={(
                          event
                        ) =>
                          setProductSearch(
                            event.target.value
                          )
                        }
                        placeholder="Search products..."
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-4 text-xs outline-none sm:w-64"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={
                        openNewProduct
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[8px] font-black uppercase text-white"
                    >
                      <Plus
                        size={
                          13
                        }
                      />

                      New Product
                    </button>
                  </div>
                </div>

                <div className="mt-8 overflow-hidden rounded-2xl border border-stone-100">
                  <div className="hidden grid-cols-[minmax(0,1.7fr)_1fr_.7fr_.7fr_.8fr_80px] gap-4 border-b bg-stone-50 px-5 py-4 text-[8px] font-black uppercase tracking-wider text-stone-400 md:grid">
                    <span>
                      Product
                    </span>

                    <span>
                      Category
                    </span>

                    <span>
                      Price
                    </span>

                    <span>
                      Stock
                    </span>

                    <span>
                      Status
                    </span>

                    <span />
                  </div>

                  {!filteredProducts.length ? (
                    <div className="p-12">
                      <EmptyState
                        icon={
                          Package
                        }
                        title="No products found"
                        text="Try another search or create a new product."
                      />
                    </div>
                  ) : (
                    filteredProducts.map(
                      (
                        product
                      ) => (
                        <div
                          key={
                            product.id
                          }
                          className="grid gap-4 border-b border-stone-100 px-5 py-5 last:border-0 md:grid-cols-[minmax(0,1.7fr)_1fr_.7fr_.7fr_.8fr_80px] md:items-center"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-300">
                              <ImageIcon
                                size={
                                  17
                                }
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-stone-700">
                                {
                                  product.name
                                }
                              </p>

                              <p className="mt-1 text-[10px] text-stone-400">
                                {
                                  product.sku
                                }
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-stone-500">
                            {
                              product.category
                            }
                          </p>

                          <p className="text-xs font-semibold">
                            {money(
                              product.price
                            )}
                          </p>

                          <div>
                            <p className="text-xs font-semibold">
                              {
                                product.stock
                              }
                            </p>

                            {product.stock <=
                              Number(
                                lowStockThreshold
                              ) &&
                              product.stock <
                                900 && (
                                <p className="mt-1 text-[9px] text-amber-600">
                                  Low stock
                                </p>
                              )}
                          </div>

                          <StatusBadge
                            status={
                              product.status
                            }
                          />

                          <div className="flex gap-1 md:justify-end">
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-50 text-stone-400"
                            >
                              <Edit3
                                size={
                                  13
                                }
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteProduct(
                                  product.id
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-400"
                            >
                              <Trash2
                                size={
                                  13
                                }
                              />
                            </button>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </Panel>
            </motion.div>
          )}

          {/* ==================================================
              ORDERS
          ================================================== */}

          {activeTab ===
            "Orders" && (
            <motion.div
              key="orders"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StoreMetric
                  icon={
                    ShoppingBag
                  }
                  label="Visible Orders"
                  value={String(
                    orders.length
                  )}
                />

                <StoreMetric
                  icon={
                    Package
                  }
                  label="Open"
                  value={String(
                    openOrders.length
                  )}
                />

                <StoreMetric
                  icon={
                    CreditCard
                  }
                  label="Paid"
                  value={String(
                    paidOrders.length
                  )}
                />

                <StoreMetric
                  icon={
                    CircleDollarSign
                  }
                  label="Order Value"
                  value={money(
                    orderRevenue
                  )}
                />
              </div>

              <Panel>
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <SectionEyebrow>
                      Fulfilment
                    </SectionEyebrow>

                    <h2 className="mt-1 font-serif text-3xl italic">
                      Orders
                    </h2>
                  </div>

                  <div className="relative">
                    <Search
                      size={
                        14
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                    />

                    <input
                      value={
                        orderSearch
                      }
                      onChange={(
                        event
                      ) =>
                        setOrderSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search orders..."
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-4 text-xs outline-none sm:w-72"
                    />
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {filteredOrders.map(
                    (
                      order
                    ) => (
                      <div
                        key={
                          order.id
                        }
                        className="rounded-2xl border border-stone-100 bg-stone-50 p-5"
                      >
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-stone-400">
                              <ShoppingBag
                                size={
                                  16
                                }
                              />
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold">
                                  {
                                    order.number
                                  }
                                </p>

                                <OrderStatusBadge
                                  status={
                                    order.status
                                  }
                                />

                                <PaymentBadge
                                  status={
                                    order.paymentStatus
                                  }
                                />
                              </div>

                              <p className="mt-2 text-xs font-medium text-stone-600">
                                {
                                  order.customer
                                }
                              </p>

                              <p className="mt-1 text-[10px] text-stone-400">
                                {
                                  order.email
                                }{" "}
                                ·{" "}
                                {
                                  order.items
                                }{" "}
                                items ·{" "}
                                {
                                  order.createdAt
                                }
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4 md:justify-end">
                            <p className="font-serif text-2xl italic">
                              {money(
                                order.total
                              )}
                            </p>

                            {![
                              "delivered",
                              "cancelled",
                            ].includes(
                              order.status
                            ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  advanceOrder(
                                    order.id
                                  )
                                }
                                className="rounded-xl bg-stone-900 px-4 py-3 text-[8px] font-black uppercase tracking-wider text-white"
                              >
                                {order.status ===
                                "new"
                                  ? "Start"
                                  : order.status ===
                                      "processing"
                                    ? "Dispatch"
                                    : "Mark Delivered"}
                              </button>
                            )}

                            <button
                              type="button"
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-stone-400"
                            >
                              <Eye
                                size={
                                  14
                                }
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </Panel>
            </motion.div>
          )}

          {/* ==================================================
              INVENTORY
          ================================================== */}

          {activeTab ===
            "Inventory" && (
            <motion.div
              key="inventory"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              className="space-y-6"
            >
              <Panel>
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <SectionEyebrow>
                      Stock
                    </SectionEyebrow>

                    <h2 className="mt-1 font-serif text-3xl italic">
                      Inventory
                    </h2>

                    <p className="mt-2 max-w-xl text-sm text-stone-500">
                      Keep track of
                      stock and spot
                      products that
                      need replenished
                      before they become
                      a problem.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-stone-50 px-5 py-4">
                    <p className="text-[8px] font-black uppercase tracking-wider text-stone-400">
                      Low stock
                      threshold
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={
                          lowStockThreshold
                        }
                        onChange={(
                          event
                        ) =>
                          setLowStockThreshold(
                            event.target.value
                          )
                        }
                        className="w-20 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs outline-none"
                      />

                      <span className="text-xs text-stone-400">
                        units
                      </span>
                    </div>
                  </div>
                </div>
              </Panel>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {products
                  .filter(
                    (
                      product
                    ) =>
                      product.stock <
                      900
                  )
                  .map(
                    (
                      product
                    ) => {
                      const low =
                        product.stock <=
                        Number(
                          lowStockThreshold
                        );

                      return (
                        <div
                          key={
                            product.id
                          }
                          className={`rounded-[1.7rem] border bg-white p-6 ${
                            low
                              ? "border-amber-200"
                              : "border-stone-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-50 text-stone-400">
                              <Boxes
                                size={
                                  17
                                }
                              />
                            </div>

                            {low && (
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-[8px] font-black uppercase text-amber-600">
                                Low stock
                              </span>
                            )}
                          </div>

                          <h3 className="mt-6 text-sm font-semibold">
                            {
                              product.name
                            }
                          </h3>

                          <p className="mt-1 text-[10px] text-stone-400">
                            {
                              product.sku
                            }
                          </p>

                          <div className="mt-7 flex items-end justify-between">
                            <div>
                              <p className="text-[8px] font-black uppercase tracking-wider text-stone-400">
                                Available
                              </p>

                              <p className="mt-1 font-serif text-4xl italic">
                                {
                                  product.stock
                                }
                              </p>
                            </div>

                            <button
                              type="button"
                              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-[8px] font-black uppercase text-stone-500"
                            >
                              Adjust
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
              </div>
            </motion.div>
          )}

          {/* ==================================================
              DISCOUNTS
          ================================================== */}

          {activeTab ===
            "Discounts" && (
            <motion.div
              key="discounts"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
            >
              <Panel>
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <SectionEyebrow>
                      Promotions
                    </SectionEyebrow>

                    <h2 className="mt-1 font-serif text-3xl italic">
                      Discount codes
                    </h2>

                    <p className="mt-2 text-sm text-stone-500">
                      Create simple
                      offers and
                      promotional codes.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowDiscountModal(
                        true
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[8px] font-black uppercase text-white"
                  >
                    <Plus
                      size={
                        13
                      }
                    />

                    New Discount
                  </button>
                </div>

                <div className="mt-8 space-y-3">
                  {discounts.map(
                    (
                      discount
                    ) => (
                      <div
                        key={
                          discount.id
                        }
                        className="flex flex-col gap-5 rounded-2xl border border-stone-100 bg-stone-50 p-5 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#829473]">
                            <Tag
                              size={
                                16
                              }
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-sm font-semibold tracking-wider">
                                {
                                  discount.code
                                }
                              </p>

                              <span
                                className={`h-2 w-2 rounded-full ${
                                  discount.active
                                    ? "bg-[#a9b897]"
                                    : "bg-stone-300"
                                }`}
                              />
                            </div>

                            <p className="mt-1 text-[10px] text-stone-400">
                              {discount.type ===
                              "percentage"
                                ? `${discount.value}% off`
                                : `${money(
                                    discount.value
                                  )} off`}
                              {" · "}
                              {
                                discount.uses
                              }{" "}
                              uses
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              toggleDiscount(
                                discount.id
                              )
                            }
                            className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-[8px] font-black uppercase text-stone-500"
                          >
                            {discount.active
                              ? "Disable"
                              : "Enable"}
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </Panel>
            </motion.div>
          )}

          {/* ==================================================
              SETTINGS
          ================================================== */}

          {activeTab ===
            "Settings" && (
            <motion.div
              key="settings"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              className="space-y-6"
            >
              <Panel>
                <SectionEyebrow>
                  Store Settings
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-3xl italic">
                  Commerce setup
                </h2>

                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  <Field
                    label="Store Name"
                  >
                    <input
                      value={
                        storeName
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreName(
                          event.target.value
                        )
                      }
                      className="store-input"
                    />
                  </Field>

                  <Field
                    label="Currency"
                  >
                    <select
                      value={
                        currency
                      }
                      onChange={(
                        event
                      ) =>
                        setCurrency(
                          event.target.value
                        )
                      }
                      className="store-input"
                    >
                      <option value="GBP">
                        GBP — £
                      </option>

                      <option value="EUR">
                        EUR — €
                      </option>

                      <option value="USD">
                        USD — $
                      </option>
                    </select>
                  </Field>

                  <Field
                    label="Low Stock Threshold"
                  >
                    <input
                      type="number"
                      value={
                        lowStockThreshold
                      }
                      onChange={(
                        event
                      ) =>
                        setLowStockThreshold(
                          event.target.value
                        )
                      }
                      className="store-input"
                    />
                  </Field>

                  <Field
                    label="Store Status"
                  >
                    <div className="store-input flex items-center justify-between">
                      <span className="text-sm">
                        Draft mode
                      </span>

                      <span className="rounded-full bg-amber-50 px-3 py-1 text-[8px] font-black uppercase text-amber-600">
                        Hidden
                      </span>
                    </div>
                  </Field>
                </div>
              </Panel>

              <Panel>
                <SectionEyebrow>
                  TOTS Integration
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-2xl italic">
                  Connect commerce
                  to the rest of the
                  business
                </h2>

                <div className="mt-7 space-y-4">
                  <ToggleSetting
                    title="Create CRM contacts from customers"
                    text="When a new customer places an order, create or match them inside Contacts."
                    enabled={
                      autoCreateContacts
                    }
                    onChange={() =>
                      setAutoCreateContacts(
                        (
                          previous
                        ) =>
                          !previous
                      )
                    }
                  />

                  <ToggleSetting
                    title="Order notifications"
                    text="Surface new and important orders inside the TOTS workspace."
                    enabled={
                      orderNotifications
                    }
                    onChange={() =>
                      setOrderNotifications(
                        (
                          previous
                        ) =>
                          !previous
                      )
                    }
                  />
                </div>
              </Panel>

              <Panel>
                <SectionEyebrow>
                  Integrations
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-2xl italic">
                  Selling channels
                </h2>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <IntegrationCard
                    name="Shopify"
                    text="Import products, orders and customers."
                  />

                  <IntegrationCard
                    name="WooCommerce"
                    text="Sync an existing WordPress store."
                  />

                  <IntegrationCard
                    name="TOTS Storefront"
                    text="Sell directly through a future TOTS-hosted storefront."
                    comingSoon
                  />
                </div>
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ======================================================
          PRODUCT MODAL
      ====================================================== */}

      <AnimatePresence>
        {showProductModal && (
          <ModalShell
            onClose={() => {
              if (
                !savingProduct
              ) {
                setShowProductModal(
                  false
                );
              }
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionEyebrow>
                  Catalogue
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-3xl italic">
                  New product
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowProductModal(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-50"
              >
                <X
                  size={
                    15
                  }
                />
              </button>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <Field
                label="Product Name"
                className="md:col-span-2"
              >
                <input
                  value={
                    productForm.name
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,
                        name:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Classic Canvas Tote"
                  className="store-input"
                />
              </Field>

              <Field
                label="SKU"
              >
                <input
                  value={
                    productForm.sku
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,
                        sku:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="SKU-001"
                  className="store-input"
                />
              </Field>

              <Field
                label="Category"
              >
                <input
                  value={
                    productForm.category
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,
                        category:
                          event.target.value,
                      })
                    )
                  }
                  className="store-input"
                />
              </Field>

              <Field
                label="Sale Price"
              >
                <input
                  type="number"
                  value={
                    productForm.price
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,
                        price:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="29.00"
                  className="store-input"
                />
              </Field>

              <Field
                label="Cost Price"
              >
                <input
                  type="number"
                  value={
                    productForm.cost
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,
                        cost:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="8.00"
                  className="store-input"
                />
              </Field>

              <Field
                label="Stock"
              >
                <input
                  type="number"
                  value={
                    productForm.stock
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,
                        stock:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="20"
                  className="store-input"
                />
              </Field>

              <Field
                label="Status"
              >
                <select
                  value={
                    productForm.status
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,
                        status:
                          event.target.value as ProductStatus,
                      })
                    )
                  }
                  className="store-input"
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="draft">
                    Draft
                  </option>

                  <option value="archived">
                    Archived
                  </option>
                </select>
              </Field>
            </div>

            <button
              type="button"
              onClick={() =>
                void createProduct()
              }
              disabled={
                savingProduct
              }
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-4 text-[9px] font-black uppercase tracking-[0.16em] text-white disabled:opacity-50"
            >
              {savingProduct ? (
                <Loader2
                  size={
                    14
                  }
                  className="animate-spin"
                />
              ) : (
                <Plus
                  size={
                    14
                  }
                />
              )}

              {savingProduct
                ? "Creating..."
                : "Create Product"}
            </button>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* ======================================================
          DISCOUNT MODAL
      ====================================================== */}

      <AnimatePresence>
        {showDiscountModal && (
          <ModalShell
            onClose={() =>
              setShowDiscountModal(
                false
              )
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionEyebrow>
                  Promotion
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-3xl italic">
                  New discount
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowDiscountModal(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-50"
              >
                <X
                  size={
                    15
                  }
                />
              </button>
            </div>

            <div className="mt-7 space-y-4">
              <Field
                label="Code"
              >
                <input
                  value={
                    discountForm.code
                  }
                  onChange={(
                    event
                  ) =>
                    setDiscountForm(
                      (
                        previous
                      ) => ({
                        ...previous,
                        code:
                          event.target.value.toUpperCase(),
                      })
                    )
                  }
                  placeholder="WELCOME10"
                  className="store-input font-mono uppercase"
                />
              </Field>

              <Field
                label="Discount Type"
              >
                <select
                  value={
                    discountForm.type
                  }
                  onChange={(
                    event
                  ) =>
                    setDiscountForm(
                      (
                        previous
                      ) => ({
                        ...previous,
                        type:
                          event.target.value as DiscountType,
                      })
                    )
                  }
                  className="store-input"
                >
                  <option value="percentage">
                    Percentage
                  </option>

                  <option value="fixed">
                    Fixed amount
                  </option>
                </select>
              </Field>

              <Field
                label={
                  discountForm.type ===
                  "percentage"
                    ? "Percentage"
                    : "Amount"
                }
              >
                <input
                  type="number"
                  value={
                    discountForm.value
                  }
                  onChange={(
                    event
                  ) =>
                    setDiscountForm(
                      (
                        previous
                      ) => ({
                        ...previous,
                        value:
                          event.target.value,
                      })
                    )
                  }
                  placeholder={
                    discountForm.type ===
                    "percentage"
                      ? "10"
                      : "5.00"
                  }
                  className="store-input"
                />
              </Field>
            </div>

            <button
              type="button"
              onClick={() =>
                void createDiscount()
              }
              disabled={
                savingDiscount
              }
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-4 text-[9px] font-black uppercase tracking-[0.16em] text-white disabled:opacity-50"
            >
              {savingDiscount ? (
                <Loader2
                  size={
                    14
                  }
                  className="animate-spin"
                />
              ) : (
                <BadgePercent
                  size={
                    14
                  }
                />
              )}

              {savingDiscount
                ? "Creating..."
                : "Create Discount"}
            </button>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* ======================================================
          STYLES
      ====================================================== */}

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap");

        .font-serif {
          font-family:
            "Instrument Serif",
            serif;
        }

        .store-input {
          width: 100%;
          border: 1px solid #eceae5;
          background: #faf9f6;
          border-radius: 0.8rem;
          padding: 0.95rem 1rem;
          font-size: 0.82rem;
          color: #44403c;
          outline: none;
          transition: 0.2s ease;
        }

        .store-input:focus {
          background: white;
          border-color: #a9b897;
          box-shadow:
            0 0 0 3px
            rgba(
              169,
              184,
              151,
              0.1
            );
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================

function Panel({
  children,
  className = "",
}: {
  children:
    React.ReactNode;
  className?:
    string;
}) {
  return (
    <div
      className={`rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionEyebrow({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
      {children}
    </p>
  );
}

function StoreMetric({
  icon:
    Icon,
  value,
  label,
}: {
  icon:
    any;
  value:
    string;
  label:
    string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-stone-200 bg-white p-5">
      <Icon
        size={
          18
        }
        className="mb-6 text-stone-300"
      />

      <p className="font-serif text-2xl italic text-stone-800 sm:text-3xl">
        {
          value
        }
      </p>

      <p className="mt-1 text-[8px] font-black uppercase tracking-wider text-stone-400">
        {
          label
        }
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label:
    string;
  value:
    string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-4 last:border-0">
      <span className="text-xs text-stone-400">
        {
          label
        }
      </span>

      <span className="text-right text-xs font-semibold text-stone-700">
        {
          value
        }
      </span>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label:
    string;
  children:
    React.ReactNode;
  className?:
    string;
}) {
  return (
    <div
      className={
        className
      }
    >
      <label className="mb-2 block text-[8px] font-black uppercase tracking-wider text-stone-400">
        {
          label
        }
      </label>

      {
        children
      }
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status:
    ProductStatus;
}) {
  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-[8px] font-black uppercase ${
        status ===
        "active"
          ? "bg-[#edf1e8] text-[#82936b]"
          : status ===
              "draft"
            ? "bg-amber-50 text-amber-600"
            : "bg-stone-100 text-stone-500"
      }`}
    >
      {
        status
      }
    </span>
  );
}

function OrderStatusBadge({
  status,
}: {
  status:
    OrderStatus;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[8px] font-black uppercase ${
        status ===
        "new"
          ? "bg-blue-50 text-blue-600"
          : status ===
              "processing"
            ? "bg-amber-50 text-amber-600"
            : status ===
                "dispatched"
              ? "bg-violet-50 text-violet-600"
              : status ===
                  "delivered"
                ? "bg-[#edf1e8] text-[#82936b]"
                : "bg-red-50 text-red-500"
      }`}
    >
      {
        status ===
        "new"
          ? "New"
          : status ===
              "processing"
            ? "Processing"
            : status ===
                "dispatched"
              ? "Dispatched"
              : status ===
                  "delivered"
                ? "Delivered"
                : "Cancelled"
      }
    </span>
  );
}

function PaymentBadge({
  status,
}: {
  status:
    PaymentStatus;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[8px] font-black uppercase ${
        status ===
        "paid"
          ? "bg-emerald-50 text-emerald-600"
          : status ===
              "pending"
            ? "bg-stone-100 text-stone-500"
            : "bg-red-50 text-red-500"
      }`}
    >
      {
        status
      }
    </span>
  );
}

function OrderRow({
  order,
  money,
  onAdvance,
}: {
  order:
    Order;
  money:
    (
      value:
        | number
        | string
    ) => string;
  onAdvance:
    () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">
            {
              order.number
            }
          </p>

          <OrderStatusBadge
            status={
              order.status
            }
          />
        </div>

        <p className="mt-2 text-xs text-stone-600">
          {
            order.customer
          }
        </p>

        <p className="mt-1 text-[10px] text-stone-400">
          {
            order.items
          }{" "}
          items ·{" "}
          {
            order.createdAt
          }
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <p className="font-serif text-xl italic">
          {money(
            order.total
          )}
        </p>

        <button
          type="button"
          onClick={
            onAdvance
          }
          className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[8px] font-black uppercase text-stone-500"
        >
          {order.status ===
          "new"
            ? "Process"
            : order.status ===
                "processing"
              ? "Dispatch"
              : "Complete"}

          <ChevronRight
            size={
              12
            }
          />
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  icon:
    Icon,
  title,
  text,
}: {
  icon:
    any;
  title:
    string;
  text:
    string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-10 text-center">
      <Icon
        size={
          24
        }
        className="mx-auto text-stone-300"
      />

      <p className="mt-4 text-sm font-semibold text-stone-600">
        {
          title
        }
      </p>

      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-stone-400">
        {
          text
        }
      </p>
    </div>
  );
}

function ConnectionCard({
  icon:
    Icon,
  title,
  text,
}: {
  icon:
    any;
  title:
    string;
  text:
    string;
}) {
  return (
    <div className="rounded-2xl bg-stone-50 p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#829473]">
        <Icon
          size={
            15
          }
        />
      </div>

      <p className="mt-4 text-xs font-semibold">
        {
          title
        }
      </p>

      <p className="mt-2 text-[10px] leading-5 text-stone-400">
        {
          text
        }
      </p>
    </div>
  );
}

function ToggleSetting({
  title,
  text,
  enabled,
  onChange,
}: {
  title:
    string;
  text:
    string;
  enabled:
    boolean;
  onChange:
    () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-2xl bg-stone-50 p-5">
      <div>
        <p className="text-sm font-semibold text-stone-700">
          {
            title
          }
        </p>

        <p className="mt-1 max-w-xl text-xs leading-5 text-stone-400">
          {
            text
          }
        </p>
      </div>

      <button
        type="button"
        onClick={
          onChange
        }
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${
          enabled
            ? "bg-stone-900"
            : "bg-stone-200"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
            enabled
              ? "left-7"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function IntegrationCard({
  name,
  text,
  comingSoon = false,
}: {
  name:
    string;
  text:
    string;
  comingSoon?:
    boolean;
}) {
  return (
    <div className="rounded-2xl border border-stone-100 bg-stone-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
          <Store
            size={
              15
            }
            className="text-stone-400"
          />
        </div>

        {comingSoon && (
          <span className="rounded-full bg-[#edf1e8] px-3 py-1 text-[7px] font-black uppercase text-[#82936b]">
            Coming soon
          </span>
        )}
      </div>

      <p className="mt-5 text-sm font-semibold">
        {
          name
        }
      </p>

      <p className="mt-2 text-[10px] leading-5 text-stone-400">
        {
          text
        }
      </p>

      {!comingSoon && (
        <button
          type="button"
          className="mt-5 flex items-center gap-1 text-[8px] font-black uppercase text-[#829473]"
        >
          Connect

          <ArrowUpRight
            size={
              11
            }
          />
        </button>
      )}
    </div>
  );
}

function ModalShell({
  children,
  onClose,
}: {
  children:
    React.ReactNode;
  onClose:
    () => void;
}) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.button
        type="button"
        aria-label="Close modal"
        initial={{
          opacity:
            0,
        }}
        animate={{
          opacity:
            1,
        }}
        exit={{
          opacity:
            0,
        }}
        onClick={
          onClose
        }
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{
          opacity:
            0,
          scale:
            0.97,
          y:
            12,
        }}
        animate={{
          opacity:
            1,
          scale:
            1,
          y:
            0,
        }}
        exit={{
          opacity:
            0,
          scale:
            0.97,
          y:
            12,
        }}
        className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-stone-100 bg-white p-6 shadow-2xl sm:p-8"
      >
        {
          children
        }
      </motion.div>
    </div>
  );
}