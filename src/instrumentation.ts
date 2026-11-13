/**
 * Next.js server lifecycle instrumentation hook.
 *
 * CRITICAL NETWORKING OPTIMIZATION:
 * Sets Node.js default DNS resolution order to 'ipv4first'.
 *
 * Why this is essential:
 * In Node.js 18+, the default DNS resolution order is 'verbatim' (IPv6 first).
 * On networks where IPv6 is advertised or partially routed, outgoing TLS/HTTPS requests
 * to Supabase (*.supabase.co) and Cloudinary (*.cloudinary.com) stall for 10 to 45 seconds
 * waiting for IPv6 SYN packets to time out before falling back to IPv4.
 * Setting 'ipv4first' permanently eliminates these 10-45 second stalls on all outgoing connections.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const dns = await import('dns');
      dns.setDefaultResultOrder('ipv4first');
    } catch (e) {
      console.warn('Failed to set DNS resolution order to ipv4first:', e);
    }
  }
}
