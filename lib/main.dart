import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'config.dart';
import 'screens/shell.dart';
import 'services/api.dart';
import 'state/app_state.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: Config.supabaseUrl,
    publishableKey: Config.supabaseAnonKey,
  );
  if (Config.stripePublishableKey.isNotEmpty) {
    Stripe.publishableKey = Config.stripePublishableKey;
    await Stripe.instance.applySettings();
  }
  try {
    await Api.ensureSession();
  } catch (_) {
    // Offline at launch: the menu screen shows a retry state.
  }

  final prefs = await SharedPreferences.getInstance();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LangState(prefs)),
        ChangeNotifierProvider(create: (_) => CartState()),
        ChangeNotifierProvider(create: (_) => MenuState()..load()),
        Provider(create: (_) => ProfileStore(prefs)),
      ],
      child: const BestFoodsApp(),
    ),
  );
}

class BestFoodsApp extends StatelessWidget {
  const BestFoodsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Best Foods',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.system,
      home: const Shell(),
    );
  }
}
