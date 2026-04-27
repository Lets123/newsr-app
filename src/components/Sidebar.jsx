import {
  LayoutDashboard,
  ReceiptText,
  Boxes,
  Wallet,
  Store,
  Sparkles,
  HandCoins,
  Handshake,
  BanknoteArrowUp,
  ScrollText,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { name: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { name: "Billing", to: "/billing", icon: ReceiptText },
  { name: "Inventory", to: "/inventory", icon: Boxes },
  { name: "Dues", to: "/dues", icon: HandCoins },
  { name: "Expenses", to: "/expenses", icon: Handshake },
  { name: "Other Income", to: "/other-income", icon: BanknoteArrowUp },
  { name: "Ledger", to: "/ledger", icon: ScrollText },
  { name: "Finance", to: "/finance", icon: Wallet },
];

function Sidebar() {
  return (
    <aside className="w-18 sm:w-60 shrink-0 border-r border-slate-200 bg-white">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 p-3">
          <div className="flex items-center gap-2 rounded-md bg-gradient-to-r from-sky-900 to-teal-700 px-2 py-2 text-white">
            <Store size={18} />
            <div className="hidden sm:block">
              <div className="text-sm font-semibold leading-none">RetailFlow</div>
              <div className="text-[11px] text-white/80">Store Console</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map(({ name, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-sky-100 text-sky-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")
              }
            >
              <Icon size={17} />
              <span className="hidden sm:inline">{name}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-2">
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-2 py-2 text-emerald-800">
            <Sparkles size={15} />
            <span className="hidden text-xs font-semibold sm:inline">Density: Retail</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
