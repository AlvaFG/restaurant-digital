# M6 Week 4 Day 18-20 - Admin Analytics Dashboard Plan

## 📊 Overview
**Goal**: Create an admin dashboard to view sales metrics, revenue analytics, popular items, and QR usage statistics.

---

## 🎯 Features to Implement

### 1. Sales Metrics Dashboard
- Total revenue (today, week, month, all-time)
- Number of orders (by status)
- Average order value
- Orders by payment method
- Orders by table

### 2. Revenue Charts
- Revenue over time (line chart)
- Revenue by category (pie chart)
- Revenue by payment method (bar chart)
- Peak hours heatmap

### 3. Popular Items Analysis
- Top 10 most ordered items
- Items by revenue
- Items by quantity sold
- Category performance

### 4. QR Usage Reporting
- Total QR scans
- Sessions created
- Conversion rate (scan → order)
- Average session duration
- Table utilization

---

## 📁 File Structure

```
app/analitica/
  page.tsx                    # Main analytics dashboard
  _components/
    sales-metrics-cards.tsx   # Metric cards (revenue, orders, etc.)
    revenue-chart.tsx         # Line chart for revenue over time
    category-chart.tsx        # Pie chart for categories
    popular-items-list.tsx    # Top items table
    qr-usage-stats.tsx        # QR scan statistics
    date-range-picker.tsx     # Date filter component

lib/
  analytics-service.ts        # Analytics calculations
  analytics-types.ts          # Analytics TypeScript types

app/api/analytics/
  sales/route.ts             # GET - Sales metrics
  revenue/route.ts           # GET - Revenue data
  popular-items/route.ts     # GET - Popular items
  qr-usage/route.ts          # GET - QR usage stats
```

---

## 🚀 Implementation Strategy

### Phase 1: Analytics Service & Types (30 min)
Create backend service to calculate metrics from orders data.

### Phase 2: API Endpoints (45 min)
Create REST endpoints for each analytics category.

### Phase 3: Dashboard Components (60 min)
Build React components for displaying analytics.

### Phase 4: Charts Integration (45 min)
Integrate recharts for visualizations.

### Phase 5: Date Filtering (30 min)
Add date range picker for filtering data.

---

## 📊 Metrics to Calculate

### Sales Metrics
- `totalRevenue`: Sum of all completed orders
- `orderCount`: Total number of orders
- `avgOrderValue`: totalRevenue / orderCount
- `completionRate`: completed / total orders
- `paymentMethodBreakdown`: Orders grouped by payment method

### Revenue Analytics
- `revenueByDay`: Revenue aggregated by day
- `revenueByCategory`: Revenue grouped by item category
- `revenueByPaymentMethod`: Revenue by payment type
- `revenueByHour`: Peak hours analysis

### Popular Items
- `topItemsByQuantity`: Items sorted by total quantity sold
- `topItemsByRevenue`: Items sorted by total revenue generated
- `categoryPerformance`: Revenue and quantity by category

### QR Usage
- `totalScans`: Total QR code scans
- `totalSessions`: Unique sessions created
- `conversionRate`: (orders / sessions) * 100
- `avgSessionDuration`: Average time from scan to order
- `tableUtilization`: Orders per table

---

## 🛠️ Technology Stack

### Charts Library: Recharts
```bash
npm install recharts
```

**Why Recharts?**
- React-first, composable components
- Good TypeScript support
- Lightweight (smaller than Chart.js)
- Responsive by default
- Easy customization

### Date Picker: react-day-picker
```bash
npm install react-day-picker date-fns
```

---

## 🎨 Dashboard Layout

```
┌─────────────────────────────────────────┐
│  Admin Analytics Dashboard               │
├─────────────────────────────────────────┤
│  [Date Range Picker: Last 30 days ▼]    │
├─────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Revenue│ │Orders│ │  Avg │ │Complet│  │
│  │$12,340│ │  156 │ │ $79.1│ │  94% │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
├─────────────────────────────────────────┤
│  Revenue Over Time                       │
│  ┌───────────────────────────────────┐  │
│  │     [Line Chart]                  │  │
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│  ┌─────────────────┐ ┌───────────────┐ │
│  │ Revenue by      │ │ Popular Items │ │
│  │ Category        │ │               │ │
│  │ [Pie Chart]     │ │ [Table]       │ │
│  └─────────────────┘ └───────────────┘ │
├─────────────────────────────────────────┤
│  QR Usage Statistics                     │
│  ┌───────────────────────────────────┐  │
│  │ Scans: 523 | Sessions: 487       │  │
│  │ Conversion: 32% | Avg: 4m 23s    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🔒 Access Control

**For MVP**: Simple admin-only access
- Check if user is authenticated
- Check if user has admin role
- Redirect to login if not authorized

**Future**: Role-based access control (RBAC)

---

## 📝 Next Steps

1. Install chart dependencies
2. Create analytics service
3. Build API endpoints
4. Create dashboard components
5. Test with real data

Let's start! 🚀
