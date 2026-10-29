/**
 * Official Business Contact Details for Majisa Cosmetics
 * Centralized configuration used across the entire storefront.
 */

export const CONTACT_INFO = {
  businessName: 'Majisa Cosmetics',
  email: 'majisacosmeticsales@gmail.com',
  phone: '+91 6377482039',
  phoneDisplay: '+91 6377482039',
  phoneRaw: '+916377482039',
  emailLink: 'mailto:majisacosmeticsales@gmail.com',
  phoneLink: 'tel:+916377482039',
  whatsappLink: 'https://wa.me/916377482039',
  address: {
    line1: 'Shop No. 02, 03, Sai Vatika Complex',
    line2: 'Near by Sahyog Hotel, Tathitheya, Kadodara Char Rasta, Bardoli Road',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '394305',
    full: 'Shop no 02,03 sai vatika complex near by sahyog hotel tathitheya kadodara char rasta bardoli road Surat Gujarat 394305',
    formatted: 'Shop No. 02, 03, Sai Vatika Complex, Near by Sahyog Hotel, Tathitheya, Kadodara Char Rasta, Bardoli Road, Surat, Gujarat 394305',
  },
  hours: '9:00 AM - 6:00 PM',
  mapLink: 'https://www.google.com/maps/search/?api=1&query=Shop+no+02%2C03+sai+vatika+complex+near+by+sahyog+hotel+tathitheya+kadodara+char+rasta+bardoli+road+Surat+Gujarat+394305',
  whatsappOrderLink: (orderId?: string) =>
    orderId
      ? `https://wa.me/916377482039?text=Hello%20Majisa%20Cosmetics%2C%20I%20have%20an%20inquiry%20regarding%20my%20order%20${encodeURIComponent(orderId)}`
      : 'https://wa.me/916377482039',
  emailOrderLink: (orderId?: string) =>
    orderId
      ? `mailto:majisacosmeticsales@gmail.com?subject=Order%20Inquiry%20-%20${encodeURIComponent(orderId)}`
      : 'mailto:majisacosmeticsales@gmail.com',
} as const;

export default CONTACT_INFO;
