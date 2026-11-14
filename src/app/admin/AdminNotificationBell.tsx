'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  ExternalLink,
  Clock,
  User,
  ChevronRight,
  X,
  CreditCard,
  Truck,
  Loader2,
  BellOff,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getRecentAdminNotificationsAction,
  AdminNotificationData,
} from './orders/actions';

export interface AdminNotificationItem extends AdminNotificationData {
  isRead: boolean;
}

export interface AdminNotificationBellProps {
  userId: string;
}

export default function AdminNotificationBell({ userId }: AdminNotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPulse, setHasPulse] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const storageKey = useMemo(() => `majisa_admin_read_orders_${userId}`, [userId]);

  // Read stored read-order IDs from localStorage
  const getStoredReadIds = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Save stored read-order IDs to localStorage (capped at 200 to prevent growth)
  const saveStoredReadIds = (ids: string[]) => {
    if (typeof window === 'undefined') return;
    try {
      const unique = Array.from(new Set(ids)).slice(0, 200);
      localStorage.setItem(storageKey, JSON.stringify(unique));
    } catch (e) {
      console.warn('Failed to persist read notifications to localStorage:', e);
    }
  };

  // 1. Initial hydration: Load recent orders from Supabase via Server Action
  useEffect(() => {
    let isMounted = true;

    async function loadInitialNotifications() {
      setIsLoading(true);
      try {
        const res = await getRecentAdminNotificationsAction();
        if (isMounted && res.success && res.notifications) {
          const readIds = getStoredReadIds();
          const items: AdminNotificationItem[] = res.notifications.map((n) => ({
            ...n,
            isRead: readIds.includes(n.id),
          }));
          setNotifications(items);
        }
      } catch (err) {
        console.error('Error fetching initial notifications:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialNotifications();

    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  // 2. Realtime Subscription: Listen to newly submitted orders in Supabase
  useEffect(() => {
    const supabase = createClient();
    const channelName = `admin-orders-notifications-${userId}`;

    const handleOrderNotification = (newRaw: any) => {
      if (!newRaw || !newRaw.id) return;
      // Admin visibility rule: Ignore draft orders awaiting payment proof
      if (newRaw.status === 'Awaiting Payment') return;

      setNotifications((prev) => {
        // Requirement 9: Deduplicate against existing state
        if (prev.some((n) => n.id === newRaw.id)) {
          return prev;
        }

        // Extract customer recipient name safely from shipping_address_snapshot
        let addr: Record<string, any> = {};
        if (
          typeof newRaw.shipping_address_snapshot === 'object' &&
          newRaw.shipping_address_snapshot !== null
        ) {
          addr = newRaw.shipping_address_snapshot;
        } else if (typeof newRaw.shipping_address_snapshot === 'string') {
          try {
            addr = JSON.parse(newRaw.shipping_address_snapshot);
          } catch {
            addr = {};
          }
        }

        const customerName =
          addr.recipient_name || addr.fullName || addr.name || 'Customer';

        const readIds = getStoredReadIds();
        const isRead = readIds.includes(newRaw.id);

        const newItem: AdminNotificationItem = {
          id: newRaw.id,
          orderNumber: newRaw.order_number || newRaw.id.slice(0, 8),
          customerName,
          totalAmount: Number(newRaw.total_amount) || 0,
          orderType: (newRaw.order_type === 'cod' ? 'cod' : 'online') as 'online' | 'cod',
          createdAt: newRaw.created_at || new Date().toISOString(),
          isRead,
        };

        // Trigger notification pulse
        setHasPulse(true);
        setTimeout(() => setHasPulse(false), 3000);

        return [newItem, ...prev];
      });
    };

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          handleOrderNotification(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newRaw = payload.new as any;
          const oldRaw = payload.old as any;
          // Trigger when order transitions from Awaiting Payment to Pending Verification upon proof submission
          if (
            newRaw?.status === 'Pending Verification' &&
            (!oldRaw || oldRaw.status === 'Awaiting Payment')
          ) {
            handleOrderNotification(newRaw);
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error(`Supabase Realtime notification channel error (${status}):`, err);
        }
      });

    // Requirement 10: Clean up Realtime subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // 3. Close panel when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Derived unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Mark a single notification as read & navigate to order detail page
  const handleItemClick = (item: AdminNotificationItem) => {
    if (!item.isRead) {
      const readIds = getStoredReadIds();
      const updatedReadIds = [item.id, ...readIds];
      saveStoredReadIds(updatedReadIds);

      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    }

    setIsOpen(false);
    // Requirement 6: Clicking notification navigates to Admin Order Details page
    router.push(`/admin/orders/${item.id}`);
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const readIds = getStoredReadIds();
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...allIds, ...readIds]));
    saveStoredReadIds(updated);

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Relative time formatter
  const formatTime = (isoString: string): string => {
    try {
      const now = Date.now();
      const past = new Date(isoString).getTime();
      const diffSec = Math.floor((now - past) / 1000);

      if (diffSec < 45) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

      return new Date(isoString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        className={`relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
          isOpen ? 'bg-slate-100 text-slate-900' : ''
        }`}
      >
        <Bell className={`w-5 h-5 text-slate-600 transition-transform ${hasPulse ? 'animate-bounce text-amber-500' : ''}`} />

        {/* Live Unread Badge */}
        {unreadCount > 0 && (
          <span
            className={`absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[#F59E0B] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-xs transition-transform ${
              hasPulse ? 'scale-110 bg-amber-600' : ''
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Notification Panel (Responsive Dropdown) */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Recent Orders Notifications"
          className="fixed sm:absolute top-16 sm:top-full left-3 right-3 sm:left-auto sm:right-0 sm:mt-2 w-auto sm:w-96 max-w-sm sm:max-w-none bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Notifications</span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-semibold rounded-full">
                  {unreadCount} new
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-200/80 text-slate-600 text-[11px] font-medium rounded-full">
                  All caught up
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50/80 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg sm:hidden cursor-pointer"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List Body */}
          <div className="overflow-y-auto max-h-[380px] divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span>Checking for new customer orders...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <BellOff className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-700 text-sm mt-1">No orders yet</p>
                <p className="text-[11px] text-slate-500 max-w-[220px]">
                  New customer orders will automatically appear here in real time.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemClick(item);
                    }
                  }}
                  className={`p-3 sm:p-3.5 text-left transition-colors cursor-pointer flex items-start gap-3 hover:bg-slate-50/90 group ${
                    !item.isRead ? 'bg-blue-50/40' : 'bg-white'
                  }`}
                >
                  {/* Order Type Indicator Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      item.orderType === 'cod'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </div>

                  {/* Order Details Stack */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {item.orderNumber}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                          item.orderType === 'cod'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                        }`}
                      >
                        {item.orderType === 'cod' ? 'COD' : 'Online'}
                      </span>
                    </div>

                    {/* Customer Name */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate font-medium">{item.customerName}</span>
                    </div>

                    {/* Amount & Time */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span className="font-bold text-slate-800">
                        ₹{item.totalAmount.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Unread dot or Chevron */}
                  <div className="shrink-0 self-center pl-1">
                    {!item.isRead ? (
                      <span
                        className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-100 block"
                        title="Unread order"
                      />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with quick link to orders list */}
          <div className="p-2.5 sm:p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
            <Link
              href="/admin/orders/online"
              onClick={() => setIsOpen(false)}
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors inline-flex items-center gap-1"
            >
              <span>Online Orders</span>
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href="/admin/orders/cod"
              onClick={() => setIsOpen(false)}
              className="text-slate-600 hover:text-amber-600 font-medium transition-colors inline-flex items-center gap-1"
            >
              <span>COD Orders</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

