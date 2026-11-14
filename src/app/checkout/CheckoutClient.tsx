'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  CreditCard,
  Truck,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Upload,
  X,
  ExternalLink,
  Lock,
  Plus,
  Loader2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { calculateDeliveryFee } from '@/lib/delivery';
import type { CustomerAddress } from '@/app/account/AccountClient';
import {
  buildUpiPaymentUri,
  generateUpiQrDataUrl,
  validateUtrFormat,
} from '@/lib/payments/upi';
import { compressPaymentProof } from '@/lib/payments/imageCompression';
import {
  createOrderAction,
  submitPaymentProofAction,
  generatePaymentProofUploadSignatureAction,
  submitDirectPaymentProofAction,
  type UpiConfigResult,
  type CheckoutItemInput,
} from './actions';

interface CheckoutClientProps {
  savedAddresses: CustomerAddress[];
  customerProfile: {
    fullName: string;
    phone: string;
    email: string;
  };
  deliveryFee: number;
  upiConfig: UpiConfigResult;
}

const INDIAN_STATES = [
  'Rajasthan',
  'Maharashtra',
  'Delhi',
  'Karnataka',
  'Tamil Nadu',
  'Gujarat',
  'Uttar Pradesh',
  'West Bengal',
  'Telangana',
  'Kerala',
  'Punjab',
  'Haryana',
  'Madhya Pradesh',
  'Bihar',
  'Andhra Pradesh',
  'Assam',
  'Goa',
  'Himachal Pradesh',
  'Jammu & Kashmir',
  'Jharkhand',
  'Odisha',
  'Uttarakhand',
];

export default function CheckoutClient({
  savedAddresses,
  customerProfile,
  deliveryFee,
  upiConfig,
}: CheckoutClientProps) {
  const router = useRouter();
  const { cart, subtotal, totalItems, clearCart } = useCart();

  // Address State
  const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    defaultAddr ? defaultAddr.id : null
  );
  const [isAddingNewAddress, setIsAddingNewAddress] = useState<boolean>(
    savedAddresses.length === 0
  );
  const [newAddress, setNewAddress] = useState({
    recipientName: customerProfile.fullName || '',
    streetAddress: '',
    city: '',
    state: 'Rajasthan',
    postalCode: '',
    phone: customerProfile.phone || '',
    addressType: 'Home' as 'Home' | 'Work',
  });
  const [saveAddressToProfile, setSaveAddressToProfile] = useState<boolean>(true);
  const [customerNotes, setCustomerNotes] = useState<string>('');

  // Payment Selection State
  const [orderType, setOrderType] = useState<'online' | 'cod'>('online');

  // Checkout Execution States
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Active Payment Attempt State (Modal after order creation)
  const [activeOrder, setActiveOrder] = useState<{
    orderId: string;
    orderNumber: string;
    paymentId: string;
    amountExpected: number;
    orderType: 'online' | 'cod';
    vpa: string;
    merchantName: string;
  } | null>(null);

  const [upiUri, setUpiUri] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false);

  // Payment Proof Form State
  const [utrReference, setUtrReference] = useState<string>('');
  const [utrError, setUtrError] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState<boolean>(false);
  const [isCompressingProof, setIsCompressingProof] = useState<boolean>(false);
  const [submittingStepText, setSubmittingStepText] = useState<string | null>(null);
  const [proofSubmitError, setProofSubmitError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const dragCounter = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate QR when activeOrder is set
  useEffect(() => {
    if (!activeOrder) {
      setUpiUri('');
      setQrDataUrl('');
      return;
    }

    let isMounted = true;
    setIsGeneratingQr(true);

    try {
      const uri = buildUpiPaymentUri({
        vpa: activeOrder.vpa,
        merchantName: activeOrder.merchantName,
        amount: activeOrder.amountExpected,
        orderNumber: activeOrder.orderNumber,
        note: `Majisa Order ${activeOrder.orderNumber}`,
      });

      if (isMounted) {
        setUpiUri(uri);
      }

      generateUpiQrDataUrl(uri)
        .then((dataUrl) => {
          if (isMounted) {
            setQrDataUrl(dataUrl);
            setIsGeneratingQr(false);
          }
        })
        .catch((err) => {
          console.error('Failed to generate QR code data URL:', err);
          if (isMounted) setIsGeneratingQr(false);
        });
    } catch (err) {
      console.error('Failed to construct UPI URI:', err);
      if (isMounted) setIsGeneratingQr(false);
    }

    return () => {
      isMounted = false;
    };
  }, [activeOrder]);

  // Clean up proof image preview URL
  useEffect(() => {
    return () => {
      if (proofPreviewUrl) {
        URL.revokeObjectURL(proofPreviewUrl);
      }
    };
  }, [proofPreviewUrl]);

  const handleCopyVpa = async () => {
    if (!activeOrder?.vpa) return;
    try {
      await navigator.clipboard.writeText(activeOrder.vpa);
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  const processProofFile = async (rawFile: File) => {
    setProofSubmitError(null);
    if (!rawFile) return;

    if (rawFile.size > 15 * 1024 * 1024) {
      setProofSubmitError('Payment screenshot cannot exceed 15 MB before optimization.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(rawFile.type)) {
      setProofSubmitError('Only JPEG, PNG, or WEBP images are supported.');
      return;
    }

    if (proofPreviewUrl) {
      URL.revokeObjectURL(proofPreviewUrl);
    }

    setIsCompressingProof(true);
    try {
      // Client-side image optimization: drops 3-10MB mobile screenshots to ~150-250KB JPEG
      // with zero loss of readability for UTR digits, amounts, and dates.
      const optimized = await compressPaymentProof(rawFile);
      if (optimized.size > 5 * 1024 * 1024) {
        setProofSubmitError('Payment screenshot cannot exceed 5 MB after optimization.');
        setIsCompressingProof(false);
        return;
      }
      setProofFile(optimized);
      setProofPreviewUrl(URL.createObjectURL(optimized));
    } catch (compressErr) {
      console.warn('Screenshot compression fallback to original:', compressErr);
      setProofFile(rawFile);
      setProofPreviewUrl(URL.createObjectURL(rawFile));
    } finally {
      setIsCompressingProof(false);
    }
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (rawFile) {
      processProofFile(rawFile);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) {
      setIsDraggingOver(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDraggingOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      processProofFile(droppedFiles[0]);
    }
  };

  const handleClearProofFile = () => {
    if (proofPreviewUrl) {
      URL.revokeObjectURL(proofPreviewUrl);
    }
    setProofFile(null);
    setProofPreviewUrl(null);
  };

  // Upfront vs Doorstep calculation for display based on authoritative delivery brackets
  const activeDeliveryFee = calculateDeliveryFee(subtotal);
  const totalAmount = subtotal + activeDeliveryFee;
  const upfrontPayable = orderType === 'online' ? totalAmount : activeDeliveryFee;
  const doorstepBalance = orderType === 'online' ? 0 : subtotal;

  // Handle Order Creation
  const handleProceedToPayment = async () => {
    setCheckoutError(null);

    if (cart.length === 0) {
      setCheckoutError('Your bag is empty.');
      return;
    }

    // Strict UPI Availability check: Both Online and COD require UPI
    if (!upiConfig.isAvailable) {
      setCheckoutError(
        upiConfig.reason ||
          'UPI payments are temporarily unavailable. Checkout is currently paused.'
      );
      return;
    }

    // Validate delivery address
    if (isAddingNewAddress) {
      if (
        !newAddress.recipientName.trim() ||
        !newAddress.streetAddress.trim() ||
        !newAddress.city.trim() ||
        !newAddress.phone.trim() ||
        !newAddress.postalCode.trim()
      ) {
        setCheckoutError('Please fill in all mandatory delivery address fields.');
        return;
      }

      if (!/^\d{6}$/.test(newAddress.postalCode.trim())) {
        setCheckoutError('Postal PIN code must be a valid 6-digit number.');
        return;
      }

      if (newAddress.phone.replace(/[^0-9]/g, '').length < 10) {
        setCheckoutError('Please enter a valid 10-digit phone number.');
        return;
      }
    } else if (!selectedAddressId) {
      setCheckoutError('Please select a delivery address or add a new one.');
      return;
    }

    // Map cart items with authoritative variant UUID resolution
    const checkoutItems: CheckoutItemInput[] = cart.map((item) => {
      let matchedVariantId: string | null = null;

      if (item.selectedShade && item.product.shades) {
        const found = item.product.shades.find(
          (s) => s.name === item.selectedShade || s.id === item.selectedShade
        );
        if (found) matchedVariantId = found.id;
      } else if (item.selectedSize && item.product.sizes) {
        const found = item.product.sizes.find(
          (s) => s.size === item.selectedSize || s.id === item.selectedSize
        );
        if (found) matchedVariantId = found.id;
      }

      return {
        productId: item.product.id,
        variantId: matchedVariantId,
        quantity: item.quantity,
      };
    });

    setIsCreatingOrder(true);

    try {
      const result = await createOrderAction({
        orderType,
        addressId: isAddingNewAddress ? null : selectedAddressId,
        newAddress: isAddingNewAddress
          ? {
              recipientName: newAddress.recipientName.trim(),
              streetAddress: newAddress.streetAddress.trim(),
              city: newAddress.city.trim(),
              state: newAddress.state.trim() || 'Rajasthan',
              postalCode: newAddress.postalCode.trim(),
              phone: newAddress.phone.trim(),
              addressType: newAddress.addressType,
            }
          : null,
        saveAddressToProfile: isAddingNewAddress ? saveAddressToProfile : false,
        customerNotes: customerNotes.trim() || null,
        items: checkoutItems,
      });

      if (!result.success || !result.data) {
        setCheckoutError(result.error || 'Failed to place order. Please try again.');
        setIsCreatingOrder(false);
        return;
      }

      const orderData = result.data as {
        order_id: string;
        order_number: string;
        payment_id: string;
        amount_expected: number;
        order_type: 'online' | 'cod';
      };

      // Clear the cart context now that the order is recorded in the database
      clearCart();

      // If COD order has free delivery (amount_expected === 0), navigate directly to success page
      if (
        orderData.order_type === 'cod' &&
        (Number(orderData.amount_expected) === 0 ||
          (orderData as any).is_auto_confirmed)
      ) {
        router.push(
          `/checkout/success?order_number=${encodeURIComponent(
            orderData.order_number
          )}&order_id=${encodeURIComponent(orderData.order_id)}`
        );
        return;
      }

      // Set active order to display UPI payment modal
      setActiveOrder({
        orderId: orderData.order_id,
        orderNumber: orderData.order_number,
        paymentId: orderData.payment_id,
        amountExpected: Number(orderData.amount_expected),
        orderType: orderData.order_type,
        vpa: result.vpa || '',
        merchantName: result.merchantName || 'Majisa Cosmetics',
      });

      // Speculatively prefetch order confirmation page for instant redirect upon verification
      router.prefetch(
        `/checkout/success?order_number=${encodeURIComponent(
          orderData.order_number
        )}&order_id=${encodeURIComponent(orderData.order_id)}`
      );
    } catch (err: unknown) {
      console.error('Order creation error:', err);
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setCheckoutError(msg);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Handle Payment Proof Submission
  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setProofSubmitError(null);
    setUtrError(null);

    // Prevent duplicate submissions
    if (!activeOrder || isSubmittingProof || isCompressingProof) return;

    const utrCheck = validateUtrFormat(utrReference);
    if (!utrCheck.isValid) {
      setUtrError(utrCheck.error || 'Invalid UTR Reference Number.');
      return;
    }

    if (!proofFile) {
      setProofSubmitError('Please attach a screenshot of your successful UPI transaction.');
      return;
    }

    setIsSubmittingProof(true);
    setSubmittingStepText('Preparing secure upload...');

    try {
      let directUploadSuccess = false;

      // 1. High-Speed Direct Cloudinary Upload via Server-Signed Single-Use Signature
      try {
        const sigRes = await generatePaymentProofUploadSignatureAction({
          orderId: activeOrder.orderId,
          paymentId: activeOrder.paymentId,
        });

        if (sigRes.success && sigRes.data) {
          const sig = sigRes.data;
          setSubmittingStepText('Uploading payment screenshot (0%)...');

          const cloudRes = await new Promise<{
            public_id: string;
            format: string;
            bytes: number;
          }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(
              'POST',
              `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`
            );

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable && event.total > 0) {
                const percent = Math.min(
                  99,
                  Math.round((event.loaded / event.total) * 100)
                );
                setSubmittingStepText(
                  `Uploading payment screenshot (${percent}%)...`
                );
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const parsed = JSON.parse(xhr.responseText);
                  resolve({
                    public_id: parsed.public_id,
                    format: parsed.format,
                    bytes: parsed.bytes,
                  });
                } catch {
                  reject(new Error('Invalid Cloudinary upload response.'));
                }
              } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            };

            xhr.onerror = () =>
              reject(new Error('Network error uploading screenshot.'));

            const cfd = new FormData();
            cfd.append('file', proofFile);
            cfd.append('api_key', sig.api_key);
            cfd.append('timestamp', sig.timestamp.toString());
            cfd.append('signature', sig.signature);
            cfd.append('folder', sig.folder);
            cfd.append('public_id', sig.public_id);
            xhr.send(cfd);
          });

          setSubmittingStepText('Securing payment record...');

          const confirmRes = await submitDirectPaymentProofAction({
            orderId: activeOrder.orderId,
            paymentId: activeOrder.paymentId,
            utrReference: utrCheck.sanitized,
            amountSubmitted: activeOrder.amountExpected,
            proofPublicId: cloudRes.public_id,
            proofFormat: cloudRes.format,
            proofSizeBytes: cloudRes.bytes,
          });

          if (!confirmRes.success) {
            setProofSubmitError(
              confirmRes.error || 'Failed to register payment proof.'
            );
            setIsSubmittingProof(false);
            setSubmittingStepText(null);
            return;
          }

          directUploadSuccess = true;
        }
      } catch (directErr) {
        console.warn(
          'Direct upload encountered an issue, transitioning to server upload fallback:',
          directErr
        );
      }

      // 2. Reliable Fallback: Server-side proxy upload if direct upload was blocked or failed
      if (!directUploadSuccess) {
        setSubmittingStepText('Securing payment record...');
        const formData = new FormData();
        formData.append('order_id', activeOrder.orderId);
        formData.append('payment_id', activeOrder.paymentId);
        formData.append('utr_reference', utrCheck.sanitized);
        formData.append('amount_submitted', activeOrder.amountExpected.toString());
        formData.append('proof_file', proofFile);

        const res = await submitPaymentProofAction(formData);

        if (!res.success) {
          setProofSubmitError(res.error || 'Failed to submit payment proof.');
          setIsSubmittingProof(false);
          setSubmittingStepText(null);
          return;
        }
      }

      setSubmittingStepText('Order confirmed! Redirecting...');
      // Success: Navigate to confirmation page
      router.push(
        `/checkout/success?order_number=${encodeURIComponent(
          activeOrder.orderNumber
        )}&order_id=${encodeURIComponent(activeOrder.orderId)}`
      );
    } catch (err: unknown) {
      console.error('Payment proof submission error:', err);
      const msg =
        err instanceof Error ? err.message : 'Failed to submit payment proof.';
      setProofSubmitError(msg);
      setIsSubmittingProof(false);
      setSubmittingStepText(null);
    }
  };

  // Render empty cart state
  if (cart.length === 0 && !activeOrder) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-ivory-50">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-ivory-200 shadow-card">
          <div className="w-16 h-16 mx-auto rounded-full bg-plum-50 flex items-center justify-center text-plum-900 border border-plum-100">
            <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">
              Your Bag is Empty
            </h1>
            <p className="text-sm text-charcoal-600 leading-relaxed font-light">
              You do not have any luxury cosmetics in your shopping bag. Explore our artisanal formulations to begin.
            </p>
          </div>
          <Link
            href="/collections"
            className="inline-flex items-center justify-center gap-2 w-full h-[48px] px-6 rounded-full bg-plum-900 hover:bg-plum-950 text-white text-sm uppercase tracking-wider font-bold transition-all shadow-md hover:scale-[1.01]"
          >
            <span>Explore Collections</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-50 text-charcoal-900 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb & Title */}
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-xs text-charcoal-500 font-light">
            <Link href="/" className="hover:text-plum-900 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-charcoal-400" />
            <Link href="/cart" className="hover:text-plum-900 transition-colors">
              Shopping Bag
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-charcoal-400" />
            <span className="font-medium text-plum-900">Checkout</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-ivory-200 pb-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl text-plum-950 font-bold">
                Order Checkout
              </h1>
              <p className="text-xs sm:text-sm text-charcoal-600 font-light mt-1">
                Secure checkout with server-authoritative pricing and manual UPI verification.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-rosegold-500 bg-rosegold-50 px-3 py-1.5 rounded-full border border-rosegold-200 self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-rosegold-500 shrink-0" />
              <span className="font-medium">256-bit Encrypted Session</span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {checkoutError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-medium leading-relaxed">
              {checkoutError}
            </div>
            <button
              onClick={() => setCheckoutError(null)}
              className="text-red-500 hover:text-red-800 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Delivery Address & Payment Options (7 Cols) */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            {/* SECTION 1: DELIVERY ADDRESS */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-ivory-200 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between border-b border-ivory-100 pb-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="w-7 h-7 rounded-full bg-plum-900 text-ivory-50 flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </span>
                  <div>
                    <h2 className="font-serif text-base sm:text-lg text-charcoal-900 font-bold leading-tight">
                      Delivery Destination
                    </h2>
                    <p className="text-[11px] sm:text-xs text-charcoal-500 font-light leading-tight mt-0.5">
                      Select a saved destination or add a new shipping address
                    </p>
                  </div>
                </div>

                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewAddress(!isAddingNewAddress);
                      setCheckoutError(null);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-plum-900 hover:text-plum-950 px-2.5 py-1 rounded-full bg-plum-50 hover:bg-plum-100 border border-plum-200 transition-colors shrink-0"
                  >
                    {isAddingNewAddress ? (
                      <>
                        <span>Use Saved Address</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>Add New Address</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Saved Address Selection */}
              {!isAddingNewAddress && savedAddresses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`cursor-pointer rounded-xl p-3 sm:p-3.5 border transition-all text-left flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'border-plum-900 bg-plum-50/30 ring-1.5 ring-plum-800 shadow-xs'
                            : 'border-ivory-200 hover:border-ivory-300 bg-white'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-plum-900 bg-plum-100 px-2 py-0.5 rounded-full">
                              {addr.type}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-medium text-rosegold-500">
                                Default
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-xs sm:text-sm text-charcoal-900 leading-snug">
                            {addr.name}
                          </h3>
                          <p className="text-[11px] text-charcoal-600 font-light leading-snug line-clamp-2">
                            {addr.street}, {addr.city}, {addr.state} -{' '}
                            {addr.postalCode}
                          </p>
                        </div>
                        <div className="pt-1.5 border-t border-ivory-100/70 flex items-center justify-between text-[11px] text-charcoal-500">
                          <span className="truncate pr-1">Phone: {addr.phone}</span>
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-plum-900 bg-plum-900 text-white'
                                : 'border-charcoal-300'
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add New Address Form */}
              {(isAddingNewAddress || savedAddresses.length === 0) && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-charcoal-700">
                        Recipient Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newAddress.recipientName}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            recipientName: e.target.value,
                          })
                        }
                        placeholder="e.g. Maharani Padmini"
                        className="w-full h-9 px-3 rounded-lg border border-ivory-300 text-xs focus:outline-none focus:ring-1.5 focus:ring-plum-800 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-charcoal-700">
                        Contact Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={newAddress.phone}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, phone: e.target.value })
                        }
                        placeholder="10-digit mobile number"
                        className="w-full h-9 px-3 rounded-lg border border-ivory-300 text-xs focus:outline-none focus:ring-1.5 focus:ring-plum-800 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-charcoal-700">
                      Street Address / House / Landmark <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newAddress.streetAddress}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          streetAddress: e.target.value,
                        })
                      }
                      placeholder="e.g. Royal Heritage Palace, Suite 402, Civil Lines"
                      className="w-full h-9 px-3 rounded-lg border border-ivory-300 text-xs focus:outline-none focus:ring-1.5 focus:ring-plum-800 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-charcoal-700">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, city: e.target.value })
                        }
                        placeholder="e.g. Jaipur"
                        className="w-full h-9 px-3 rounded-lg border border-ivory-300 text-xs focus:outline-none focus:ring-1.5 focus:ring-plum-800 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-charcoal-700">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newAddress.state}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, state: e.target.value })
                        }
                        className="w-full h-9 px-2.5 rounded-lg border border-ivory-300 text-xs bg-white focus:outline-none focus:ring-1.5 focus:ring-plum-800 focus:border-transparent"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-charcoal-700">
                        Postal PIN Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={newAddress.postalCode}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            postalCode: e.target.value.replace(/[^0-9]/g, ''),
                          })
                        }
                        placeholder="6 digits (e.g. 302001)"
                        className="w-full h-9 px-3 rounded-lg border border-ivory-300 text-xs focus:outline-none focus:ring-1.5 focus:ring-plum-800 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-semibold text-charcoal-700">
                        Address Label:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {(['Home', 'Work'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() =>
                              setNewAddress({ ...newAddress, addressType: type })
                            }
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                              newAddress.addressType === type
                                ? 'bg-plum-900 text-white shadow-xs'
                                : 'bg-ivory-100 text-charcoal-600 hover:bg-ivory-200'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-charcoal-700 font-medium">
                      <input
                        type="checkbox"
                        checked={saveAddressToProfile}
                        onChange={(e) =>
                          setSaveAddressToProfile(e.target.checked)
                        }
                        className="w-3.5 h-3.5 rounded text-plum-900 focus:ring-plum-800"
                      />
                      <span>Save this address to my profile for future orders</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Optional Order Note */}
              <div className="pt-1">
                <label className="text-[11px] font-medium text-charcoal-600 block mb-1">
                  Delivery instructions or gift note (optional):
                </label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="e.g. Leave parcel with security or call before delivery"
                  className="w-full h-8.5 sm:h-9 px-3 rounded-lg border border-ivory-200 text-xs focus:outline-none focus:ring-1.5 focus:ring-plum-800"
                />
              </div>
            </div>

            {/* SECTION 2: PAYMENT METHOD & UPI STATUS */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-ivory-200 shadow-sm space-y-3.5">
              <div className="flex items-center gap-2.5 sm:gap-3 border-b border-ivory-100 pb-3">
                <span className="w-7 h-7 rounded-full bg-plum-900 text-ivory-50 flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </span>
                <div>
                  <h2 className="font-serif text-base sm:text-lg text-charcoal-900 font-bold leading-tight">
                    Payment Method
                  </h2>
                  <p className="text-[11px] sm:text-xs text-charcoal-500 font-light leading-tight mt-0.5">
                    Every order uses encrypted UPI QR with manual financial verification
                  </p>
                </div>
              </div>

              {/* STRICT UPI CHECK: If UPI is inactive or unconfigured */}
              {!upiConfig.isAvailable ? (
                <div className="p-4 sm:p-5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>UPI Payments Temporarily Unavailable</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed font-light">
                    Electronic UPI payments are currently undergoing administrative verification updates. Both Online and Cash on Delivery (Advance) orders are temporarily paused because both require UPI payment verification.
                  </p>
                  <p className="text-[11px] sm:text-xs text-amber-900 font-medium pt-0.5">
                    Please check back shortly or reach out to our concierge for assistance.
                  </p>
                </div>
              ) : (
                /* UPI IS ACTIVE: Render Online vs COD Options */
                <div className="space-y-2.5">
                  {/* Option A: Online Payment */}
                  <div
                    onClick={() => setOrderType('online')}
                    className={`cursor-pointer rounded-xl p-3 sm:p-3.5 border transition-all space-y-2 ${
                      orderType === 'online'
                        ? 'border-plum-900 bg-plum-50/30 ring-1.5 ring-plum-800 shadow-xs'
                        : 'border-ivory-200 hover:border-ivory-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            orderType === 'online'
                              ? 'bg-plum-900 text-white'
                              : 'bg-ivory-100 text-charcoal-600'
                          }`}
                        >
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="font-serif text-sm sm:text-base font-bold text-charcoal-900 leading-tight">
                              Online Payment (Full Order Amount)
                            </h3>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 leading-none">
                              Direct Verification
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-charcoal-600 font-light leading-snug mt-0.5">
                            Pay the full order amount of ₹{totalAmount.toLocaleString('en-IN')} upfront via dynamic UPI QR
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          orderType === 'online'
                            ? 'border-plum-900 bg-plum-900 text-white'
                            : 'border-charcoal-300'
                        }`}
                      >
                        {orderType === 'online' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    <div className="sm:pl-11 text-[11px] sm:text-xs text-charcoal-500 font-light border-t border-ivory-100/70 pt-2 flex flex-wrap items-center justify-between gap-1">
                      <span>Upfront Payable: <strong className="text-plum-900 font-semibold">₹{totalAmount.toLocaleString('en-IN')}</strong></span>
                      <span>Balance on Delivery: <strong className="text-emerald-700 font-semibold">₹0.00</strong></span>
                    </div>
                  </div>

                  {/* Option B: COD with Advance */}
                  <div
                    onClick={() => setOrderType('cod')}
                    className={`cursor-pointer rounded-xl p-3 sm:p-3.5 border transition-all space-y-2 ${
                      orderType === 'cod'
                        ? 'border-plum-900 bg-plum-50/30 ring-1.5 ring-plum-800 shadow-xs'
                        : 'border-ivory-200 hover:border-ivory-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            orderType === 'cod'
                              ? 'bg-plum-900 text-white'
                              : 'bg-ivory-100 text-charcoal-600'
                          }`}
                        >
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="font-serif text-sm sm:text-base font-bold text-charcoal-900 leading-tight">
                              Cash on Delivery ({activeDeliveryFee > 0 ? `₹${activeDeliveryFee} Advance` : 'Free Delivery'})
                            </h3>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rosegold-100 text-rosegold-800 leading-none">
                              {activeDeliveryFee > 0 ? 'Fixed Delivery Advance' : 'Free Delivery'}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-charcoal-600 font-light leading-snug mt-0.5">
                            {activeDeliveryFee > 0
                              ? `Pay ₹${activeDeliveryFee} fixed delivery charge upfront via UPI QR; product balance of ₹${subtotal.toLocaleString('en-IN')} collected at delivery`
                              : `Complimentary delivery; total product balance of ₹${subtotal.toLocaleString('en-IN')} collected at delivery`}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          orderType === 'cod'
                            ? 'border-plum-900 bg-plum-900 text-white'
                            : 'border-charcoal-300'
                        }`}
                      >
                        {orderType === 'cod' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    <div className="sm:pl-11 text-[11px] sm:text-xs text-charcoal-500 font-light border-t border-ivory-100/70 pt-2 flex flex-wrap items-center justify-between gap-1">
                      <span>Upfront Delivery Advance: <strong className="text-plum-900 font-semibold">{activeDeliveryFee > 0 ? `₹${activeDeliveryFee.toLocaleString('en-IN')}` : 'Free (₹0)'}</strong></span>
                      <span>Doorstep Balance Due: <strong className="text-amber-800 font-semibold">₹{subtotal.toLocaleString('en-IN')}</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary & Action (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-ivory-200 shadow-card space-y-6">
              <div className="flex items-center justify-between border-b border-ivory-100 pb-4">
                <h2 className="font-serif text-xl font-bold text-charcoal-900">
                  Order Summary
                </h2>
                <span className="text-xs font-semibold text-plum-900 bg-plum-50 px-2.5 py-1 rounded-full">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-ivory-100 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="py-3 flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-xl bg-ivory-100 overflow-hidden shrink-0 border border-ivory-200 relative">
                      {item.product.images[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-charcoal-400 text-xs">
                          MC
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-charcoal-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-charcoal-500 truncate">
                        {item.selectedShade && `Shade: ${item.selectedShade}`}
                        {item.selectedSize && `Size: ${item.selectedSize}`}
                        {!item.selectedShade && !item.selectedSize && item.product.brand}
                      </p>
                      <div className="text-xs text-charcoal-600 mt-1 flex items-center justify-between">
                        <span>Qty: {item.quantity}</span>
                        <span className="font-medium text-charcoal-900">
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-3 pt-3 border-t border-ivory-100 text-xs">
                <div className="flex items-center justify-between text-charcoal-600">
                  <span>Product Subtotal</span>
                  <span className="font-medium text-charcoal-900">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-charcoal-600">
                  <div className="flex items-center gap-1.5">
                    <span>Delivery Charge</span>
                    <span className="text-[10px] text-rosegold-500 bg-rosegold-50 px-1.5 py-0.5 rounded">
                      {activeDeliveryFee === 0 ? 'Free' : 'Standard'}
                    </span>
                  </div>
                  <span className="font-medium text-charcoal-900">
                    {activeDeliveryFee === 0
                      ? 'Complimentary'
                      : `₹${activeDeliveryFee.toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm font-bold text-charcoal-950 pt-2 border-t border-ivory-100">
                  <span>Grand Total</span>
                  <span className="text-plum-900 font-serif text-lg">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Upfront vs Doorstep Payment Breakdown Card */}
              <div className="rounded-2xl p-4 bg-ivory-50 border border-ivory-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-charcoal-700 font-medium">
                    Payable Now via UPI:
                  </span>
                  <span className="font-bold text-plum-900 text-sm">
                    ₹{upfrontPayable.toLocaleString('en-IN')}
                  </span>
                </div>
                {orderType === 'cod' ? (
                  <div className="flex items-center justify-between text-amber-800">
                    <span>Balance Due on Delivery:</span>
                    <span className="font-bold">
                      ₹{doorstepBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>Balance Due on Delivery:</span>
                    <span className="font-bold">₹0.00 (Fully Paid)</span>
                  </div>
                )}
              </div>

              {/* Primary Call to Action Button */}
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={
                  isCreatingOrder ||
                  cart.length === 0 ||
                  !upiConfig.isAvailable
                }
                className="w-full h-13 rounded-full bg-plum-900 hover:bg-plum-950 disabled:bg-charcoal-300 disabled:cursor-not-allowed text-white text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                {isCreatingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Initializing Order...</span>
                  </>
                ) : !upiConfig.isAvailable ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Checkout Temporarily Paused</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Order & Pay ₹{upfrontPayable.toLocaleString('en-IN')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-charcoal-500 font-light pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-rosegold-500" />
                <span>Manual finance verification before dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PAYMENT MODAL: DYNAMIC UPI QR & PROOF SUBMISSION */}
      {/* ===================================================================== */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/75 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg md:max-w-xl rounded-2xl sm:rounded-3xl shadow-modal border border-ivory-200 flex flex-col max-h-[92dvh] sm:max-h-[90dvh] my-auto overflow-hidden">
            {/* Modal Header (Fixed at top of modal) */}
            <div className="bg-plum-950 text-white p-4 sm:p-5 relative shrink-0">
              <div className="space-y-0.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rosegold-300 bg-plum-900/80 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-rosegold-300" />
                  <span>Order Placed Successfully</span>
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-ivory-50 leading-tight">
                  Complete Your UPI Payment
                </h3>
                <p className="text-[11px] sm:text-xs text-ivory-300 font-light">
                  Order Reference: <span className="font-mono text-white font-medium">{activeOrder.orderNumber}</span>
                </p>
              </div>

              <div className="mt-2.5 p-2.5 rounded-lg bg-plum-900/60 border border-plum-800/80 flex items-center justify-between text-xs">
                <span className="text-ivory-200 font-light text-[11px] sm:text-xs">
                  {activeOrder.orderType === 'online'
                    ? 'Online Payment (Full Order Amount):'
                    : `Cash on Delivery (₹${activeOrder.amountExpected} Advance):`}
                </span>
                <span className="font-bold text-rosegold-200 text-sm sm:text-base">
                  ₹{activeOrder.amountExpected.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Modal Body (Scrolls internally if viewport is constrained) */}
            <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 overflow-y-auto overscroll-contain flex-1">
              {/* Dynamic QR Display */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-3 rounded-xl bg-ivory-50 border border-ivory-200">
                <div className="w-36 h-36 sm:w-40 sm:h-40 bg-white p-2 sm:p-2.5 rounded-xl shadow-xs border border-ivory-200 flex items-center justify-center shrink-0">
                  {isGeneratingQr ? (
                    <div className="flex flex-col items-center gap-2 text-charcoal-400 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin text-plum-900" />
                      <span>Generating QR...</span>
                    </div>
                  ) : qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="UPI Payment QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-xs text-red-500 text-center">
                      Failed to render QR.
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1 text-center sm:text-left min-w-0">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-charcoal-700 uppercase tracking-wider">
                      Merchant VPA / UPI ID
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                      <code className="text-xs sm:text-sm font-mono font-bold text-plum-900 bg-white px-2 py-0.5 rounded-lg border border-ivory-300">
                        {activeOrder.vpa}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyVpa}
                        className="p-1.5 rounded-lg hover:bg-ivory-200 text-charcoal-600 transition-colors"
                        title="Copy UPI ID"
                      >
                        {copiedVpa ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-charcoal-500 font-light">
                      Payee: <strong>{activeOrder.merchantName}</strong>
                    </p>
                  </div>

                  {/* Direct Mobile UPI Intent Button */}
                  {upiUri && (
                    <a
                      href={upiUri}
                      className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-plum-900 hover:bg-plum-950 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      <span>Open in UPI App</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Proof Submission Instructions */}
              <div className="rounded-xl p-2.5 sm:p-3 bg-plum-50/50 border border-plum-100 flex items-start gap-2 text-[11px] sm:text-xs text-plum-950">
                <Info className="w-4 h-4 text-plum-800 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed">
                  <p className="font-semibold">Verification Step:</p>
                  <p className="font-light text-charcoal-600">
                    After completing the transfer in GPay, PhonePe, Paytm, or BHIM, copy the 12-digit UTR/Reference Number and upload your transaction screenshot below.
                  </p>
                </div>
              </div>

              {/* Proof Submission Form */}
              <form onSubmit={handleSubmitPaymentProof} className="space-y-3 sm:space-y-3.5">
                {proofSubmitError && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{proofSubmitError}</span>
                  </div>
                )}

                {/* UTR Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-charcoal-800 flex items-center justify-between">
                    <span>
                      UPI Transaction ID / UTR Number <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] text-charcoal-500 font-normal">
                      8–22 characters
                    </span>
                  </label>
                  <input
                    type="text"
                    value={utrReference}
                    onChange={(e) => {
                      setUtrReference(e.target.value.toUpperCase());
                      setUtrError(null);
                    }}
                    placeholder="e.g. 430129384756"
                    maxLength={22}
                    className="w-full h-9 sm:h-10 px-3 rounded-lg border border-ivory-300 font-mono text-xs sm:text-sm focus:outline-none focus:ring-1.5 focus:ring-plum-800"
                  />
                  {utrError && (
                    <p className="text-xs text-red-600 font-medium">{utrError}</p>
                  )}
                </div>

                {/* Screenshot Upload with Reliable Drag & Drop */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-charcoal-800 flex items-center justify-between">
                    <span>
                      Payment Screenshot Proof <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] text-charcoal-500 font-normal">
                      JPEG, PNG or WEBP (Max 5 MB)
                    </span>
                  </label>

                  {/* Hidden file input controlled by ref */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProofFileChange}
                    className="hidden"
                  />

                  {proofPreviewUrl ? (
                    <div className="relative rounded-xl border border-ivory-200 p-2.5 bg-ivory-50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-ivory-300 relative bg-white shrink-0">
                          <img
                            src={proofPreviewUrl}
                            alt="Payment Proof Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-xs min-w-0">
                          <p className="font-semibold text-charcoal-900 truncate max-w-[180px] sm:max-w-[220px]">
                            {proofFile?.name}
                          </p>
                          <p className="text-[11px] text-charcoal-500">
                            {proofFile
                              ? (proofFile.size / (1024 * 1024)).toFixed(2)
                              : 0}{' '}
                            MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-[11px] font-semibold text-plum-900 hover:bg-plum-50 rounded-md border border-plum-200 transition-colors"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={handleClearProofFile}
                          className="p-1.5 rounded-full hover:bg-ivory-200 text-charcoal-500 hover:text-red-600 transition-colors"
                          title="Remove screenshot"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label="Upload payment screenshot proof"
                      className={`border-2 border-dashed rounded-xl p-3.5 sm:p-4 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-center select-none ${
                        isDraggingOver
                          ? 'border-[#128F92] bg-[#DDF3F2]/60 ring-2 ring-[#128F92]/40 scale-[1.01]'
                          : 'border-ivory-300 hover:border-plum-800 bg-ivory-50/50 hover:bg-plum-50/20'
                      }`}
                    >
                      <Upload className={`w-5 h-5 transition-transform ${isDraggingOver ? 'text-[#128F92] scale-110' : 'text-plum-900'}`} />
                      <div className="space-y-0.5 pointer-events-none">
                        <span className="text-xs font-bold text-plum-900 block">
                          {isDraggingOver ? 'Drop screenshot image here' : 'Click to select screenshot'}
                        </span>
                        <p className="text-[10px] text-charcoal-500 font-light">
                          or drag and drop your payment receipt file
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmittingProof || isCompressingProof || !proofFile || !utrReference.trim()}
                  className="w-full h-10 sm:h-11 rounded-full bg-plum-900 hover:bg-plum-950 disabled:bg-charcoal-300 disabled:cursor-not-allowed text-white text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmittingProof ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{submittingStepText || 'Uploading Payment Proof...'}</span>
                    </>
                  ) : isCompressingProof ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Optimizing Screenshot for Fast Upload...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Payment Proof for Verification</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

