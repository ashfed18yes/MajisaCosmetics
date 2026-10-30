'use client';

import React, { useState } from 'react';
import { Mail, Phone, MessageCircle, Send, CheckCircle2, Sparkles, MapPin, Clock, Navigation } from 'lucide-react';
import { CONTACT_INFO } from '@/config/contact';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Please provide your full name';
    if (!formData.email.trim()) {
      errs.email = 'Please provide your email address';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.subject.trim()) errs.subject = 'Please specify a subject';
    if (!formData.message.trim() || formData.message.length < 10) {
      errs.message = 'Please share your inquiry (minimum 10 characters)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1000);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-12 sm:py-16 space-y-12 sm:space-y-14">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#DDF3F2] text-[#128F92] border border-[#128F92]/20 text-xs uppercase tracking-wider font-extrabold mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#128F92]" />
          <span>Atelier Concierge</span>
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#0B4145] font-bold tracking-tight">
          Connect With Us
        </h1>
        <p className="mt-3.5 text-base sm:text-lg text-[#687F8D] font-medium leading-relaxed">
          Whether you seek personalized shade recommendations, bulk bridal gifting consultations, or order assistance, our beauty advisors are delighted to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">
        {/* Left Column: Separate Rounded White Cards for Email and Phone */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Official Email Details */}
          <div className="bg-white rounded-[32px] p-8 sm:p-9 border border-[#D4E5E3] shadow-card space-y-6 transition-all hover:shadow-hover">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#DDF3F2] flex items-center justify-center text-[#128F92] shrink-0 shadow-sm border border-[#BCE7E5]">
                <Mail className="w-7 h-7 stroke-[1.9]" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-extrabold text-[#128F92] block">
                  Official Business Email
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#0B4145] font-bold">
                  Email Support
                </h2>
              </div>
            </div>

            <p className="text-sm text-[#687F8D] font-medium leading-relaxed">
              For client service, shade recommendations, order assistance, and official business inquiries.
            </p>

            <div className="p-4 rounded-2xl bg-[#F0F9F8] border border-[#DDF3F2]">
              <span className="text-xs font-extrabold text-[#687F8D] uppercase tracking-wider block mb-1">
                Direct Email Address
              </span>
              <a
                href={CONTACT_INFO.emailLink}
                className="text-base sm:text-lg font-bold text-[#0B4145] hover:text-[#128F92] transition-colors break-all"
                aria-label={`Email ${CONTACT_INFO.businessName} at ${CONTACT_INFO.email}`}
              >
                {CONTACT_INFO.email}
              </a>
            </div>

            <div>
              <a
                href={CONTACT_INFO.emailLink}
                className="w-full h-[52px] px-8 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-cta flex items-center justify-center gap-2.5"
                aria-label="Send Email to Majisa Cosmetics"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email</span>
              </a>
            </div>
          </div>

          {/* Card 2: Official Phone & WhatsApp Details */}
          <div className="bg-white rounded-[32px] p-8 sm:p-9 border border-[#D4E5E3] shadow-card space-y-6 transition-all hover:shadow-hover">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#DDF3F2] flex items-center justify-center text-[#128F92] shrink-0 shadow-sm border border-[#BCE7E5]">
                <Phone className="w-7 h-7 stroke-[1.9]" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-extrabold text-[#128F92] block">
                  Official Phone &amp; WhatsApp
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#0B4145] font-bold">
                  Direct Line
                </h2>
              </div>
            </div>

            <p className="text-sm text-[#687F8D] font-medium leading-relaxed">
              Connect directly with our customer concierge for immediate consultations and order support.
            </p>

            <div className="p-4 rounded-2xl bg-[#F0F9F8] border border-[#DDF3F2]">
              <span className="text-xs font-extrabold text-[#687F8D] uppercase tracking-wider block mb-1">
                Telephone &amp; WhatsApp Number
              </span>
              <a
                href={CONTACT_INFO.phoneLink}
                className="text-xl sm:text-2xl font-bold text-[#0B4145] hover:text-[#128F92] transition-colors"
                aria-label={`Call ${CONTACT_INFO.businessName} at ${CONTACT_INFO.phone}`}
              >
                {CONTACT_INFO.phone}
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {/* Call Now button */}
              <a
                href={CONTACT_INFO.phoneLink}
                className="flex-1 h-[52px] px-6 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-cta flex items-center justify-center gap-2"
                aria-label="Call Majisa Cosmetics Now"
              >
                <Phone className="w-4 h-4" />
                <span>Call Now</span>
              </a>

              {/* WhatsApp button */}
              <a
                href={CONTACT_INFO.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-[52px] px-6 rounded-full bg-[#0B4145] hover:bg-[#128F92] text-white text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-card flex items-center justify-center gap-2"
                aria-label="Chat with Majisa Cosmetics on WhatsApp"
              >
                <MessageCircle className="w-4 h-4 text-[#DDF3F2]" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Card 3: Official Store Address & Hours Details */}
          <div className="bg-white rounded-[32px] p-8 sm:p-9 border border-[#D4E5E3] shadow-card space-y-6 transition-all hover:shadow-hover">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#DDF3F2] flex items-center justify-center text-[#128F92] shrink-0 shadow-sm border border-[#BCE7E5]">
                <MapPin className="w-7 h-7 stroke-[1.9]" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-extrabold text-[#128F92] block">
                  Store Location
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#0B4145] font-bold">
                  Visit Our Store
                </h2>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0F9F8] border border-[#DDF3F2] text-[#0B4145] text-xs font-bold">
              <span>Shopping &amp; retail &bull; Nail Salon &bull; Beauty Salon</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F0F9F8] border border-[#DDF3F2] space-y-2">
              <span className="text-xs font-extrabold text-[#687F8D] uppercase tracking-wider block">
                Detailed Store Address
              </span>
              <p className="text-sm sm:text-base font-bold text-[#102F32] leading-relaxed">
                {CONTACT_INFO.address.line1}, <br />
                {CONTACT_INFO.address.line2}, <br />
                {CONTACT_INFO.address.city}, {CONTACT_INFO.address.state} &ndash; {CONTACT_INFO.address.pincode}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F0F9F8] border border-[#DDF3F2] flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#128F92] shrink-0" />
              <div>
                <span className="text-xs font-extrabold text-[#687F8D] uppercase tracking-wider block">
                  Business Hours
                </span>
                <span className="text-sm font-bold text-[#0B4145]">
                  Thursday &amp; Daily: {CONTACT_INFO.hours}
                </span>
              </div>
            </div>

            <div>
              <a
                href={CONTACT_INFO.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-[52px] px-8 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-cta flex items-center justify-center gap-2.5"
                aria-label={`Get directions to ${CONTACT_INFO.businessName} on Google Maps`}
              >
                <Navigation className="w-4 h-4" />
                <span>Get Directions on Google Maps</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right: Contact Form in Distinct White Card */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-[#D4E5E3] shadow-card">
            <h3 className="font-serif text-2xl sm:text-3xl text-[#0B4145] font-bold mb-2">
              Send an Inquiry
            </h3>
            <p className="text-sm text-[#687F8D] mb-6 font-medium">
              Complete the form below and an advisor from our client services suite will respond within 24 hours.
            </p>

            {isSubmitted ? (
              <div className="p-8 text-center bg-[#F0F9F8] rounded-3xl border border-[#DDF3F2] space-y-4 animate-in fade-in">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#128F92] text-white flex items-center justify-center shadow-cta">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-serif text-2xl font-bold text-[#0B4145]">
                  Inquiry Dispatched Successfully
                </h4>
                <p className="text-sm text-[#687F8D] max-w-md mx-auto leading-relaxed font-medium">
                  Thank you for contacting Majisa Cosmetics. A dedicated concierge specialist will review your request and get in touch shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="mt-2 h-[48px] px-8 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs uppercase tracking-wider font-bold shadow-cta transition-all"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Princess Sharma"
                      className={`w-full px-4 py-3.5 bg-[#F0F9F8] border rounded-2xl text-sm text-[#102F32] placeholder-[#687F8D]/60 focus:outline-none focus:border-[#128F92] font-semibold transition-colors ${
                        errors.name ? 'border-red-500 bg-red-50/20' : 'border-[#DDF3F2]'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. royal@domain.com"
                      className={`w-full px-4 py-3.5 bg-[#F0F9F8] border rounded-2xl text-sm text-[#102F32] placeholder-[#687F8D]/60 focus:outline-none focus:border-[#128F92] font-semibold transition-colors ${
                        errors.email ? 'border-red-500 bg-red-50/20' : 'border-[#DDF3F2]'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1.5">
                    Inquiry Subject *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Shade consultation / Order enquiry"
                    className={`w-full px-4 py-3.5 bg-[#F0F9F8] border rounded-2xl text-sm text-[#102F32] placeholder-[#687F8D]/60 focus:outline-none focus:border-[#128F92] font-semibold transition-colors ${
                      errors.subject ? 'border-red-500 bg-red-50/20' : 'border-[#DDF3F2]'
                    }`}
                  />
                  {errors.subject && (
                    <p className="text-xs text-red-600 mt-1">{errors.subject}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1.5">
                    Your Message *
                  </label>
                  <textarea
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Please provide the details of your inquiry..."
                    className={`w-full px-4 py-3.5 bg-[#F0F9F8] border rounded-2xl text-sm text-[#102F32] placeholder-[#687F8D]/60 focus:outline-none focus:border-[#128F92] font-semibold transition-colors ${
                      errors.message ? 'border-red-500 bg-red-50/20' : 'border-[#DDF3F2]'
                    }`}
                  />
                  {errors.message && (
                    <p className="text-xs text-red-600 mt-1">{errors.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto h-[56px] px-10 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-widest font-bold transition-all shadow-cta flex items-center justify-center gap-2.5 group disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <span>Transmit Message</span>
                      <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}