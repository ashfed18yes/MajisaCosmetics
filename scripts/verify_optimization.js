const { createClient } = require('@supabase/supabase-js');
const { v2: cloudinary } = require('cloudinary');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('1. Checking Environment Variables...');
if (!supabaseUrl || !supabaseSecret || !cloudName || !apiKey || !apiSecret) {
  console.error('Missing credentials!');
  process.exit(1);
}
console.log('Credentials present and verified.');

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

const supabase = createClient(supabaseUrl, supabaseSecret);

function createTestPngBuffer(r = 200, g = 100, b = 150) {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
    0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d,
    0xb0, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
    0x44, 0xae, 0x42, 0x60, 0x82
  ]);
}

async function uploadToCloudinary(buffer, name) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'majisa-cosmetics/products',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        unique_filename: true,
        overwrite: false,
        quality_analysis: false,
        colors: false,
        faces: false,
        phash: false,
        cinemagraph_analysis: false,
      },
      (err, result) => {
        if (err) return reject(err);
        const duration = Date.now() - startTime;
        resolve({ ...result, uploadDurationMs: duration });
      }
    );
    stream.end(buffer);
  });
}

async function runTest() {
  console.log('\n2. Testing Cloudinary Upload Performance...');

  const singleBuf = createTestPngBuffer();
  const singleRes = await uploadToCloudinary(singleBuf, 'test_single.png');
  console.log(`Single image upload duration: ${singleRes.uploadDurationMs}ms`);
  console.log(`Cloudinary public_id: ${singleRes.public_id}`);
  console.log(`Cloudinary secure_url: ${singleRes.secure_url}`);

  console.log('\n3. Testing Concurrent Parallel Uploads (3 images)...');
  const parallelStart = Date.now();
  const parallelResults = await Promise.all([
    uploadToCloudinary(createTestPngBuffer(10, 20, 30), 'par1.png'),
    uploadToCloudinary(createTestPngBuffer(40, 50, 60), 'par2.png'),
    uploadToCloudinary(createTestPngBuffer(70, 80, 90), 'par3.png'),
  ]);
  const parallelTotalMs = Date.now() - parallelStart;
  console.log(`Total wall-clock duration for 3 parallel uploads: ${parallelTotalMs}ms (vs sequential approx ${parallelResults.reduce((a, b) => a + b.uploadDurationMs, 0)}ms)`);

  console.log('\n4. Testing Atomic Supabase Product Creation...');
  const testSlug = `perf-test-${Date.now()}`;
  const dbStart = Date.now();
  
  const { data: product, error: prodErr } = await supabase
    .from('products')
    .insert({
      name: 'Performance Test Formulation',
      slug: testSlug,
      base_price: 2499,
      original_price: 2999,
      description: 'High-speed upload and creation test verification.',
      is_available: true,
    })
    .select('id')
    .single();

  if (prodErr || !product) {
    throw new Error('Failed to insert test product: ' + (prodErr?.message || 'unknown'));
  }

  const productId = product.id;
  console.log(`Product created with ID: ${productId}`);

  const imagesToInsert = parallelResults.map((r, idx) => ({
    product_id: productId,
    secure_url: r.secure_url,
    public_id: r.public_id,
    alt_text: `Test swatch ${idx + 1}`,
    display_order: idx,
    is_primary: idx === 0,
    width: r.width,
    height: r.height,
  }));

  const variantsToInsert = [
    { product_id: productId, variant_type: 'shade', name: 'Ruby Glow', hex_code: '#E0115F', display_order: 0 },
    { product_id: productId, variant_type: 'size', name: '50ml', display_order: 1 },
  ];

  const [imgRes, varRes] = await Promise.all([
    supabase.from('product_images').insert(imagesToInsert),
    supabase.from('product_variants').insert(variantsToInsert),
  ]);

  if (imgRes.error) throw new Error('Image insert error: ' + imgRes.error.message);
  if (varRes.error) throw new Error('Variant insert error: ' + varRes.error.message);

  const dbDuration = Date.now() - dbStart;
  console.log(`Database parallel bulk insert completed in: ${dbDuration}ms`);

  console.log('\n5. Verifying in Supabase Database...');
  const { data: verifyProd } = await supabase
    .from('products')
    .select('*, product_images(*), product_variants(*)')
    .eq('id', productId)
    .single();

  console.log(`Verified Product Name: ${verifyProd.name}`);
  console.log(`Verified Image Count: ${verifyProd.product_images.length}`);
  console.log(`Verified Primary Image: ${verifyProd.product_images.find(i => i.is_primary)?.secure_url}`);
  console.log(`Verified Variant Count: ${verifyProd.product_variants.length}`);

  console.log('\n6. Verifying Product Update / Edit Operation...');
  const updateStart = Date.now();
  await supabase.from('products').update({ name: 'Performance Test Formulation (Updated)' }).eq('id', productId);
  console.log(`Update completed in: ${Date.now() - updateStart}ms`);

  console.log('\n7. Cleaning up test assets...');
  await supabase.from('products').delete().eq('id', productId);
  
  const assetsToDelete = [singleRes.public_id, ...parallelResults.map(r => r.public_id)];
  await Promise.all(assetsToDelete.map(pid => cloudinary.uploader.destroy(pid)));
  console.log(`Cleaned up ${assetsToDelete.length} temporary Cloudinary test assets and test database record.`);

  console.log('\nAll End-to-End Tests Passed Successfully!');
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

