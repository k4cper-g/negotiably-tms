# TransPortal

<div align="center">
  <img src="public/logo.png" alt="TransPortal Logo" width="200" height="auto">
  <br>
  <h3>AI-Powered Transport Logistics & Negotiation Platform</h3>
</div>

## 🚚 Overview

TransPortal is a modern web application that streamlines transport logistics operations by connecting shippers with carriers and automating price negotiations. The platform provides real-time tracking, intelligent matchmaking, and AI-assisted negotiations to reduce costs and improve efficiency in the transport industry.

## ✨ Key Features

- **Transport Offer Marketplace**: Browse, filter, and search for transport offers across multiple platforms
- **Smart Negotiation System**: AI-assisted price negotiation to help secure the best rates
- **Real-time Chat**: Direct communication between shippers and carriers
- **Multi-view Layout**: List, grid, and map views for transport offers
- **Analytics Dashboard**: Track savings, negotiation success rates, and performance metrics
- **Interactive Maps**: Visualize transport routes and locations
- **Responsive Design**: Seamless experience across desktop and mobile devices

## 🛠️ Technologies

- **Frontend**:
  - [Next.js](https://nextjs.org/) - React framework
  - [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
  - [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
  - [shadcn/ui](https://ui.shadcn.com/) - Component library
  - [Lucide](https://lucide.dev/) - Icon set

- **Backend**:
  - [Convex](https://www.convex.dev/) - Backend development platform
  - [Clerk](https://clerk.dev/) - Authentication and user management

- **Maps and Geolocation**:
  - [Leaflet](https://leafletjs.com/) - Interactive maps

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Convex account
- Clerk account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/transportal.git
cd transportal
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_CONVEX_URL=your_convex_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. In a separate terminal, start the Convex backend:
```bash
npx convex dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Usage

1. **Sign in** using your credentials or create a new account
2. **Browse transport offers** in the marketplace
3. **Filter and search** for specific offers based on criteria like origin, destination, price, etc.
4. **View offer details** and request transport services
5. **Negotiate prices** directly with carriers
6. **Track ongoing negotiations** and view analytics in the dashboard

## 🔍 Project Structure

```
transportal/
├── convex/                   # Backend functions and schema
├── public/                   # Static assets
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── (auth)/           # Authentication routes
│   │   ├── negotiations/     # Negotiation pages
│   │   ├── offers/           # Transport offers pages
│   │   └── globals.css       # Global styles
│   ├── components/           # Reusable components
│   │   ├── layout/           # Layout components
│   │   ├── ui/               # UI components
│   │   └── TransportMap.tsx  # Map component
│   ├── context/              # React context providers
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # Utility functions
└── tsconfig.json             # TypeScript configuration
```

## 📸 Screenshots

![Dashboard](public/screenshots/dashboard.png)
*Main dashboard with statistics and recent negotiations*

![Offers](public/screenshots/offers.png)
*Transport offers marketplace with filtering options*

![Negotiation](public/screenshots/negotiation.png)
*Negotiation interface with chat and price details*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Contact

Project Link: [https://github.com/yourusername/transportal](https://github.com/yourusername/transportal)

---

<div align="center">
  Made with ❤️ by TransPortal Team
</div>
