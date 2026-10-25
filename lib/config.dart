// Values are injected at build time:
// flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=... \
//   --dart-define=STRIPE_PUBLISHABLE_KEY=...
class Config {
  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  static const stripePublishableKey =
      String.fromEnvironment('STRIPE_PUBLISHABLE_KEY');
}

class Restaurant {
  static const name = 'Best Foods';
  static const phone = '946 290 937';
  static const email = 'hola@bestfoods.es';
  static const hoursLunch = '12:30 – 16:30';
  static const hoursDinner = '19:00 – 00:30';
  static const deliveryMin = 12;
  static const freeDeliveryOver = 15.0;
  static const deliveryFee = 1.5;
  static const heroImage =
      'https://images.unsplash.com/photo-1639737611208-a01d87b78605?w=800&h=600&fit=crop';
}
